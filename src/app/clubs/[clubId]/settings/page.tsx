import type { Metadata } from "next";

import { ClubSettingsScreen } from "@/features/club/components/club-settings-screen";
import { DeletionLogCard } from "@/features/club/components/deletion-log-card";
import { listDeletionLogs } from "@/features/club/deletions";
import { loadClubPage } from "@/features/club/page-data";

export const metadata: Metadata = {
  title: "Club 설정 | AI Club OS",
};

export default async function ClubSettingsPage(
  props: PageProps<"/clubs/[clubId]/settings">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  // 지운 기록은 운영자에게만 보이므로 운영자일 때만 읽는다.
  const deletions =
    data.club.role === "admin" ? await listDeletionLogs(clubId) : null;

  return (
    <ClubSettingsScreen club={data.club}>
      {deletions && <DeletionLogCard result={deletions} />}
    </ClubSettingsScreen>
  );
}
