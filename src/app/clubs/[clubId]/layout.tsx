import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { ClubShell } from "@/features/club/components/club-shell";
import { ClubUnavailable } from "@/features/club/components/club-unavailable";
import { getClubAccess } from "@/features/club/queries";

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

  return (
    <ClubShell club={access.club} user={user}>
      {props.children}
    </ClubShell>
  );
}
