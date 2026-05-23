import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, signOut } from "@/app/(auth)/auth";
import { BottomNav } from "@/components/bottom-nav";

export default function MePage() {
  return (
    <>
      <Suspense fallback={<MeSkeleton />}>
        <MeContent />
      </Suspense>
      <BottomNav />
    </>
  );
}

async function MeContent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/me");
  }

  const { nickname, realName, email, profileImage, role } = session.user;

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <h1 className="font-bold text-[26px] text-white">내 정보</h1>

        <section className="mt-8 flex items-center gap-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-6">
          {profileImage ? (
            <Image
              alt="프로필 사진"
              className="rounded-full"
              height={64}
              src={profileImage}
              unoptimized
              width={64}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 font-bold text-2xl text-zinc-500">
              {nickname?.slice(0, 1) ?? "?"}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-[18px] text-white">
              {nickname || "닉네임 미설정"}
            </span>
            <span className="text-[12px] text-zinc-500">
              {role === "admin" ? "관리자" : "일반 회원"}
            </span>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-6">
          <ProfileRow label="닉네임" value={nickname} />
          <Divider />
          <ProfileRow label="회원이름" value={realName} />
          <Divider />
          <ProfileRow label="이메일 주소" value={email} />
        </section>

        <p className="mt-4 px-2 text-[11px] text-zinc-600 leading-relaxed">
          위 정보는 네이버 로그인 시 동의하신 항목입니다. 추가 항목(회원이름,
          이메일 주소)은 동의하지 않으셨다면 "미제공"으로 표시됩니다.
        </p>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-8"
        >
          <button
            className="w-full rounded-[24px] border border-zinc-800 py-4 font-medium text-[15px] text-zinc-400 transition-all active:scale-[0.97]"
            type="submit"
          >
            로그아웃
          </button>
        </form>
      </div>
    </main>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-[12px] text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[15px] text-white">
        {value ? value : <span className="text-zinc-700">미제공</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-zinc-900" />;
}

function MeSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-24 animate-pulse rounded-[24px] bg-zinc-900" />
        <div className="mt-6 h-40 animate-pulse rounded-[24px] bg-zinc-900" />
      </div>
    </main>
  );
}
