import type { Metadata } from "next";

import { AiLogListScreen } from "@/features/ai-log/components/ai-log-list-screen";
import { parseLogFilters } from "@/features/ai-log/filters";
import { toolKey } from "@/features/ai-log/rules";
import { knownToolName } from "@/features/ai-log/tool-catalog";
import {
  countClubLogs,
  listClubTools,
  searchClubLogs,
} from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";
import { listSessions } from "@/features/session/queries";

export const metadata: Metadata = {
  title: "AI Log | AI Club OS",
};

export default async function AiLogListPage(
  props: PageProps<"/clubs/[clubId]/logs">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const requested = parseLogFilters(await props.searchParams);
  const tools = await listClubTools(clubId);
  const toolNames = tools.status === "ok" ? tools.tools.map((tool) => tool.name) : [];
  // 주소로 받은 도구를 정해 둔 표기나 Club 에서 쓰는 표기에 맞춘다. 목록에 없는 도구도 고른 값이 칸에 보이게 한다.
  const requestedTool = requested.tool
    ? (knownToolName(requested.tool) ?? requested.tool)
    : null;
  const selectedTool = requestedTool
    ? (toolNames.find((name) => toolKey(name) === toolKey(requestedTool)) ??
      requestedTool)
    : null;
  if (selectedTool && !toolNames.includes(selectedTool)) {
    toolNames.unshift(selectedTool);
  }
  const filters = { ...requested, tool: selectedTool };

  const [result, allCount, mineCount, sessions] = await Promise.all([
    searchClubLogs(clubId, filters, data.user.id),
    countClubLogs(clubId, null),
    countClubLogs(clubId, data.user.id),
    listSessions(clubId),
  ]);

  return (
    <AiLogListScreen
      clubId={clubId}
      filters={filters}
      result={result}
      counts={{ all: allCount, mine: mineCount }}
      // 고르는 칸에는 최근 회차가 위에 오게 한다.
      sessions={
        sessions.status === "ok"
          ? [...sessions.sessions]
              .reverse()
              .map((session) => ({ id: session.id, title: session.title }))
          : []
      }
      tools={toolNames}
      now={new Date()}
    />
  );
}
