import type { Metadata } from "next";

import { loadClubPage } from "@/features/club/page-data";
import { RetrospectiveHub } from "@/features/retrospective/components/retrospective-hub";
import {
  countMonthRetrospectives,
  getMyJoinedAt,
  listRecentRetrospectives,
} from "@/features/retrospective/queries";
import { retrospectiveMonths } from "@/features/retrospective/rules";

export const metadata: Metadata = {
  title: "회고 | AI Club OS",
};

// 한 화면에 보여 주는 최근 회고 수.
const RECENT_LIMIT = 10;

export default async function RetrospectivesPage(
  props: PageProps<"/clubs/[clubId]/retros">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const now = new Date();
  const joinedAt = await getMyJoinedAt(clubId, data.user.id);
  const months = retrospectiveMonths(now, joinedAt);
  const [counts, recent] = await Promise.all([
    countMonthRetrospectives(clubId, data.user.id, months[months.length - 1]),
    listRecentRetrospectives(clubId, RECENT_LIMIT),
  ]);

  return (
    <RetrospectiveHub
      clubId={clubId}
      months={months}
      counts={counts}
      recent={recent}
      now={now}
    />
  );
}
