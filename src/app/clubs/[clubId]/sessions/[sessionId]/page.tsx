import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { getClubAccess } from "@/features/club/queries";
import { SessionDetailScreen } from "@/features/session/components/session-detail-screen";
import { getSession } from "@/features/session/queries";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]">;

// layout 이 이미 Club 을 읽었으므로 Club 은 다시 조회하지 않는다.
async function load(params: Props["params"]) {
  const { clubId, sessionId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const access = await getClubAccess(clubId, user.id);
  if (access.status !== "ok") {
    return null;
  }

  return { club: access.club, result: await getSession(clubId, sessionId) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props.params);
  const title =
    loaded?.result.status === "ok" ? loaded.result.session.title : "Session";

  return { title: `${title} | AI Club OS` };
}

export default async function SessionDetailPage(props: Props) {
  const loaded = await load(props.params);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!loaded) {
    return null;
  }

  return (
    <SessionDetailScreen
      clubId={loaded.club.id}
      clubName={loaded.club.name}
      canManage={loaded.club.role === "admin"}
      result={loaded.result}
      now={new Date()}
    />
  );
}
