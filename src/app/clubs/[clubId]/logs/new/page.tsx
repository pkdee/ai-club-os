import type { Metadata } from "next";

import { AiLogForm } from "@/features/ai-log/components/ai-log-form";
import { draftKey } from "@/features/ai-log/draft";
import {
  defaultSessionId,
  toSessionOptions,
} from "@/features/ai-log/session-options";
import { hasAiLogOptions, listClubTools } from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";
import { listProjects } from "@/features/project/queries";
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

  const [result, tools, projectList, optionsReady] = await Promise.all([
    listSessions(clubId),
    listClubTools(clubId),
    listProjects(clubId),
    hasAiLogOptions(),
  ]);
  // 내가 참여하는 Project 만 고를 수 있다. Project 를 아직 쓸 수 없거나 AI Log 와의 연결이 아직 없으면
  // 고르는 칸을 그리지 않는다. 칸을 그리면 저장할 때 없는 열을 보내게 되어 저장이 실패한다.
  const projects =
    projectList.status === "ok" && projectList.logsLinked
      ? projectList.projects
          .filter((project) =>
            project.participants.some((item) => item.userId === data.user.id)
          )
          .map((project) => ({ id: project.id, name: project.name }))
      : null;
  const projectId =
    projects?.find((project) => project.id === query.project)?.id ?? "";
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
        projectId,
        title: "",
        tools: [],
        attempt: "",
        result: "",
        learned: "",
        nextAction: "",
      }}
      sessions={sessions ? toSessionOptions(sessions) : null}
      projects={projects}
      // 새 기록의 선택은 둘 다 꺼진 채로 시작한다.
      options={
        optionsReady
          ? { excludeFromInsight: false, shareInPresentation: false }
          : null
      }
      knownTools={tools.status === "ok" ? tools.tools.map((tool) => tool.name) : []}
      // Session 이나 Project 에서 들어왔으면 취소할 때 그곳으로 돌아간다.
      cancelHref={
        sessionId && query.session === sessionId
          ? `/clubs/${clubId}/sessions/${sessionId}/logs`
          : projectId
            ? `/clubs/${clubId}/projects/${projectId}`
            : `/clubs/${clubId}/logs`
      }
      draftKey={draftKey(data.user.id, clubId)}
    />
  );
}
