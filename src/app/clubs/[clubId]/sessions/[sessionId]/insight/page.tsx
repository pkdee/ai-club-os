import type { Metadata } from "next";

import { generateSessionInsight } from "@/features/ai-insight/actions";
import { InsightSection } from "@/features/ai-insight/components/insight-section";
import { getSessionInsight } from "@/features/ai-insight/queries";
import { listSessionLogs } from "@/features/ai-log/queries";
import { loadSessionPage } from "@/features/session/page-data";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]/insight">;

// AI 가 정리하는 동안 기다릴 수 있는 시간(초). 이 화면에서 부르는 서버 동작에 적용된다.
export const maxDuration = 60;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);

  return {
    title: `${data ? `${data.session.title} AI Insight` : "AI Insight"} | AI Club OS`,
  };
}

export default async function SessionInsightPage(props: Props) {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);
  // 볼 수 없거나 없는 Session 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const [result, logs] = await Promise.all([
    getSessionInsight(clubId, sessionId),
    listSessionLogs(clubId, sessionId),
  ]);

  return (
    <InsightSection
      clubId={clubId}
      canManage={data.club.role === "admin"}
      result={result}
      targetLabel={data.session.title}
      logCount={logs.status === "ok" ? logs.total : null}
      retryHref={`/clubs/${clubId}/sessions/${sessionId}/insight`}
      onGenerate={generateSessionInsight.bind(null, clubId, sessionId)}
      now={new Date()}
    />
  );
}
