import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { ClubOverview } from "@/features/club/components/club-overview";
import { getClubAccess } from "@/features/club/queries";
import { UpcomingSessions } from "@/features/session/components/upcoming-sessions";
import { listSessions } from "@/features/session/queries";
import { sessionStatus } from "@/features/session/time";

// layout 이 이미 같은 값을 읽었으므로 여기서는 다시 조회하지 않는다.
async function loadClub(params: Promise<{ clubId: string }>) {
  const { clubId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const access = await getClubAccess(clubId, user.id);
  return access.status === "ok" ? access.club : null;
}

export async function generateMetadata(
  props: PageProps<"/clubs/[clubId]">
): Promise<Metadata> {
  const club = await loadClub(props.params);

  return { title: club ? `${club.name} | AI Club OS` : "AI Club OS" };
}

export default async function ClubOverviewPage(
  props: PageProps<"/clubs/[clubId]">
) {
  const club = await loadClub(props.params);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!club) {
    return null;
  }

  const now = new Date();
  const result = await listSessions(club.id);
  const sessions = result.status === "ok" ? result.sessions : null;
  const done = sessions
    ? sessions.filter((session) => sessionStatus(session.startsAt, now) === "done").length
    : 0;

  return (
    <ClubOverview
      club={club}
      sessions={sessions ? { done, upcoming: sessions.length - done } : null}
    >
      {sessions && (
        <UpcomingSessions clubId={club.id} sessions={sessions} now={now} />
      )}
    </ClubOverview>
  );
}
