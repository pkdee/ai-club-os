import type { MDXComponents } from "mdx/types"

import { docsComponents } from "@/features/docs/components/mdx"

// @next/mdx 가 모든 .mdx 파일에 넘기는 부품. Next.js 가 이 파일이 있어야 MDX 를 쓸 수 있다.
// 지금은 Docs 만 MDX 를 쓰므로 Docs 의 부품을 그대로 돌려준다.
export function useMDXComponents(): MDXComponents {
  return docsComponents
}
