import type { Metadata } from "next";

import { PresentationSlide } from "@/features/presentation/components/presentation-slide";
import {
  PresentationShell,
  PresentationUnavailable,
} from "@/features/presentation/components/presentation-view";
import { SlideDeck } from "@/features/presentation/components/slide-deck";
import { getPublicPresentation } from "@/features/presentation/queries";
import { buildSlides, slideIndex } from "@/features/presentation/slides";
import { presentationPath } from "@/features/presentation/token";

type Props = PageProps<"/p/[token]/slides">;

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
    title: `${name} 발표 모드 | AI Club OS`,
    robots: NO_INDEX,
    // 발표 안의 링크를 눌러 나갈 때 이 주소가 넘어가지 않게 한다. 주소에 링크 값이 들어 있다.
    referrer: "no-referrer",
  };
}

// 발표를 한 장씩 넘겨 보는 화면. 이어 보는 화면과 같은 내용을 장으로 나눠 보여 준다.
// 무엇을 보여 줄지는 이어 보는 화면과 똑같이 데이터베이스의 get_presentation 함수가 정한다.
export default async function PresentationSlidesPage(props: Props) {
  const [{ token }, query] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const result = await getPublicPresentation(token);

  if (result.status !== "ok") {
    return (
      <PresentationShell>
        <PresentationUnavailable reason={result.status} />
      </PresentationShell>
    );
  }

  const { presentation } = result;
  const slides = buildSlides(presentation);
  const backHref = presentationPath(token);

  return (
    <SlideDeck
      title={
        presentation.scope === "project"
          ? `${presentation.clubName} · ${presentation.project.name}`
          : presentation.clubName
      }
      backHref={backHref}
      // 주소에 적힌 장에서 이어 본다. 새로 고쳐도 보던 장이 유지된다.
      initial={slideIndex(query.s, slides.length)}
    >
      {slides.map((slide, index) => (
        <PresentationSlide key={index} slide={slide} backHref={backHref} />
      ))}
    </SlideDeck>
  );
}
