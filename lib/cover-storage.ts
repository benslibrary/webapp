import "server-only";

import { put } from "@vercel/blob";

const MIN_IMAGE_BYTES = 5000;

function pickExtension(contentType: string): string {
  if (contentType.includes("png")) {
    return "png";
  }
  if (contentType.includes("webp")) {
    return "webp";
  }
  if (contentType.includes("gif")) {
    return "gif";
  }
  return "jpg";
}

/**
 * Fetch a candidate cover image from anywhere (typically NL's TITLE_URL),
 * validate that it's a real image of usable size, and store it in our
 * Vercel Blob bucket under `covers/{isbn}.{ext}`. Returns the public Blob
 * URL or null if the source was unfetchable / a placeholder. Never throws —
 * the catalog still gets added without a cover if this fails.
 */
export async function fetchAndUploadCover(
  isbn: string,
  sourceUrl: string | null | undefined
): Promise<string | null> {
  if (!sourceUrl) {
    return null;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }
  const normalized = sourceUrl.replace(/^http:\/\//, "https://");
  try {
    const res = await fetch(normalized, { redirect: "follow" });
    if (!res.ok) {
      return null;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < MIN_IMAGE_BYTES) {
      return null;
    }
    const blob = await put(`covers/${isbn}.${pickExtension(ct)}`, buf, {
      access: "public",
      contentType: ct,
      allowOverwrite: true,
      addRandomSuffix: false,
    });
    return blob.url;
  } catch {
    return null;
  }
}
