import type { Metadata } from "next";

import { generateSessionInsight } from "@/features/ai-insight/actions";
import { InsightSection } from "@/features/ai-insight/components/insight-section";
import { insightRunsLeft } from "@/features/ai-insight/limit";
import {
  countInsightLogs,
  countInsightRetrospectives,
  countTodayInsightRuns,
  getSessionInsight,
} from "@/features/ai-insight/queries";
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

  const now = new Date();
  const canManage = data.club.role === "admin";
  // 오늘 만든 횟수는 운영자에게만 보이므로 운영자일 때만 센다.
  // 함께 보낼 회고의 수는 만드는 창에서만 쓰므로 운영자일 때만 센다.
  const [result, logs, runs, retrospectiveCount] = await Promise.all([
    getSessionInsight(clubId, sessionId),
    countInsightLogs(clubId, { sessionId }),
    canManage ? countTodayInsightRuns(clubId, now) : null,
    canManage ? countInsightRetrospectives(clubId, { sessionId }) : 0,
  ]);

  return (
    <InsightSection
      clubId={clubId}
      canManage={canManage}
      result={result}
      targetLabel={data.session.title}
      logCount={logs ? logs.usable : null}
      excludedCount={logs ? logs.excluded : 0}
      retrospectiveCount={retrospectiveCount}
      runsLeft={runs === null ? null : insightRunsLeft(runs)}
      retryHref={`/clubs/${clubId}/sessions/${sessionId}/insight`}
      onGenerate={generateSessionInsight.bind(null, clubId, sessionId)}
      now={now}
    />
  );
}
