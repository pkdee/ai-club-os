import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { RetrospectiveSection } from "@/features/retrospective/components/retrospective-section";
import { listSessionRetrospectives } from "@/features/retrospective/queries";
import { loadSessionPage } from "@/features/session/page-data";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]/retros">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);

  return {
    title: `회고 · ${data ? data.session.title : "Session"} | AI Club OS`,
  };
}

// Session 의 회고 탭. 그 회차가 어땠는지 사람마다 하나씩 돌아본다.
export default async function SessionRetrospectivesPage(props: Props) {
  const { clubId, sessionId } = await props.params;
  const [data, user] = await Promise.all([
    loadSessionPage(clubId, sessionId),
    getCurrentUser(),
  ]);
  // 볼 수 없거나 없는 Session 은 layout 이 안내 화면을 대신 그린다.
  if (!data || !user) {
    return null;
  }

  const now = new Date();
  const result = await listSessionRetrospectives(clubId, sessionId);
  if (result.status === "unavailable") {
    return (
      <p className="rounded-xl border bg-card p-5 text-muted-foreground">
        데이터베이스에 회고의 구조가 아직 없습니다. 최신 마이그레이션을
        적용하면 쓸 수 있습니다.
      </p>
    );
  }

  return (
    <RetrospectiveSection
      clubId={clubId}
      target={{ scope: "session", sessionId }}
      subject={data.session.title}
      title="이 회차의 회고"
      description="회차가 어땠는지 돌아봅니다. 무엇을 배웠는지는 AI Log 에, 모임이 어땠는지는 여기에 적습니다."
      result={result}
      currentUserId={user.id}
      isAdmin={data.club.role === "admin"}
      // 아직 시작하지 않았거나 날짜를 정하지 않은 회차는 돌아볼 것이 없다.
      canWrite={
        data.session.startsAt !== null &&
        new Date(data.session.startsAt).getTime() <= now.getTime()
      }
      cannotWriteText={
        data.session.startsAt === null
          ? "날짜를 정하고 Session 이 시작한 뒤에 쓸 수 있습니다."
          : "Session 이 시작한 뒤에 쓸 수 있습니다."
      }
      now={now}
    />
  );
}
