import type { Metadata } from "next";

import { InsightListScreen } from "@/features/ai-insight/components/insight-list-screen";
import {
  listClubInsights,
  listLogMonths,
} from "@/features/ai-insight/queries";
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

  const canManage = data.club.role === "admin";
  const now = new Date();
  // 달을 고르는 줄은 운영자에게만 보이므로 운영자일 때만 읽는다.
  const [result, months] = await Promise.all([
    listClubInsights(clubId),
    canManage ? listLogMonths(clubId, now) : [],
  ]);

  return (
    <InsightListScreen
      clubId={clubId}
      canManage={canManage}
      result={result}
      months={months}
      now={now}
    />
  );
}
