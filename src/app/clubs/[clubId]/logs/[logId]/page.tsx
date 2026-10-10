import type { Metadata } from "next";

import {
  AiLogDetail,
  AiLogUnavailable,
} from "@/features/ai-log/components/ai-log-detail";
import { AiLogRevisions } from "@/features/ai-log/components/ai-log-revisions";
import {
  getAiLog,
  listAiLogRevisions,
  listSessionLogs,
} from "@/features/ai-log/queries";
import {
  AI_LOG_REVISION_LIMIT,
  editsFromRevisions,
} from "@/features/ai-log/revisions";
import { loadClubPage } from "@/features/club/page-data";

type Props = PageProps<"/clubs/[clubId]/logs/[logId]">;

// 옆에 보여 주는 같은 Session 의 기록 수.
const RELATED_LIMIT = 5;
// 남겨 두는 수정의 수. 데이터베이스의 private.ai_log_revision_limit 과 같은 값이어야 한다.

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
  const isAdmin = data.club.role === "admin";
  const now = new Date();
  // 수정 기록은 작성자와 운영자에게만 보이므로 그 두 경우에만 읽는다.
  const revisions =
    isAuthor || isAdmin ? await listAiLogRevisions(clubId, logId) : null;

  return (
    <AiLogDetail
      clubName={data.club.name}
      log={log}
      canEdit={isAuthor}
      canDelete={isAuthor || isAdmin}
      related={related}
      now={now}
    >
      {revisions?.status === "ok" && (
        <AiLogRevisions
          edits={editsFromRevisions(log, revisions.revisions)}
          limit={AI_LOG_REVISION_LIMIT}
          now={now}
        />
      )}
    </AiLogDetail>
  );
}
