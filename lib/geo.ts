const EARTH_RADIUS_M = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const KST_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Returns YYYY-MM-DD in Asia/Seoul timezone. */
export function kstDateStamp(date: Date = new Date()): string {
  return KST_FORMATTER.format(date);
}

/** Returns [startUtc, endUtc) covering the given KST calendar day. */
export function kstDayBounds(dateStamp: string): { start: Date; end: Date } {
  const start = new Date(`${dateStamp}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Returns [startUtc, endUtc) covering the KST month containing `date`. */
export function kstMonthBounds(date: Date = new Date()): {
  start: Date;
  end: Date;
  year: number;
  month: number;
} {
  const stamp = kstDateStamp(date);
  const [year, month] = stamp.split("-").map(Number);
  const start = new Date(`${stamp.slice(0, 7)}-01T00:00:00+09:00`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`
  );
  return { start, end, year, month };
}
