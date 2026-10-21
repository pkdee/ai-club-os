import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TopBar } from "@/features/auth/components/top-bar";
import { getCurrentUser } from "@/features/auth/session";
import { MyClubsScreen } from "@/features/club/components/my-clubs-screen";
import { listClubs, type ClubListItem } from "@/features/club/queries";

export const metadata: Metadata = {
  title: "Club | AI Club OS",
};

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let clubs: ClubListItem[] | null;
  try {
    clubs = await listClubs();
  } catch (error) {
    console.error(error);
    clubs = null;
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <TopBar user={user} />
      <MyClubsScreen clubs={clubs} />
    </div>
  );
}
