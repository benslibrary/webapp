import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { BottomNav } from "@/components/bottom-nav";
import { listPosts } from "@/lib/db/queries";
import { PostItCard } from "./post-it-card";

export default function BoardPage() {
  return (
    <>
      <Suspense fallback={<BoardSkeleton />}>
        <BoardContent />
      </Suspense>
      <BottomNav />
    </>
  );
}

async function BoardContent() {
  const session = await auth();
  const posts = await listPosts({ limit: 50 });

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col pb-32">
        <header className="flex items-center justify-between px-7 pt-12">
          <div>
            <h1 className="font-bold text-[26px] text-white">게시판</h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              필사, 후기, 짧은 메모를 남겨주세요.
            </p>
          </div>
          {session?.user ? (
            <Link
              className="rounded-full bg-white px-4 py-2 font-bold text-[13px] text-black active:scale-95"
              href="/board/new"
            >
              + 쓰기
            </Link>
          ) : (
            <Link
              className="rounded-full border border-zinc-700 px-4 py-2 font-bold text-[13px] text-zinc-300 active:scale-95"
              href="/login?callbackUrl=/board"
            >
              로그인
            </Link>
          )}
        </header>

        {posts.length === 0 ? (
          <div className="mt-16 px-7 text-center">
            <p className="text-[15px] text-zinc-500">
              아직 작성된 글이 없어요.
              <br />
              첫 메모를 남겨보세요.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 px-5">
            {posts.map((p, i) => (
              <PostItCard
                authorNickname={p.authorNickname}
                bookTitle={p.bookTitle}
                content={p.content}
                createdAt={p.createdAt}
                index={i}
                key={p.id}
                kind={p.kind}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function BoardSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-5 pt-12">
        <div className="mb-8 h-10 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => i).map((i) => (
            <div
              className="h-40 animate-pulse rounded-2xl bg-zinc-900"
              key={i}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
