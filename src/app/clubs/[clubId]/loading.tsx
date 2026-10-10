import { ContentSkeleton } from "@/components/content-skeleton";

// Club 안쪽 화면의 내용을 불러오는 동안 보여 준다. 메뉴는 그대로 남아 있고 내용 자리만 바뀐다.
export default function ClubLoading() {
  return <ContentSkeleton />;
}
