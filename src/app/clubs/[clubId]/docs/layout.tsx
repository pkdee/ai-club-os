import { DocsNav } from "@/features/docs/components/docs-nav";
import { listDocs } from "@/features/docs/load";

// Docs 화면의 틀. 왼쪽에 문서 목록을 두고, 문서 화면이 가운데 본문과 오른쪽 목차를 채운다.
// 문서는 모든 Club 에 같고 Club 의 데이터를 읽지 않는다. 목록의 이름은 각 문서의 frontmatter 에 적힌 제목이다. 볼 수 있는지는 Club 의 layout 과 각 화면이 판단한다.
// 본문 칸은 48rem 까지만 넓힌다. 아주 넓은 화면에서도 목차가 본문 바로 옆에 오게 하려는 것이다.
// 세 칸을 Sidebar 를 뺀 영역의 가운데에 둔다. 목록과 목차의 폭이 같아서 목차가 보이는 폭에서는 본문이 한가운데에 온다.
// 1536px 보다 좁으면 목록과 목차를 12rem 으로 줄여 본문 자리를 남긴다.
export default async function DocsLayout(
  props: LayoutProps<"/clubs/[clubId]/docs">
) {
  const { clubId } = await props.params;
  const docs = await listDocs();

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[12rem_minmax(0,48rem)] lg:justify-center xl:grid-cols-[12rem_minmax(0,48rem)_12rem] 2xl:grid-cols-[14rem_minmax(0,48rem)_14rem] 2xl:gap-12">
      <DocsNav
        clubId={clubId}
        docs={docs.map(({ slug, title }) => ({ slug, title }))}
      />
      {props.children}
    </div>
  );
}
