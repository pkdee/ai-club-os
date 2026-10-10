"use client";

import { ErrorState, type ErrorStateProps } from "@/components/error-state";

// Club 안쪽 화면에서 예상하지 못한 오류가 났을 때 보여 준다. 메뉴는 그대로 남아 있어 다른 화면으로 갈 수 있다.
export default function ClubError(props: ErrorStateProps) {
  return <ErrorState {...props} />;
}
