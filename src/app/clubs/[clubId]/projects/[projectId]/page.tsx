import type { Metadata } from "next";

import { AiLogSection } from "@/features/ai-log/components/ai-log-section";
import { WriteLogLink } from "@/features/ai-log/components/write-log-link";
import { listProjectLogs } from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";
import { listMembers } from "@/features/member/queries";
import { PresentationCard } from "@/features/presentation/components/presentation-card";
import {
  countProjectSharedLogs,
  getProjectPresentation,
} from "@/features/presentation/queries";
import { ProjectSessionsCard } from "@/features/project/components/linked-cards";
import {
  ProjectDetail,
  ProjectUnavailable,
} from "@/features/project/components/project-detail";
import { sessionsOfLogs } from "@/features/project/links";
import {
  getProject,
  getProjectTaskDetails,
  listProjectJoinRequests,
} from "@/features/project/queries";
import { RetrospectiveSection } from "@/features/retrospective/components/retrospective-section";
import { listProjectRetrospectives } from "@/features/retrospective/queries";
import { kstDateKey } from "@/features/session/time";

type Props = PageProps<"/clubs/[clubId]/projects/[projectId]">;

// 한 화면에 보여 주는 이 Project 의 AI Log 수.
const PROJECT_LOG_LIMIT = 50;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, projectId } = await props.params;
  const data = await loadClubPage(clubId);
  const result = data ? await getProject(clubId, projectId) : null;

  return {
    title: `${result?.status === "ok" ? result.project.name : "Project"} | AI Club OS`,
  };
}

export default async function ProjectDetailPage(props: Props) {
  const { clubId, projectId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const result = await getProject(clubId, projectId);
  if (result.status !== "ok") {
    return <ProjectUnavailable clubId={clubId} reason={result.status} />;
  }

  const { project } = result;
  const isAdmin = data.club.role === "admin";
  const isParticipant = project.participants.some(
    (participant) => participant.userId === data.user.id
  );
  const canEdit = isParticipant || isAdmin;
  const now = new Date();
  // 참여자로 넣을 사람을 고르는 목록은 고칠 수 있는 사람에게만 필요하다.
  const [
    members,
    logs,
    taskDetails,
    joinRequests,
    presentation,
    shared,
    retrospectives,
  ] = await Promise.all([
    canEdit ? listMembers(clubId) : null,
    // 기록 수를 세지 못했다면 AI Log 와의 연결이 아직 없는 것이라 기록을 읽지 않는다.
    project.logCount === null ? null : listProjectLogs(clubId, projectId),
    getProjectTaskDetails(clubId, projectId),
      // 고칠 수 있는 사람에게는 들어온 요청이 모두, 다른 Member 에게는 자기 요청만 돌아온다.
      listProjectJoinRequests(clubId, projectId),
      getProjectPresentation(clubId, projectId),
      // 공개하기 전에 기록이 몇 개 나가는지 알리려고 센다. 공개할 수 있는 사람에게만 필요하다.
      canEdit ? countProjectSharedLogs(clubId, projectId) : null,
      listProjectRetrospectives(clubId, projectId),
    ]);
  const joined = new Set(project.participants.map((item) => item.memberId));
  // 이미 참여자가 된 사람의 요청이 남아 있으면 보여 주지 않는다.
  const requests =
    joinRequests.status === "ok"
      ? joinRequests.requests.filter((item) => !joined.has(item.memberId))
      : [];

  return (
    <ProjectDetail
      clubName={data.club.name}
      project={project}
      canEdit={canEdit}
      canDelete={isAdmin || project.createdBy === data.user.id}
      currentUserId={data.user.id}
      candidates={
        members?.status === "ok"
          ? members.members
              .filter((member) => !joined.has(member.id))
              .map((member) => ({ memberId: member.id, name: member.name }))
          : null
      }
      taskDetails={taskDetails}
      today={kstDateKey(now)}
      requests={canEdit ? requests : []}
      // 참여자도 운영자도 아닌 Member 만 참여를 요청한다. 운영자는 스스로를 참여자로 넣을 수 있다.
      myRequest={
        canEdit || joinRequests.status !== "ok"
          ? null
          : requests.some((item) => item.userId === data.user.id)
            ? "pending"
            : "none"
      }
      aside={
        <>
          {logs?.status === "ok" && (
            <ProjectSessionsCard
              clubId={clubId}
              sessions={sessionsOfLogs(logs.logs)}
            />
          )}
          {/* 발표의 구조가 아직 없거나 불러오지 못했으면 그리지 않는다. */}
          {presentation.status === "ok" && (
            <PresentationCard
              clubId={clubId}
              target={{ scope: "project", projectId }}
              presentation={presentation.presentation}
              introReady={presentation.introReady}
              canManage={canEdit}
              notes={[
                "이름, 목표, 진행 상태, 결과물 링크, 할 일이 보입니다.",
                shared
                  ? `AI Log 는 작성자가 발표에 넣어도 된다고 한 ${shared.shared}개만 보입니다. 이 Project 에 묶인 것은 모두 ${shared.total}개입니다.`
                  : "AI Log 는 작성자가 발표에 넣어도 된다고 한 것만 보입니다.",
                "작성자가 나중에 허락을 거두면 그 기록은 발표에서 바로 빠집니다.",
              ]}
            />
          )}
        </>
      }
      // 참여자만 자기 기록을 이 Project 에 묶을 수 있다.
      actions={
        isParticipant && logs && (
          <WriteLogLink clubId={clubId} projectId={projectId} />
        )
      }
    >
      {logs && (
        <AiLogSection
          title="이 Project 의 AI Log"
          result={logs}
          limit={PROJECT_LOG_LIMIT}
          emptyText={
            isParticipant
              ? "아직 묶인 AI Log 가 없습니다. 위의 AI Log 쓰기로 이 Project 의 실험을 남겨 보세요."
              : "아직 묶인 AI Log 가 없습니다. 참여자가 기록을 남기면 여기에 보입니다."
          }
          now={now}
        />
      )}
      {/* 회고의 구조가 아직 없으면 안에서 아무것도 그리지 않는다. */}
      <RetrospectiveSection
        clubId={clubId}
        target={{ scope: "project", projectId }}
        subject={project.name}
        title="이 Project 의 회고"
        description="Project 를 마치거나 중간에 돌아볼 때 참여자가 하나씩 씁니다."
        result={retrospectives}
        currentUserId={data.user.id}
        isAdmin={isAdmin}
        // 참여자만 쓴다. 운영자라도 참여자가 아니면 쓰지 않는다.
        canWrite={isParticipant}
        cannotWriteText="이 Project 의 참여자가 쓸 수 있습니다."
        now={now}
      />
    </ProjectDetail>
  );
}
