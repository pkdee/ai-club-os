import { DocSkeleton } from "@/features/docs/components/doc-skeleton";

// 문서를 불러오는 동안 본문과 목차 자리에 보여 준다. 왼쪽 문서 목록은 Docs 의 layout 이 그대로 남긴다.
// 이것이 없으면 Club 의 로딩이 목록까지 함께 가리거나, 목록만 그려진 채 본문 자리가 빈다.
export default function DocsLoading() {
  return <DocSkeleton />;
}
