import type { Metadata } from "next";

import { AttendanceOverviewCard } from "@/features/attendance/components/attendance-overview-card";
import { listAttendance } from "@/features/attendance/queries";
import { countAttendance } from "@/features/attendance/status";
import { listMembers } from "@/features/member/queries";
import { SessionOverview } from "@/features/session/components/session-overview";
import { loadSessionPage } from "@/features/session/page-data";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]">;

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

  const [members, attendance] = await Promise.all([
    listMembers(clubId),
    listAttendance(clubId, sessionId),
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
        href={`/clubs/${clubId}/sessions/${sessionId}/attendance`}
        canManage={data.club.role === "admin"}
        counts={counts}
      />
    </SessionOverview>
  );
}
