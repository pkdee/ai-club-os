import type { Metadata } from "next";

import { InsightListScreen } from "@/features/ai-insight/components/insight-list-screen";
import { listClubInsights } from "@/features/ai-insight/queries";
import { loadClubPage } from "@/features/club/page-data";

export const metadata: Metadata = {
  title: "AI Insight | AI Club OS",
};

export default async function InsightListPage(
  props: PageProps<"/clubs/[clubId]/insights">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  return (
    <InsightListScreen
      clubId={clubId}
      canManage={data.club.role === "admin"}
      result={await listClubInsights(clubId)}
      now={new Date()}
    />
  );
}
