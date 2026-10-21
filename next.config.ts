import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md 는 이 저장소의 단일 지침 파일이다. next dev 가 자동으로 고치지 않게 한다.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Docs 의 MDX 플러그인 파일들의 내용으로 만든 값.
// Turbopack 은 .mdx 를 바꾼 결과를 캐시에 남기는데, 플러그인 파일이 바뀐 것은 알아채지 못한다.
// 이 값을 플러그인 옵션에 넣어 플러그인을 고치면 문서를 다시 만들게 한다. 개발 서버는 다시 켤 때 이 값을 다시 셈한다.
const docsPluginDir = path.join(process.cwd(), "src/features/docs");
const docsPluginVersion = createHash("sha256")
  .update(
    readdirSync(docsPluginDir)
      .filter((name) => name.endsWith(".mjs"))
      .sort()
      .map((name) => readFileSync(path.join(docsPluginDir, name), "utf8"))
      .join("\0")
  )
  .digest("hex")
  .slice(0, 16);

// Docs 의 .mdx 파일을 빌드할 때 화면으로 바꾼다.
// Turbopack 은 함수를 넘기지 못하므로 플러그인을 이름과 JSON 으로 적는다.
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      // 문서 맨 앞의 frontmatter(제목, 소개, 날짜, 태그)를 읽어 `export const frontmatter` 로 내보낸다.
      // MDX 가 원문을 읽기 전에 frontmatter 를 빈칸으로 바꾸므로 다른 플러그인보다 앞에 둔다.
      // version 은 플러그인이 읽지 않는다. 캐시를 가르는 값이다.
      [
        path.join(process.cwd(), "src/features/docs/remark-front-matter.mjs"),
        { version: docsPluginVersion },
      ],
      "remark-gfm",
      // "마크다운으로 복사" 에 쓸 Markdown 을 MDX 원문에서 만들어 `export const markdown` 으로 내보낸다.
      path.join(process.cwd(), "src/features/docs/remark-markdown.mjs"),
      // ```mermaid 코드 블록을 흐름도 그림으로 바꾼다. 복사할 Markdown 에는 코드 블록이 남도록 remark-markdown 뒤에 둔다.
      path.join(process.cwd(), "src/features/docs/remark-diagram.mjs"),
    ],
    rehypePlugins: [
      // 목차가 제목으로 가도록 h2, h3 에 id 를 붙인다.
      "rehype-slug",
      // 붙인 id 로 목차를 만든다. 로더가 .mdx 파일의 폴더에서 이름을 찾으므로 절대 경로로 넘긴다.
      path.join(process.cwd(), "src/features/docs/rehype-toc.mjs"),
      [
        "@shikijs/rehype",
        {
          // 두 화면 모드의 색을 변수로만 적고, globals.css 가 지금 모드의 색을 고른다.
          // -default 테마를 고른 까닭은 가장 흐린 글자도 코드 블록 배경과의 대비가 4.5:1 을 넘기 때문이다.
          themes: { light: "github-light-default", dark: "github-dark-default" },
          defaultColor: false,
          // 코드 블록 위쪽 막대에 언어 이름을 보여 주려고 code 에 language-* 를 붙인다.
          addLanguageClass: true,
          // 쓰인 언어만 불러온다. 모르는 언어와 언어를 적지 않은 블록은 색 없이 보여 준다.
          langs: [],
          lazy: true,
          defaultLanguage: "text",
          fallbackLanguage: "text",
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
