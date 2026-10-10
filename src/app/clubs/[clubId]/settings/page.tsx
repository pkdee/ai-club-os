import type { Metadata } from "next";

import { ToolMergeCard } from "@/features/ai-log/components/tool-merge-card";
import { listToolSpellings } from "@/features/ai-log/queries";
import { toolMergeGroups } from "@/features/ai-log/tool-merge";
import { ClubSettingsScreen } from "@/features/club/components/club-settings-screen";
import { DeletionLogCard } from "@/features/club/components/deletion-log-card";
import { listDeletionLogs } from "@/features/club/deletions";
import { loadClubPage } from "@/features/club/page-data";
import { PresentationCard } from "@/features/presentation/components/presentation-card";
import { getClubPresentation } from "@/features/presentation/queries";

export const metadata: Metadata = {
  title: "Club 설정 | AI Club OS",
};

export default async function ClubSettingsPage(
  props: PageProps<"/clubs/[clubId]/settings">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  // 지운 기록과 Club 발표는 운영자만 다루므로 운영자일 때만 읽는다.
  const isAdmin = data.club.role === "admin";
  const [deletions, presentation, tools] = await Promise.all([
    isAdmin ? listDeletionLogs(clubId) : null,
    isAdmin ? getClubPresentation(clubId) : null,
    isAdmin ? listToolSpellings(clubId) : null,
  ]);

  return (
    <ClubSettingsScreen club={data.club}>
      {/* 발표의 구조가 아직 없거나 불러오지 못했으면 그리지 않는다. */}
      {presentation?.status === "ok" && (
        <PresentationCard
          clubId={clubId}
          target={{ scope: "club" }}
          presentation={presentation.presentation}
          canManage
          notes={[
            "Club 의 이름과 소개, Member 수, AI Log 수, Project 수가 보입니다.",
            "이미 시작한 Session 의 제목과 날짜가 보입니다. 앞으로 열 Session 은 보이지 않습니다.",
            "Project 는 발표를 공개한 것만 그 발표로 가는 링크와 함께 보입니다.",
            "AI Log 의 내용과 AI Insight 는 보이지 않습니다.",
          ]}
          className="max-w-[720px] sm:p-6"
        />
      )}
      {/* 도구 표기를 세는 함수가 아직 없거나 불러오지 못했으면 그리지 않는다. */}
      {tools?.status === "ok" && (
        <ToolMergeCard
          clubId={clubId}
          groups={toolMergeGroups(tools.spellings)}
          spellings={tools.spellings}
        />
      )}
      {deletions && <DeletionLogCard result={deletions} />}
    </ClubSettingsScreen>
  );
}
