/**
 * Wrapper around 국립중앙도서관 Open API. See docs/NAT_LIB_API.md.
 * Currently we only use the ISBN 서지정보 endpoint (SearchApi.do); add
 * search.do, saseoApi.do, etc. here if/when the product needs them.
 */
const SEOJI_URL = "https://www.nl.go.kr/seoji/SearchApi.do";

export type BookMetadata = {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  publishDate: string | null; // YYYYMMDD
  coverImageUrl: string | null;
  description: string | null;
  kdc: string | null;
};

export type LookupResult =
  | { ok: true; metadata: BookMetadata }
  | { ok: false; reason: string };

const ISBN_DIGIT_REGEX = /[^0-9]/g;

export function normalizeIsbn(raw: string): string | null {
  const digits = raw.replace(ISBN_DIGIT_REGEX, "");
  if (digits.length === 10 || digits.length === 13) {
    return digits;
  }
  return null;
}

type SeojiDoc = {
  TITLE?: string;
  AUTHOR?: string;
  EA_ISBN?: string;
  SET_ISBN?: string;
  PUBLISHER?: string;
  PUBLISH_PREDATE?: string;
  TITLE_URL?: string;
  BOOK_INTRODUCTION_URL?: string;
  KDC?: string;
};

type SeojiResponse = {
  PAGE_NO?: string;
  TOTAL_COUNT?: string;
  docs?: SeojiDoc[];
  ERROR_CODE?: string;
  MESSAGE?: string;
};

function pickDocForIsbn(
  docs: SeojiDoc[],
  normalizedIsbn: string
): SeojiDoc | undefined {
  // Prefer a doc whose EA_ISBN matches; fall back to the first non-empty doc.
  const exact = docs.find((d) => d.EA_ISBN === normalizedIsbn);
  if (exact) {
    return exact;
  }
  return docs.find((d) => d.TITLE && d.TITLE.trim().length > 0);
}

function trimOrNull(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Look up a single book by ISBN against the 국립중앙도서관 ISBN
 * service. Returns the normalized fields we cache locally, or a
 * structured failure reason for surfacing in the admin UI.
 */
export async function lookupBookByIsbn(rawIsbn: string): Promise<LookupResult> {
  const normalized = normalizeIsbn(rawIsbn);
  if (!normalized) {
    return {
      ok: false,
      reason: "ISBN 형식이 올바르지 않습니다 (10/13자리 숫자)",
    };
  }

  const apiKey = process.env.NAT_LIB_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "NAT_LIB_API_KEY 환경변수가 설정되어 있지 않습니다",
    };
  }

  const url = new URL(SEOJI_URL);
  url.searchParams.set("cert_key", apiKey);
  url.searchParams.set("result_style", "json");
  url.searchParams.set("page_no", "1");
  url.searchParams.set("page_size", "10");
  url.searchParams.set("isbn", normalized);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      // Catalog refresh isn't latency-critical; let Next cache the
      // upstream response briefly to absorb retries within a session.
      next: { revalidate: 60 },
    });
  } catch (_error) {
    return { ok: false, reason: "국립중앙도서관 서버에 접속할 수 없습니다" };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: `국립중앙도서관 응답 오류 (HTTP ${res.status})`,
    };
  }

  let body: SeojiResponse;
  try {
    body = (await res.json()) as SeojiResponse;
  } catch (_error) {
    return { ok: false, reason: "응답을 JSON으로 해석할 수 없습니다" };
  }

  if (body.ERROR_CODE && body.ERROR_CODE !== "0") {
    return {
      ok: false,
      reason: `국립중앙도서관 오류: ${body.MESSAGE ?? body.ERROR_CODE}`,
    };
  }

  const docs = body.docs ?? [];
  if (docs.length === 0) {
    return { ok: false, reason: "해당 ISBN에 대한 서지정보를 찾지 못했습니다" };
  }

  const doc = pickDocForIsbn(docs, normalized);
  if (!doc) {
    return { ok: false, reason: "응답 docs가 비어 있습니다" };
  }

  const title = trimOrNull(doc.TITLE);
  if (!title) {
    return { ok: false, reason: "서지정보에 제목이 없습니다" };
  }

  return {
    ok: true,
    metadata: {
      isbn: trimOrNull(doc.EA_ISBN) ?? normalized,
      title,
      author: trimOrNull(doc.AUTHOR),
      publisher: trimOrNull(doc.PUBLISHER),
      publishDate: trimOrNull(doc.PUBLISH_PREDATE),
      coverImageUrl: trimOrNull(doc.TITLE_URL),
      description: trimOrNull(doc.BOOK_INTRODUCTION_URL),
      kdc: trimOrNull(doc.KDC),
    },
  };
}
