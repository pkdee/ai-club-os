import type { Metadata } from "next";

import { AiLogForm } from "@/features/ai-log/components/ai-log-form";
import {
  defaultSessionId,
  toSessionOptions,
} from "@/features/ai-log/session-options";
import { loadClubPage } from "@/features/club/page-data";
import { listSessions } from "@/features/session/queries";

export const metadata: Metadata = {
  title: "AI Log 쓰기 | AI Club OS",
};

export default async function AiLogNewPage(
  props: PageProps<"/clubs/[clubId]/logs/new">
) {
  const { clubId } = await props.params;
  const query = await props.searchParams;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const result = await listSessions(clubId);
  const sessions = result.status === "ok" ? result.sessions : null;
  const sessionId = sessions
    ? defaultSessionId(sessions, query.session, new Date())
    : "";

  return (
    <AiLogForm
      target={{ clubId }}
      clubName={data.club.name}
      defaults={{
        sessionId,
        title: "",
        tools: [],
        attempt: "",
        result: "",
        learned: "",
        nextAction: "",
      }}
      sessions={sessions ? toSessionOptions(sessions) : null}
      // Session 에서 들어왔으면 취소할 때 그 회차의 AI Log 로 돌아간다.
      cancelHref={
        sessionId && query.session === sessionId
          ? `/clubs/${clubId}/sessions/${sessionId}/logs`
          : `/clubs/${clubId}/logs`
      }
    />
  );
}
