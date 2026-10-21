"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { ClubListItem } from "../queries"
import { CLUB_CARD_CLASS, ClubCardBody } from "./club-card"

// 내가 Member 가 아닌 Club. 누르면 들어갈 권한이 없다는 안내 창을 연다.
// Club 안은 Member 만 볼 수 있어서 이동하지 않는다. 주소로 직접 들어와도 Club 화면이 같은 이유를 알려 준다.
// 카드 전체를 덮는 버튼을 둔다. 버튼 안에는 제목이나 문단을 넣을 수 없어서 카드의 글은 버튼 밖에 둔다.
export function LockedClubCard({ club }: { club: ClubListItem }) {
  return (
    <Dialog>
      <div className={cn(CLUB_CARD_CLASS, "relative")}>
        <ClubCardBody club={club} />
        <DialogTrigger
          render={
            <button
              type="button"
              className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
            />
          }
        >
          <span className="sr-only">{club.name} 열기</span>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 Club 에 들어갈 권한이 없습니다</DialogTitle>
          <DialogDescription>
            {club.name} 은 Member 만 들어갈 수 있습니다. 참여하려면 운영자에게
            초대 링크를 받아 주세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" />}>확인</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
