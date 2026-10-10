import type { Metadata } from "next";

import { ClubSettingsScreen } from "@/features/club/components/club-settings-screen";
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

  return <ClubSettingsScreen club={data.club} />;
}
