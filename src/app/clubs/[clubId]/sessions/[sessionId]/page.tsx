import type { Metadata } from "next";

import { AiLogSection } from "@/features/ai-log/components/ai-log-section";
import { listSessionLogs } from "@/features/ai-log/queries";
import { AttendanceOverviewCard } from "@/features/attendance/components/attendance-overview-card";
import { listAttendance } from "@/features/attendance/queries";
import { countAttendance } from "@/features/attendance/status";
import { listMembers } from "@/features/member/queries";
import { SessionOverview } from "@/features/session/components/session-overview";
import { loadSessionPage } from "@/features/session/page-data";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]">;

// 개요에 보여 주는 이 회차의 AI Log 수. 나머지는 AI Log 탭에서 본다.
const OVERVIEW_LOG_LIMIT = 2;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);

  return { title: `${data ? data.session.title : "Session"} | AI Club OS` };
}

export default async function SessionOverviewPage(props: Props) {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);
  // 볼 수 없거나 없는 Session 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const base = `/clubs/${clubId}/sessions/${sessionId}`;
  const [members, attendance, logs] = await Promise.all([
    listMembers(clubId),
    listAttendance(clubId, sessionId),
    listSessionLogs(clubId, sessionId),
  ]);
  const counts =
    members.status === "ok" && attendance.status === "ok"
      ? countAttendance(
          members.members.map((member) => member.id),
          attendance.records
        )
      : null;

  return (
    <SessionOverview session={data.session}>
      <AttendanceOverviewCard
        href={`${base}/attendance`}
        canManage={data.club.role === "admin"}
        counts={counts}
      />
      <AiLogSection
        title="이 회차의 AI Log"
        href={`${base}/logs`}
        result={logs}
        limit={OVERVIEW_LOG_LIMIT}
        emptyText="아직 이 회차의 AI Log 가 없습니다. 위의 AI Log 쓰기로 첫 기록을 남겨 보세요."
        now={new Date()}
      />
    </SessionOverview>
  );
}
