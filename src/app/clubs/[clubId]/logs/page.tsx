import type { Metadata } from "next";

import { AiLogListScreen } from "@/features/ai-log/components/ai-log-list-screen";
import { logLimit } from "@/features/ai-log/paging";
import { countClubLogs, listClubLogs } from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";

export const metadata: Metadata = {
  title: "AI Log | AI Club OS",
};

export default async function AiLogListPage(
  props: PageProps<"/clubs/[clubId]/logs">
) {
  const { clubId } = await props.params;
  const query = await props.searchParams;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const mine = query.view === "mine";
  const limit = logLimit(query.n);
  // 보고 있는 쪽의 수는 목록과 함께 오므로 반대쪽 수만 따로 센다.
  const [result, otherCount] = await Promise.all([
    listClubLogs(clubId, limit, mine ? data.user.id : null),
    countClubLogs(clubId, mine ? null : data.user.id),
  ]);
  const shownCount = result.status === "ok" ? result.total : null;

  return (
    <AiLogListScreen
      clubId={clubId}
      view={mine ? "mine" : "all"}
      result={result}
      counts={{
        all: mine ? otherCount : shownCount,
        mine: mine ? shownCount : otherCount,
      }}
      limit={limit}
      now={new Date()}
    />
  );
}
