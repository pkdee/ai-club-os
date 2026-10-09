import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { ClubOverview } from "@/features/club/components/club-overview";
import { getClubAccess } from "@/features/club/queries";

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

  return <ClubOverview club={club} />;
}
