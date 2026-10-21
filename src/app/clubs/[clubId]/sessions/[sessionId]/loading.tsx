"use client";

import { usePathname } from "next/navigation";

import { SessionTabSkeleton } from "@/features/club/components/club-page-skeleton";
import { appPage } from "@/lib/skeleton-route";

// Session 상세에서 탭의 내용을 불러오는 동안 보여 준다. 제목과 탭은 그대로 남아 있다.
// 어느 탭인지 주소로 골라 그 탭을 닮은 자리 표시를 그린다.
export default function SessionLoading() {
  const page = appPage(usePathname());
  const tab =
    page.area === "club" && page.page.kind === "session"
      ? page.page.tab
      : "overview";
  return <SessionTabSkeleton tab={tab} />;
}
