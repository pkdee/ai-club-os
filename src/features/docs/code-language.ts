const PREFIX = "language-"

// 색을 칠하지 않은 그냥 글. 위쪽 막대에 이름을 보여 주지 않는다.
const PLAIN = new Set(["text", "plaintext", "txt", "plain"])

// 자주 쓰는 언어의 보여 줄 이름. 여기에 없는 언어는 적은 이름 그대로 보여 준다.
const LABELS: Record<string, string> = {
  bash: "Terminal",
  sh: "Terminal",
  shell: "Terminal",
  shellscript: "Terminal",
  zsh: "Terminal",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  py: "Python",
  python: "Python",
  json: "JSON",
  sql: "SQL",
  md: "Markdown",
  markdown: "Markdown",
  mdx: "MDX",
  yaml: "YAML",
  yml: "YAML",
  html: "HTML",
  css: "CSS",
  diff: "Diff",
}

// 코드 블록 위쪽 막대에 보여 줄 언어 이름. className 은 Shiki 가 language-* 를 붙인 code 의 class 다.
// 언어를 적지 않았거나 그냥 글이면 null 이다.
export function codeLanguageLabel(className: string | undefined): string | null {
  const lang = className
    ?.split(/\s+/)
    .find((name) => name.startsWith(PREFIX))
    ?.slice(PREFIX.length)
  if (!lang || PLAIN.has(lang)) {
    return null
  }
  return LABELS[lang] ?? lang
}
