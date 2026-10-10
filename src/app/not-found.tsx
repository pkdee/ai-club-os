import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "찾을 수 없는 주소 | AI Club OS",
};

// 없는 주소를 열었을 때 보여 준다.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 sm:px-8">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-12 sm:px-8">
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <FileQuestion strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>주소를 찾을 수 없습니다</EmptyTitle>
              <EmptyDescription>
                주소가 바뀌었거나 잘못 입력됐습니다. 내 Club 에서 다시 찾아
                주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                내 Club 으로
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      </main>
    </div>
  );
}
