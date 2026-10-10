import type { Metadata } from "next";

import { loadClubPage } from "@/features/club/page-data";
import {
  ProjectListScreen,
  type ProjectView,
} from "@/features/project/components/project-list-screen";
import { listProjects } from "@/features/project/queries";
import { isProjectStatus } from "@/features/project/rules";

export const metadata: Metadata = {
  title: "Project | AI Club OS",
};

export default async function ProjectListPage(
  props: PageProps<"/clubs/[clubId]/projects">
) {
  const { clubId } = await props.params;
  const query = await props.searchParams;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const view: ProjectView = isProjectStatus(query.status) ? query.status : "all";

  return (
    <ProjectListScreen
      clubId={clubId}
      view={view}
      result={await listProjects(clubId)}
    />
  );
}
