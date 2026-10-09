import type { Metadata } from "next";

import { AiLogUnavailable } from "@/features/ai-log/components/ai-log-detail";
import { AiLogForm } from "@/features/ai-log/components/ai-log-form";
import { getAiLog } from "@/features/ai-log/queries";
import { toSessionOptions } from "@/features/ai-log/session-options";
import { loadClubPage } from "@/features/club/page-data";
import { listSessions } from "@/features/session/queries";

export const metadata: Metadata = {
  title: "AI Log 수정 | AI Club OS",
};

export default async function AiLogEditPage(
  props: PageProps<"/clubs/[clubId]/logs/[logId]/edit">
) {
  const { clubId, logId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const result = await getAiLog(clubId, logId);
  if (result.status !== "ok") {
    return <AiLogUnavailable clubId={clubId} reason={result.status} />;
  }

  const { log } = result;
  // 화면에서 먼저 막는다. 실제 판단은 데이터베이스의 접근 규칙이 한다.
  if (log.author?.userId !== data.user.id) {
    return <AiLogUnavailable clubId={clubId} reason="not-author" />;
  }

  const sessions = await listSessions(clubId);

  return (
    <AiLogForm
      target={{ clubId, logId: log.id }}
      clubName={data.club.name}
      defaults={{
        sessionId: log.session?.id ?? "",
        title: log.title,
        tools: log.tools,
        attempt: log.attempt,
        result: log.result,
        learned: log.learned,
        nextAction: log.nextAction,
      }}
      sessions={
        sessions.status === "ok" ? toSessionOptions(sessions.sessions) : null
      }
      cancelHref={`/clubs/${clubId}/logs/${log.id}`}
    />
  );
}
