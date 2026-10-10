import { getSessionInsight } from "@/features/ai-insight/queries";
import { WriteLogLink } from "@/features/ai-log/components/write-log-link";
import { listSessionLogs } from "@/features/ai-log/queries";
import { countSessionAttendance } from "@/features/attendance/queries";
import { getCurrentUser } from "@/features/auth/session";
import { getClubAccess } from "@/features/club/queries";
import {
  SessionHeader,
  SessionUnavailable,
} from "@/features/session/components/session-header";
import { SessionTabs } from "@/features/session/components/session-tabs";
import { getSession } from "@/features/session/queries";

export default async function SessionLayout(
  props: LayoutProps<"/clubs/[clubId]/sessions/[sessionId]">
) {
  const { clubId, sessionId } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const access = await getClubAccess(clubId, user.id);
  // 볼 수 없는 Club 은 바깥 layout 이 안내 화면을 대신 그린다.
  if (access.status !== "ok") {
    return null;
  }

  const result = await getSession(clubId, sessionId);
  if (result.status !== "ok") {
    return <SessionUnavailable clubId={clubId} reason={result.status} />;
  }

  const canManage = access.club.role === "admin";
  // Attendance 수와 AI Insight 는 운영자가 Session 을 지우기 전에 보는 안내에만 쓴다.
  const [logs, attendanceCount, insight] = await Promise.all([
    listSessionLogs(clubId, sessionId),
    canManage ? countSessionAttendance(clubId, sessionId) : null,
    canManage ? getSessionInsight(clubId, sessionId) : null,
  ]);
  const logCount = logs.status === "ok" ? logs.total : null;

  return (
    <>
      <SessionHeader
        clubName={access.club.name}
        session={result.session}
        canManage={canManage}
        attendanceCount={attendanceCount}
        logCount={logCount}
        hasInsight={insight?.status === "ok" && insight.insight !== null}
        actions={<WriteLogLink clubId={clubId} sessionId={sessionId} />}
        now={new Date()}
      />
      <SessionTabs
        baseHref={`/clubs/${clubId}/sessions/${sessionId}`}
        memberCount={access.club.memberCount}
        logCount={logCount}
      />
      {props.children}
    </>
  );
}
