"use client";

import { ErrorState, type ErrorStateProps } from "@/components/error-state";
import { Logo } from "@/components/logo";

// Club 밖의 화면에서 예상하지 못한 오류가 났을 때 보여 준다.
export default function RootError(props: ErrorStateProps) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 sm:px-8">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-12 sm:px-8">
        <ErrorState {...props} />
      </main>
    </div>
  );
}
