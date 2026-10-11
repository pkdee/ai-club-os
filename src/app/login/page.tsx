import type { Metadata } from "next";

import { LoginScreen } from "@/features/auth/components/login-screen";
import {
  parseLoginError,
  parseLoginNotice,
} from "@/features/auth/login-error";
import { safeReturnPath } from "@/features/auth/return-path";

export const metadata: Metadata = {
  title: "로그인 | AI Club OS",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { error, next, notice } = await props.searchParams;

  return (
    <LoginScreen
      error={parseLoginError(error)}
      notice={parseLoginNotice(notice)}
      returnPath={safeReturnPath(next)}
    />
  );
}
