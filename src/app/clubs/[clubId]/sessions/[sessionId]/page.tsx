import type { Metadata } from "next";

import { PreviousActionsCard } from "@/features/ai-insight/components/previous-actions-card";
import { getSessionInsight } from "@/features/ai-insight/queries";
import { AiLogSection } from "@/features/ai-log/components/ai-log-section";
import { MySessionLogCard } from "@/features/ai-log/components/my-session-log-card";
import { listSessionLogs } from "@/features/ai-log/queries";
import { AttendanceOverviewCard } from "@/features/attendance/components/attendance-overview-card";
import { listAttendance } from "@/features/attendance/queries";
import { countAttendance } from "@/features/attendance/status";
import { getCurrentUser } from "@/features/auth/session";
import { listMembers } from "@/features/member/queries";
import { SessionOverview } from "@/features/session/components/session-overview";
import { loadSessionPage } from "@/features/session/page-data";
import { listSessions } from "@/features/session/queries";

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
  const [user, members, attendance, logs] = await Promise.all([
    getCurrentUser(),
    listMembers(clubId),
    listAttendance(clubId, sessionId),
    listSessionLogs(clubId, sessionId),
  ]);
  // 바로 앞 회차의 공개된 AI Insight 에 다음 행동이 있으면 이 회차의 개요에 이어서 보여 준다.
  const sessions = await listSessions(clubId);
  const order = sessions.status === "ok" ? sessions.sessions : [];
  const previous = order[order.findIndex((item) => item.id === sessionId) - 1];
  const previousInsight = previous
    ? await getSessionInsight(clubId, previous.id)
    : null;
  const carried =
    previousInsight?.status === "ok" &&
    previousInsight.insight?.status === "published"
      ? (previousInsight.insight.content?.nextActions ?? [])
      : [];
  const counts =
    members.status === "ok" && attendance.status === "ok"
      ? countAttendance(
          members.members.map((member) => member.id),
          attendance.records
        )
      : null;

  return (
    <SessionOverview
      session={data.session}
      aside={
        <>
          <AttendanceOverviewCard
            href={`${base}/attendance`}
            canManage={data.club.role === "admin"}
            counts={counts}
          />
          {/* 기록을 불러오지 못했으면 남겼는지 알 수 없으므로 안내를 감춘다. */}
          {user && logs.status === "ok" && (
            <MySessionLogCard
              clubId={clubId}
              sessionId={sessionId}
              logIds={logs.logs
                .filter((log) => log.author?.userId === user.id)
                .map((log) => log.id)}
            />
          )}
        </>
      }
    >
      {previous && (
        <PreviousActionsCard
          sessionTitle={previous.title}
          href={`/clubs/${clubId}/sessions/${previous.id}/insight`}
          actions={carried.map((action) => action.text)}
        />
      )}
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
