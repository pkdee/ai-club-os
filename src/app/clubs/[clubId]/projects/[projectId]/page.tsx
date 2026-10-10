import type { Metadata } from "next";

import { AiLogSection } from "@/features/ai-log/components/ai-log-section";
import { WriteLogLink } from "@/features/ai-log/components/write-log-link";
import { listProjectLogs } from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";
import { listMembers } from "@/features/member/queries";
import {
  ProjectDetail,
  ProjectUnavailable,
} from "@/features/project/components/project-detail";
import { getProject } from "@/features/project/queries";

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
  // 참여자로 넣을 사람을 고르는 목록은 고칠 수 있는 사람에게만 필요하다.
  const [members, logs] = await Promise.all([
    canEdit ? listMembers(clubId) : null,
    // 기록 수를 세지 못했다면 AI Log 와의 연결이 아직 없는 것이라 기록을 읽지 않는다.
    project.logCount === null ? null : listProjectLogs(clubId, projectId),
  ]);
  const joined = new Set(project.participants.map((item) => item.memberId));

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
          now={new Date()}
        />
      )}
    </ProjectDetail>
  );
}
