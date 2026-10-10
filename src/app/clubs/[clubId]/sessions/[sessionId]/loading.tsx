import { ContentSkeleton } from "@/components/content-skeleton";

// Session 상세에서 탭의 내용을 불러오는 동안 보여 준다. 제목과 탭은 그대로 남아 있다.
export default function SessionLoading() {
  return <ContentSkeleton heading={false} cards={2} />;
}
