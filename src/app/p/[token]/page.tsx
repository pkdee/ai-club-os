import type { Metadata } from "next";

import {
  ClubPresentationView,
  PresentationShell,
  PresentationUnavailable,
  ProjectPresentationView,
} from "@/features/presentation/components/presentation-view";
import { getPublicPresentation } from "@/features/presentation/queries";

type Props = PageProps<"/p/[token]">;

// 링크를 아는 사람만 보게 하려는 화면이라 검색에 잡히지 않게 한다.
const NO_INDEX = { index: false, follow: false, nocache: true } as const;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { token } = await props.params;
  const result = await getPublicPresentation(token);
  const name =
    result.status !== "ok"
      ? "발표"
      : result.presentation.scope === "project"
        ? result.presentation.project.name
        : result.presentation.clubName;

  return {
    title: `${name} | AI Club OS`,
    robots: NO_INDEX,
    // 발표 안의 링크를 눌러 나갈 때 이 주소가 넘어가지 않게 한다. 주소에 링크 값이 들어 있다.
    referrer: "no-referrer",
  };
}

// 발표를 여는 화면. 로그인하지 않은 사람도 링크만 있으면 본다.
// 무엇을 보여 줄지는 데이터베이스의 get_presentation 함수가 정한다.
export default async function PresentationPage(props: Props) {
  const { token } = await props.params;
  const result = await getPublicPresentation(token);

  return (
    <PresentationShell>
      {result.status !== "ok" ? (
        <PresentationUnavailable reason={result.status} />
      ) : result.presentation.scope === "project" ? (
        <ProjectPresentationView presentation={result.presentation} />
      ) : (
        <ClubPresentationView presentation={result.presentation} />
      )}
    </PresentationShell>
  );
}
