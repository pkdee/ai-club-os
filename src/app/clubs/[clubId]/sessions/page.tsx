import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { getClubAccess } from "@/features/club/queries";
import { SessionListScreen } from "@/features/session/components/session-list-screen";
import { listSessions } from "@/features/session/queries";

export const metadata: Metadata = {
  title: "Session | AI Club OS",
};

export default async function SessionListPage(
  props: PageProps<"/clubs/[clubId]/sessions">
) {
  const { clubId } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const access = await getClubAccess(clubId, user.id);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (access.status !== "ok") {
    return null;
  }

  return (
    <SessionListScreen
      clubId={clubId}
      canManage={access.club.role === "admin"}
      result={await listSessions(clubId)}
      now={new Date()}
    />
  );
}
