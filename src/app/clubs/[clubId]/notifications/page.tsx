import type { Metadata } from "next";

import { loadClubPage } from "@/features/club/page-data";
import { NotificationScreen } from "@/features/notification/components/notification-screen";
import { getNotifications } from "@/features/notification/queries";
import { kstDateKey } from "@/features/session/time";

export const metadata: Metadata = {
  title: "알림 | AI Club OS",
};

export default async function NotificationPage(
  props: PageProps<"/clubs/[clubId]/notifications">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const now = new Date();
  // layout 이 메뉴의 알림 수를 세려고 이미 읽었으므로 여기서는 다시 조회하지 않는다.
  const result = await getNotifications(
    clubId,
    data.user.id,
    data.club.memberId,
    data.club.role === "admin"
  );

  return (
    <NotificationScreen
      clubId={clubId}
      result={result}
      today={kstDateKey(now)}
      now={now}
    />
  );
}
