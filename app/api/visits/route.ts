import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { STORE_LAT, STORE_LNG, STORE_RADIUS_M } from "@/lib/constants";
import { getVisitsForUserInRange, recordVisit } from "@/lib/db/queries";
import { haversineMeters, kstDateStamp, kstDayBounds } from "@/lib/geo";

const bodySchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (_e) {
    return NextResponse.json({ error: "잘못된 좌표입니다." }, { status: 400 });
  }

  const distance = haversineMeters(parsed, { lat: STORE_LAT, lng: STORE_LNG });
  if (distance > STORE_RADIUS_M) {
    return NextResponse.json(
      {
        error: "매장 근처에서만 출석 체크가 가능합니다.",
        distanceMeters: Math.round(distance),
      },
      { status: 403 }
    );
  }

  const today = kstDateStamp();
  const { start, end } = kstDayBounds(today);
  const existing = await getVisitsForUserInRange({
    userId: session.user.id,
    start,
    end,
  });
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "오늘은 이미 출석 체크가 완료되었어요.", visit: existing[0] },
      { status: 409 }
    );
  }

  const created = await recordVisit({
    userId: session.user.id,
    lat: parsed.lat,
    lng: parsed.lng,
  });

  return NextResponse.json({ visit: created }, { status: 201 });
}
