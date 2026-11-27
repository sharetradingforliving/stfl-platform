import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import ReviewWorkspace from "@/components/vedha/ReviewWorkspace";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vedha Review Workspace",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { userId } = await auth();
  if (
    !userId ||
    !(process.env.VEDHA_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .includes(userId)
  )
    notFound();
  return <ReviewWorkspace />;
}
