import { redirect } from "next/navigation";

import { TopBar } from "@/features/auth/components/top-bar";
import { getCurrentUser } from "@/features/auth/session";

// 로그인한 사용자가 처음 보는 화면. Club 기능을 만들면 내 Club 목록이 이 자리에 들어온다.
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <TopBar user={user} />
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 py-12 sm:px-8">
        <h1 className="text-h1">내 Club</h1>
        <p className="text-muted-foreground">
          {user.name} 님으로 로그인했습니다. Club 을 만들고 고르는 기능은 다음
          단계에서 추가합니다.
        </p>
        {user.email && (
          <p className="text-caption text-tertiary">{user.email}</p>
        )}
      </main>
    </div>
  );
}
