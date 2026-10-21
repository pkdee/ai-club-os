import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadClubPage } from "@/features/club/page-data";
import { docNeighbors } from "@/features/docs/catalog";
import { DocArticle } from "@/features/docs/components/doc-article";
import { DocToc } from "@/features/docs/components/doc-toc";
import { findDoc, listDocs, loadDoc } from "@/features/docs/load";

export async function generateMetadata(
  props: PageProps<"/clubs/[clubId]/docs/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = await findDoc(slug);
  return {
    title: `${entry?.title ?? "Docs"} | AI Club OS`,
    description: entry?.description,
  };
}

// Docs 의 문서 한 편. 가운데에 본문을, 1280px 폭부터 오른쪽에 목차를 둔다.
// 문서는 빌드할 때 만들어지지만, 볼 수 있는지는 다른 Club 화면처럼 요청마다 확인한다.
export default async function DocPage(
  props: PageProps<"/clubs/[clubId]/docs/[slug]">
) {
  const { clubId, slug } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const [doc, docs] = await Promise.all([loadDoc(slug), listDocs()]);
  if (!doc) {
    notFound();
  }
  const { prev, next } = docNeighbors(doc.entry.slug, docs);

  return (
    <>
      <DocArticle
        clubId={clubId}
        entry={doc.entry}
        minutes={doc.minutes}
        Content={doc.Content}
        markdown={doc.markdown}
        prev={prev}
        next={next}
      />
      <aside className="hidden xl:sticky xl:top-8 xl:block">
        <DocToc headings={doc.toc} />
      </aside>
    </>
  );
}
