import type { Metadata } from "next";

import { SessionLogs } from "@/features/ai-log/components/session-logs";
import { listSessionLogs } from "@/features/ai-log/queries";
import { listAttendance } from "@/features/attendance/queries";
import { listMembers } from "@/features/member/queries";
import { loadSessionPage } from "@/features/session/page-data";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]/logs">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);

  return {
    title: `AI Log · ${data ? data.session.title : "Session"} | AI Club OS`,
  };
}

export default async function SessionLogsPage(props: Props) {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);
  // 볼 수 없거나 없는 Session 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const [logs, members, attendance] = await Promise.all([
    listSessionLogs(clubId, sessionId),
    listMembers(clubId),
    listAttendance(clubId, sessionId),
  ]);
  // 작성 현황은 출석하거나 지각한 Member 를 기준으로 센다.
  const attendees =
    members.status === "ok" && attendance.status === "ok"
      ? members.members
          .filter((member) => {
            const status = attendance.records[member.id];
            return status === "present" || status === "late";
          })
          .map((member) => ({ userId: member.userId, name: member.name }))
      : null;

  return (
    <SessionLogs
      result={logs}
      attendees={attendees}
      retryHref={`/clubs/${clubId}/sessions/${sessionId}/logs`}
      now={new Date()}
    />
  );
}
