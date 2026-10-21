import { DocsNav } from "@/features/docs/components/docs-nav";

// Docs 화면의 틀. 왼쪽에 문서 목록을 두고, 문서 화면이 가운데 본문과 오른쪽 목차를 채운다.
// 문서는 모든 Club 에 같고 Club 의 데이터를 읽지 않는다. 볼 수 있는지는 Club 의 layout 과 각 화면이 판단한다.
// 본문 칸은 48rem 까지만 넓힌다. 아주 넓은 화면에서도 목차가 본문 바로 옆에 오게 하려는 것이다.
export default async function DocsLayout(
  props: LayoutProps<"/clubs/[clubId]/docs">
) {
  const { clubId } = await props.params;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[12rem_minmax(0,48rem)] xl:grid-cols-[12rem_minmax(0,48rem)_13rem]">
      <DocsNav clubId={clubId} />
      {props.children}
    </div>
  );
}
