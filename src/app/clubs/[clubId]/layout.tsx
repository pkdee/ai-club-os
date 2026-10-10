import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { ClubShell } from "@/features/club/components/club-shell";
import { ClubUnavailable } from "@/features/club/components/club-unavailable";
import { getClubAccess } from "@/features/club/queries";
import { getNotifications } from "@/features/notification/queries";

export default async function ClubLayout(
  props: LayoutProps<"/clubs/[clubId]">
) {
  const { clubId } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const access = await getClubAccess(clubId, user.id);
  if (access.status !== "ok") {
    return <ClubUnavailable user={user} reason={access.status} />;
  }

  // 메뉴에 보여 줄 알림 수. 아직 쓸 수 없거나 세지 못했으면 메뉴에서 알림을 뺀다.
  const notifications = await getNotifications(
    clubId,
    user.id,
    access.club.memberId
  );

  return (
    <ClubShell
      club={access.club}
      user={user}
      notificationCount={
        notifications.status === "ok" ? notifications.count : null
      }
    >
      {props.children}
    </ClubShell>
  );
}
