import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountScreen } from "@/features/account/components/account-screen";
import { planAccountDeletion } from "@/features/account/plan";
import { getAccountSummary } from "@/features/account/queries";
import { TopBar } from "@/features/auth/components/top-bar";
import { getCurrentUser } from "@/features/auth/session";
import { listMyClubs } from "@/features/club/queries";

export const metadata: Metadata = {
  title: "내 계정 | AI Club OS",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [summary, clubs] = await Promise.all([
    getAccountSummary(user.id),
    listMyClubs(user.id).catch((error) => {
      console.error(error);
      return null;
    }),
  ]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <TopBar user={user} />
      <AccountScreen
        user={user}
        counts={summary.counts}
        plan={clubs ? planAccountDeletion(clubs) : null}
      />
    </div>
  );
}
