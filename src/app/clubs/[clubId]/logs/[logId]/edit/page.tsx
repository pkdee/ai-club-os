import type { Metadata } from "next";

import { AiLogUnavailable } from "@/features/ai-log/components/ai-log-detail";
import { AiLogForm } from "@/features/ai-log/components/ai-log-form";
import { draftKey } from "@/features/ai-log/draft";
import { getAiLog, listClubTools } from "@/features/ai-log/queries";
import { toSessionOptions } from "@/features/ai-log/session-options";
import { loadClubPage } from "@/features/club/page-data";
import { listProjects } from "@/features/project/queries";
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

  const [sessions, tools, projectList] = await Promise.all([
    listSessions(clubId),
    listClubTools(clubId),
    listProjects(clubId),
  ]);
  // 내가 참여하는 Project 와, 이미 묶여 있는 Project 를 고를 수 있다.
  // 참여를 그만둔 뒤에도 묶어 둔 것은 그대로 둘 수 있어야 해서 함께 넣는다.
  // AI Log 와의 연결이 아직 없으면 고르는 칸을 그리지 않는다. 그려 두면 없는 열을 보내 저장이 실패한다.
  const projects =
    projectList.status === "ok" && projectList.logsLinked
      ? projectList.projects
          .filter(
            (project) =>
              project.id === log.project?.id ||
              project.participants.some((item) => item.userId === data.user.id)
          )
          .map((project) => ({ id: project.id, name: project.name }))
      : null;

  return (
    <AiLogForm
      target={{ clubId, logId: log.id }}
      clubName={data.club.name}
      defaults={{
        sessionId: log.session?.id ?? "",
        projectId: log.project?.id ?? "",
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
      projects={projects}
      knownTools={tools.status === "ok" ? tools.tools.map((tool) => tool.name) : []}
      cancelHref={`/clubs/${clubId}/logs/${log.id}`}
      draftKey={draftKey(data.user.id, clubId, log.id)}
    />
  );
}
