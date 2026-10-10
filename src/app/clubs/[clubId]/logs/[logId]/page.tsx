import type { Metadata } from "next";

import {
  AiLogDetail,
  AiLogUnavailable,
} from "@/features/ai-log/components/ai-log-detail";
import { getAiLog, listSessionLogs } from "@/features/ai-log/queries";
import { loadClubPage } from "@/features/club/page-data";

type Props = PageProps<"/clubs/[clubId]/logs/[logId]">;

// 옆에 보여 주는 같은 Session 의 기록 수.
const RELATED_LIMIT = 5;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, logId } = await props.params;
  const data = await loadClubPage(clubId);
  const result = data ? await getAiLog(clubId, logId) : null;

  return {
    title: `${result?.status === "ok" ? result.log.title : "AI Log"} | AI Club OS`,
  };
}

export default async function AiLogDetailPage(props: Props) {
  const { clubId, logId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const result = await getAiLog(clubId, logId);
  if (result.status !== "ok") {
    return <AiLogUnavailable clubId={clubId} reason={result.status} />;
  }

  const { log } = result;
  const sessionLogs = log.session
    ? await listSessionLogs(clubId, log.session.id)
    : null;
  const related =
    sessionLogs?.status === "ok"
      ? sessionLogs.logs
          .filter((item) => item.id !== log.id)
          .slice(0, RELATED_LIMIT)
      : [];

  const isAuthor = log.author?.userId === data.user.id;

  return (
    <AiLogDetail
      clubName={data.club.name}
      log={log}
      canEdit={isAuthor}
      canDelete={isAuthor || data.club.role === "admin"}
      related={related}
      now={new Date()}
    />
  );
}
