import type { Metadata } from "next";

import { AiLogSection } from "@/features/ai-log/components/ai-log-section";
import { WriteLogLink } from "@/features/ai-log/components/write-log-link";
import { formatLogDate } from "@/features/ai-log/format";
import {
  countClubLogs,
  listClubLogs,
  listSessionLogs,
} from "@/features/ai-log/queries";
import {
  countSessionAttendance,
  listMemberAttendance,
  listSessionsAttendance,
} from "@/features/attendance/queries";
import {
  averageAttendance,
  tallyAttendance,
} from "@/features/attendance/status";
import { ClubOverview } from "@/features/club/components/club-overview";
import { MyRecordCard } from "@/features/club/components/my-record-card";
import { loadClubPage } from "@/features/club/page-data";
import { SessionFormDialog } from "@/features/session/components/session-form-dialog";
import { TodaySessionCard } from "@/features/session/components/today-session-card";
import { UpcomingSessions } from "@/features/session/components/upcoming-sessions";
import { listSessions } from "@/features/session/queries";
import {
  kstDateKey,
  kstMonthStart,
  kstWeekStart,
  sessionStatus,
} from "@/features/session/time";

// 개요에 보여 주는 최근 AI Log 수.
const RECENT_LOG_LIMIT = 3;
// 평균 출석을 낼 때 보는 최근 회차 수.
const ATTENDANCE_SESSION_LIMIT = 5;

export async function generateMetadata(
  props: PageProps<"/clubs/[clubId]">
): Promise<Metadata> {
  const { clubId } = await props.params;
  // layout 이 이미 같은 값을 읽었으므로 여기서는 다시 조회하지 않는다.
  const data = await loadClubPage(clubId);

  return { title: data ? `${data.club.name} | AI Club OS` : "AI Club OS" };
}

export default async function ClubOverviewPage(
  props: PageProps<"/clubs/[clubId]">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const { club, user } = data;
  const now = new Date();
  const result = await listSessions(club.id);
  const sessions = result.status === "ok" ? result.sessions : null;
  const today =
    sessions?.filter(
      (session) => sessionStatus(session.startsAt, now) === "today"
    ) ?? [];
  // 이미 시작한 회차 가운데 최근 것들. 시작 시각이 빠른 순서로 오므로 뒤에서부터 고른다.
  const recentIds = (sessions ?? [])
    .filter((session) => sessionStatus(session.startsAt, now) !== "upcoming")
    .slice(-ATTENDANCE_SESSION_LIMIT)
    .map((session) => session.id);

  const [
    logs,
    weekLogCount,
    monthLogCount,
    myLogs,
    recentAttendance,
    myAttendance,
    todayCounts,
  ] = await Promise.all([
    listClubLogs(club.id, RECENT_LOG_LIMIT, null),
    countClubLogs(club.id, null, kstWeekStart(now)),
    countClubLogs(club.id, user.id, kstMonthStart(now)),
    listClubLogs(club.id, 1, user.id),
    sessions ? listSessionsAttendance(club.id, recentIds) : null,
    club.memberId ? listMemberAttendance(club.id, club.memberId) : null,
    Promise.all(
      today.map(async (session) => {
        const [recorded, sessionLogs] = await Promise.all([
          countSessionAttendance(club.id, session.id),
          listSessionLogs(club.id, session.id),
        ]);
        return {
          session,
          recorded,
          logCount: sessionLogs.status === "ok" ? sessionLogs.total : null,
        };
      })
    ),
  ]);
  const done = sessions
    ? sessions.filter(
        (session) => sessionStatus(session.startsAt, now) === "done"
      ).length
    : 0;
  const lastLog = myLogs.status === "ok" ? myLogs.logs[0] : undefined;

  return (
    <ClubOverview
      club={club}
      stats={{
        sessions: sessions ? { done, upcoming: sessions.length - done } : null,
        attendance: recentAttendance
          ? (averageAttendance(recentAttendance) ?? "none")
          : null,
        logs:
          logs.status === "ok"
            ? { total: logs.total, thisWeek: weekLogCount }
            : null,
      }}
      actions={
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {club.role === "admin" && (
            <SessionFormDialog
              target={{ clubId: club.id }}
              defaults={{ date: kstDateKey(now) }}
              quiet
            />
          )}
          <WriteLogLink clubId={club.id} />
        </div>
      }
      lead={
        todayCounts.length > 0 && (
          <div className="flex flex-col gap-4">
            {todayCounts.map(({ session, recorded, logCount }) => (
              <TodaySessionCard
                key={session.id}
                session={session}
                canManage={club.role === "admin"}
                attendance={
                  recorded === null
                    ? null
                    : { recorded, total: club.memberCount }
                }
                logCount={logCount}
              />
            ))}
          </div>
        )
      }
      aside={
        <>
          {sessions && <UpcomingSessions sessions={sessions} now={now} />}
          <MyRecordCard
            monthLogCount={monthLogCount}
            attendance={myAttendance ? tallyAttendance(myAttendance) : null}
            lastLog={
              lastLog
                ? {
                    label: formatLogDate(lastLog.createdAt, now),
                    href: `/clubs/${club.id}/logs/${lastLog.id}`,
                  }
                : null
            }
          />
        </>
      }
    >
      <AiLogSection
        title="최근 AI Log"
        href={`/clubs/${club.id}/logs`}
        result={logs}
        limit={RECENT_LOG_LIMIT}
        emptyText="아직 AI Log 가 없습니다. 오늘 써 본 것을 짧게 남겨 보세요."
        now={now}
      />
    </ClubOverview>
  );
}
