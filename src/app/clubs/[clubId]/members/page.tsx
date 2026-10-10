import type { Metadata } from "next";

import { loadClubPage } from "@/features/club/page-data";
import { InviteDialog } from "@/features/member/components/invite-dialog";
import {
  MemberListScreen,
  type MemberView,
} from "@/features/member/components/member-list-screen";
import { formatInviteExpiry } from "@/features/member/format";
import { getClubInvite } from "@/features/member/invite";
import { listMembers } from "@/features/member/queries";

export const metadata: Metadata = {
  title: "Member | AI Club OS",
};

export default async function MemberListPage(
  props: PageProps<"/clubs/[clubId]/members">
) {
  const { clubId } = await props.params;
  const query = await props.searchParams;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const view: MemberView =
    query.role === "admin" || query.role === "member" ? query.role : "all";
  const canInvite = data.club.role === "admin";
  // 초대 링크는 운영자에게만 보이므로 운영자일 때만 읽는다.
  const [members, invite] = await Promise.all([
    listMembers(clubId),
    canInvite ? getClubInvite(clubId) : null,
  ]);
  const current = invite?.status === "ok" ? invite.invite : null;

  return (
    <MemberListScreen
      clubId={clubId}
      view={view}
      result={members}
      currentUserId={data.user.id}
      inviteAction={
        invite && (
          <InviteDialog
            clubId={clubId}
            invite={
              current && {
                token: current.token,
                expiresLabel: formatInviteExpiry(current.expiresAt),
                expired: new Date(current.expiresAt) <= new Date(),
              }
            }
            unavailable={invite.status === "error"}
          />
        )
      }
    />
  );
}
