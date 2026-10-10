import type { Metadata } from "next";

import { countLogsByAuthor } from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";
import { listClubBans } from "@/features/member/bans";
import { InviteDialog } from "@/features/member/components/invite-dialog";
import {
  MemberListScreen,
  type MemberView,
} from "@/features/member/components/member-list-screen";
import { formatInviteExpiry } from "@/features/member/format";
import { getClubInvite } from "@/features/member/invite";
import { listMembers } from "@/features/member/queries";
import { parseMemberQuery } from "@/features/member/search";

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
  // 초대 링크와 막은 사람은 운영자에게만 보이므로 운영자일 때만 읽는다.
  const [members, logCounts, invite, bans] = await Promise.all([
    listMembers(clubId),
    countLogsByAuthor(clubId),
    canInvite ? getClubInvite(clubId) : null,
    canInvite ? listClubBans(clubId) : null,
  ]);
  const current = invite?.status === "ok" ? invite.invite : null;

  return (
    <MemberListScreen
      clubId={clubId}
      view={view}
      query={parseMemberQuery(query.q)}
      result={members}
      logCounts={logCounts}
      currentUserId={data.user.id}
      canManage={canInvite}
      bans={bans}
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
