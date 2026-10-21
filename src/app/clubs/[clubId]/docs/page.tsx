import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DOC_SLUGS } from "@/content/docs/list";
import { loadClubPage } from "@/features/club/page-data";

export const metadata: Metadata = {
  title: "Docs | AI Club OS",
};

// Docs 메뉴로 들어오면 목록의 첫 문서를 연다. 문서가 하나도 없을 때만 이 화면을 그린다.
export default async function DocsPage(
  props: PageProps<"/clubs/[clubId]/docs">
) {
  const { clubId } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const [first] = DOC_SLUGS;
  if (first) {
    redirect(`/clubs/${clubId}/docs/${first}`);
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <BookOpen strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>아직 문서가 없습니다</EmptyTitle>
        <EmptyDescription>
          AI Club OS 를 쓰는 법을 정리한 문서가 여기에 올라옵니다.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
