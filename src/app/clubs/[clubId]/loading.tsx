"use client";

import { usePathname } from "next/navigation";

import { ClubPageSkeleton } from "@/features/club/components/club-page-skeleton";
import { appPage } from "@/lib/skeleton-route";

// Club 안쪽 화면의 내용을 불러오는 동안 보여 준다. 메뉴는 그대로 남아 있고 내용 자리만 바뀐다.
// 이 loading 하나가 Club 안의 모든 화면을 덮으므로 주소를 읽어 그 화면을 닮은 자리 표시를 고른다.
export default function ClubLoading() {
  const page = appPage(usePathname());
  return <ClubPageSkeleton page={page.area === "club" ? page.page : { kind: "other" }} />;
}
