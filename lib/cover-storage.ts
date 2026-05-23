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
 * Upload an image buffer to our Vercel Blob bucket under
 * covers/{isbn}.{ext} and return the public URL. Returns null if the
 * buffer fails basic sanity checks (too small to be a real cover) or
 * if the Blob token isn't configured. Never throws — callers can fall
 * back to leaving cover null on the row.
 */
export async function uploadCoverBytes(
  isbn: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }
  if (!contentType.startsWith("image/")) {
    return null;
  }
  if (buffer.byteLength < MIN_IMAGE_BYTES) {
    return null;
  }
  try {
    const blob = await put(
      `covers/${isbn}.${pickExtension(contentType)}`,
      buffer,
      {
        access: "public",
        contentType,
        allowOverwrite: true,
        addRandomSuffix: false,
      }
    );
    return blob.url;
  } catch {
    return null;
  }
}

/**
 * Fetch a candidate cover image from an external URL (typically NL's
 * TITLE_URL), validate that it's a real image of usable size, and
 * store it in our Blob bucket. Wraps uploadCoverBytes.
 */
export async function fetchAndUploadCover(
  isbn: string,
  sourceUrl: string | null | undefined
): Promise<string | null> {
  if (!sourceUrl) {
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
    return await uploadCoverBytes(isbn, buf, ct);
  } catch {
    return null;
  }
}
