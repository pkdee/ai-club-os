import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TopBar } from "@/features/auth/components/top-bar";
import { getCurrentUser } from "@/features/auth/session";
import { JoinScreen } from "@/features/member/components/join-screen";
import { previewInvite } from "@/features/member/invite";

export const metadata: Metadata = {
  title: "Club 초대 | AI Club OS",
};

// 초대 링크가 여는 화면. 로그인하지 않았으면 proxy 가 먼저 로그인 화면으로 보내고, 로그인한 뒤 여기로 돌아온다.
export default async function JoinPage(props: PageProps<"/join/[token]">) {
  const { token } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const result = await previewInvite(token);
  // 이미 참여한 Club 이면 다시 물어보지 않고 바로 들어간다.
  if (result.status === "ok" && result.preview.alreadyMember) {
    redirect(`/clubs/${result.preview.clubId}`);
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <TopBar user={user} />
      <JoinScreen token={token} result={result} user={user} />
    </div>
  );
}
