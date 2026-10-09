import { redirect } from "next/navigation";

// 로그인 상태 확인은 Supabase 연결 뒤에 넣는다. 그때까지는 로그인 화면으로 보낸다.
export default function Home() {
  redirect("/login");
}
