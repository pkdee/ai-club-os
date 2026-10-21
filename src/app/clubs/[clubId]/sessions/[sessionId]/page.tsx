import type { Metadata } from "next";

import { PreviousActionsCard } from "@/features/ai-insight/components/previous-actions-card";
import { getSessionInsight } from "@/features/ai-insight/queries";
import { AiLogSection } from "@/features/ai-log/components/ai-log-section";
import { MySessionLogCard } from "@/features/ai-log/components/my-session-log-card";
import { listSessionLogs } from "@/features/ai-log/queries";
import { AttendanceOverviewCard } from "@/features/attendance/components/attendance-overview-card";
import { listAttendance } from "@/features/attendance/queries";
import { countAttendance } from "@/features/attendance/status";
import { getCurrentUser } from "@/features/auth/session";
import {
  linkSessionProject,
  unlinkSessionProject,
} from "@/features/project/actions";
import { SessionProjectsCard } from "@/features/project/components/linked-cards";
import { mergeProjectLinks, projectsOfLogs } from "@/features/project/links";
import {
  listProjects,
  listSessionProjectLinks,
} from "@/features/project/queries";
import { listDocs } from "@/features/docs/load";
import { listMembers } from "@/features/member/queries";
import {
  linkSessionDoc,
  unlinkSessionDoc,
} from "@/features/session/actions";
import { SessionDocsCard } from "@/features/session/components/session-docs-card";
import { SessionOverview } from "@/features/session/components/session-overview";
import { loadSessionPage } from "@/features/session/page-data";
import { listSessionDocs, listSessions } from "@/features/session/queries";

type Props = PageProps<"/clubs/[clubId]/sessions/[sessionId]">;

// 개요에 보여 주는 이 회차의 AI Log 수. 나머지는 AI Log 탭에서 본다.
const OVERVIEW_LOG_LIMIT = 2;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);

  return { title: `${data ? data.session.title : "Session"} | AI Club OS` };
}

export default async function SessionOverviewPage(props: Props) {
  const { clubId, sessionId } = await props.params;
  const data = await loadSessionPage(clubId, sessionId);
  // 볼 수 없거나 없는 Session 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const base = `/clubs/${clubId}/sessions/${sessionId}`;
  const [user, members, attendance, logs, links, projectList, docLinks, docs] =
    await Promise.all([
      getCurrentUser(),
      listMembers(clubId),
      listAttendance(clubId, sessionId),
      listSessionLogs(clubId, sessionId),
      listSessionProjectLinks(clubId, sessionId),
      listProjects(clubId),
      listSessionDocs(clubId, sessionId),
      listDocs(),
    ]);
  const isAdmin = data.club.role === "admin";
  // 이어 둔 참고 자료 가운데 Docs 목록에 아직 있는 문서만 보여 준다.
  // 운영자는 아직 가져오지 않은 문서를 더 가져온다. 잇는 구조가 아직 없으면 칸을 그리지 않는다.
  const docSlugs = docLinks.status === "ok" ? docLinks.slugs : [];
  const referenceDocs = docSlugs.flatMap((slug) => {
    const doc = docs.find((item) => item.slug === slug);
    return doc ? [doc] : [];
  });
  const linkableDocs =
    isAdmin && docLinks.status === "ok"
      ? docs.filter((doc) => !docSlugs.includes(doc.slug)).map((doc) => ({
          id: doc.slug,
          name: doc.title,
        }))
      : null;
  // 내가 이을 수 있는 Project. 운영자는 모두, 다른 Member 는 자기가 참여하는 것만이다.
  // 잇는 구조가 아직 없으면 잇는 칸을 그리지 않는다.
  const mine = new Set(
    projectList.status === "ok" && user
      ? projectList.projects
          .filter(
            (project) =>
              isAdmin ||
              project.participants.some((item) => item.userId === user.id)
          )
          .map((project) => project.id)
      : []
  );
  const direct = links.status === "ok" ? links.projects : [];
  const linked = new Set(direct.map((project) => project.id));
  const linkable =
    links.status === "ok" && projectList.status === "ok"
      ? projectList.projects
          .filter((project) => mine.has(project.id) && !linked.has(project.id))
          .map((project) => ({ id: project.id, name: project.name }))
      : null;
  // 바로 앞 회차의 공개된 AI Insight 에 다음 행동이 있으면 이 회차의 개요에 이어서 보여 준다.
  const sessions = await listSessions(clubId);
  const order = sessions.status === "ok" ? sessions.sessions : [];
  const previous = order[order.findIndex((item) => item.id === sessionId) - 1];
  const previousInsight = previous
    ? await getSessionInsight(clubId, previous.id)
    : null;
  const carried =
    previousInsight?.status === "ok" &&
    previousInsight.insight?.status === "published"
      ? (previousInsight.insight.content?.nextActions ?? [])
      : [];
  const counts =
    members.status === "ok" && attendance.status === "ok"
      ? countAttendance(
          members.members.map((member) => member.id),
          attendance.records
        )
      : null;

  return (
    <SessionOverview
      session={data.session}
      aside={
        <>
          <AttendanceOverviewCard
            href={`${base}/attendance`}
            canManage={data.club.role === "admin"}
            counts={counts}
          />
          {/* 기록을 불러오지 못했으면 남겼는지 알 수 없으므로 안내를 감춘다. */}
          {user && logs.status === "ok" && (
            <MySessionLogCard
              clubId={clubId}
              sessionId={sessionId}
              logIds={logs.logs
                .filter((log) => log.author?.userId === user.id)
                .map((log) => log.id)}
            />
          )}
          <SessionDocsCard
            clubId={clubId}
            docs={referenceDocs}
            linkable={linkableDocs}
            onLink={
              isAdmin
                ? linkSessionDoc.bind(null, clubId, sessionId)
                : undefined
            }
            unlink={
              isAdmin
                ? (slug) => unlinkSessionDoc.bind(null, clubId, sessionId, slug)
                : undefined
            }
            notReady={isAdmin && docLinks.status === "unavailable"}
          />
          <SessionProjectsCard
            clubId={clubId}
            projects={mergeProjectLinks(
              direct,
              logs.status === "ok" ? projectsOfLogs(logs.logs) : []
            ).map((project) => ({
              ...project,
              canUnlink: mine.has(project.id),
            }))}
            linkable={linkable}
            onLink={linkSessionProject.bind(null, clubId, sessionId)}
            unlink={(projectId) =>
              unlinkSessionProject.bind(null, clubId, sessionId, projectId)
            }
          />
        </>
      }
    >
      {previous && (
        <PreviousActionsCard
          sessionTitle={previous.title}
          href={`/clubs/${clubId}/sessions/${previous.id}/insight`}
          actions={carried.map((action) => action.text)}
        />
      )}
      <AiLogSection
        title="이 회차의 AI Log"
        href={`${base}/logs`}
        result={logs}
        limit={OVERVIEW_LOG_LIMIT}
        emptyText="아직 이 회차의 AI Log 가 없습니다. 위의 AI Log 쓰기로 첫 기록을 남겨 보세요."
        now={new Date()}
      />
    </SessionOverview>
  );
}
