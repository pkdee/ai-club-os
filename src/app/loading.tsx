"use client";

import { usePathname } from "next/navigation";

import { ContentSkeleton } from "@/components/content-skeleton";
import { AccountSkeleton } from "@/features/account/components/account-skeleton";
import { TopBarSkeleton } from "@/features/auth/components/top-bar-skeleton";
import { ClubPageSkeleton } from "@/features/club/components/club-page-skeleton";
import { ClubShellSkeleton } from "@/features/club/components/club-shell-skeleton";
import { MyClubsSkeleton } from "@/features/club/components/my-clubs-skeleton";
import { JoinSkeleton } from "@/features/member/components/join-skeleton";
import {
  PresentationSkeleton,
  SlidesSkeleton,
} from "@/features/presentation/components/presentation-skeleton";
import { appPage } from "@/lib/skeleton-route";

// 화면의 틀부터 불러오는 동안 보여 준다. 처음 들어오거나 새로고침할 때, 다른 틀의 화면으로 옮겨 갈 때 보인다.
// 이 loading 하나가 모든 화면을 덮으므로 주소를 읽어 그 화면의 틀과 내용을 닮은 자리 표시를 고른다.
// Club 안쪽은 Club 의 틀까지 함께 그려서, 틀이 들어올 때 화면이 움직이지 않게 한다.
export default function RootLoading() {
  const page = appPage(usePathname());

  switch (page.area) {
    case "club":
      return (
        <ClubShellSkeleton>
          <ClubPageSkeleton page={page.page} />
        </ClubShellSkeleton>
      );
    case "presentation":
      return <PresentationSkeleton />;
    case "slides":
      return <SlidesSkeleton />;
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <TopBarSkeleton />
      {page.area === "home" ? (
        <MyClubsSkeleton />
      ) : page.area === "account" ? (
        <AccountSkeleton />
      ) : page.area === "join" ? (
        <JoinSkeleton />
      ) : (
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-12 sm:px-8">
          <ContentSkeleton />
        </div>
      )}
    </div>
  );
}
