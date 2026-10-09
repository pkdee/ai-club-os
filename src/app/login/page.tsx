import type { Metadata } from "next";

import { LoginScreen } from "@/features/auth/components/login-screen";
import { parseLoginError } from "@/features/auth/login-error";

export const metadata: Metadata = {
  title: "로그인 | AI Club OS",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { error } = await props.searchParams;

  return <LoginScreen error={parseLoginError(error)} />;
}
