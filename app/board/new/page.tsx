import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { NewPostForm } from "./new-post-form";

export default function NewPostPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewPostContent />
    </Suspense>
  );
}

async function NewPostContent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/board/new");
  }

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col pb-12">
        <header className="flex items-center justify-between px-7 pt-12">
          <Link
            className="font-medium text-[14px] text-zinc-500"
            href="/board"
          >
            ← 게시판
          </Link>
        </header>
        <h1 className="mt-6 px-7 font-bold text-[26px] text-white">
          오늘의 한 줄
        </h1>
        <p className="mt-1 px-7 text-[13px] text-zinc-500">
          필사, 후기, 또는 짧은 메모를 남겨주세요.
        </p>
        <NewPostForm />
      </div>
    </main>
  );
}

function FormSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    </main>
  );
}
