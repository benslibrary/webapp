import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}

async function Redirector() {
  const session = await auth();
  if (session?.user) {
    redirect("/me");
  }
  redirect("/login");
}
