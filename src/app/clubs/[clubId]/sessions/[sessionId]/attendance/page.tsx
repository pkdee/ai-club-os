import type { Metadata } from "next";

import { AttendanceBoard } from "@/features/attendance/components/attendance-board";
import { AttendanceUnavailable } from "@/features/attendance/components/attendance-overview-card";
import { listAttendance } from "@/features/attendance/queries";
import { ROLE_LABEL } from "@/features/club/roles";
import { listMembers } from "@/features/member/queries";
import { loadSessionPage } from "@/features/session/page-data";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]/attendance">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);

  return {
    title: `Attendance · ${data ? data.session.title : "Session"} | AI Club OS`,
  };
}

export default async function SessionAttendancePage(props: Props) {
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
  if (members.status !== "ok" || attendance.status !== "ok") {
    return (
      <AttendanceUnavailable
        href={`/clubs/${clubId}/sessions/${sessionId}/attendance`}
      />
    );
  }

  return (
    <AttendanceBoard
      target={{ clubId, sessionId }}
      members={members.members.map((member) => ({
        id: member.id,
        name: member.name,
        roleLabel: ROLE_LABEL[member.role],
      }))}
      records={attendance.records}
      canManage={data.club.role === "admin"}
    />
  );
}
