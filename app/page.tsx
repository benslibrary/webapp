import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { LibraryFlow } from "./library-flow";

export default function Page() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

async function PageContent() {
  const session = await auth();
  if (session?.user) {
    redirect("/archive");
  }
  return <LibraryFlow />;
}

function LandingSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 py-12">
        <div className="mt-20 h-12 w-3/4 animate-pulse rounded bg-zinc-900" />
        <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-zinc-900" />
      </div>
    </main>
  );
}
