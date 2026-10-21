import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { compile } from "@mdx-js/mdx"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { DOC_SLUGS } from "@/content/docs/list"

import remarkFrontMatter from "./remark-front-matter.mjs"

// 문서 안의 링크가 실제로 있는 화면, 문서, 제목을 가리키는지 본다.
// 문서는 /clubs/<clubId>/docs/<slug> 에서 열리므로 상대 경로는 그 주소를 기준으로 푼다.
// 바깥 주소는 시험에서 열어 보지 않고 https 인지만 본다.

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..")
const docsFolder = path.join(root, "content/docs")
const base = "https://club.example/clubs/club-1/docs/"

type Node = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: Node[]
}

// src/app 의 page.tsx 마다 주소의 모양. [clubId] 같은 칸은 아무 한 마디와 맞는다.
function appRoutes(): RegExp[] {
  const appFolder = path.join(root, "app")
  return readdirSync(appFolder, { recursive: true, encoding: "utf8" })
    .filter((file) => path.basename(file) === "page.tsx")
    .map((file) => {
      const parts = path
        .dirname(file)
        .split(path.sep)
        .filter((part) => part !== "." && !/^\(.*\)$/.test(part))
        .map((part) => (/^\[.+\]$/.test(part) ? "[^/]+" : part))
      return new RegExp(`^/${parts.join("/")}$`.replace(/\/\$$/, "$"))
    })
}

// 빌드와 같은 플러그인으로 문서를 바꿔 제목의 id 와 링크를 모은다.
async function readDoc(slug: string) {
  const ids = new Set<string>()
  const links: string[] = []
  const collect = () => (tree: Node) => {
    const walk = (node: Node) => {
      if (typeof node.properties?.id === "string") {
        ids.add(node.properties.id)
      }
      if (node.tagName === "a" && typeof node.properties?.href === "string") {
        links.push(node.properties.href)
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
  await compile(readFileSync(path.join(docsFolder, `${slug}.mdx`), "utf8"), {
    remarkPlugins: [remarkFrontMatter, remarkGfm],
    rehypePlugins: [rehypeSlug, collect],
  })
  return { ids, links }
}

test("문서 안의 링크는 있는 화면, 문서, 제목을 가리킨다", async () => {
  const routes = appRoutes()
  const docs = new Map(
    await Promise.all(
      DOC_SLUGS.map(async (slug) => [slug, await readDoc(slug)] as const)
    )
  )
  const broken: string[] = []

  for (const [slug, { links }] of docs) {
    for (const href of links) {
      if (/^https?:/.test(href)) {
        if (!href.startsWith("https://")) {
          broken.push(`${slug}: ${href} (https 가 아닙니다)`)
        }
        continue
      }
      const url = new URL(href, `${base}${slug}`)
      const target = url.pathname.startsWith("/clubs/club-1/docs/")
        ? url.pathname.slice("/clubs/club-1/docs/".length)
        : null
      if (target !== null) {
        if (!docs.has(target)) {
          broken.push(`${slug}: ${href} (목록에 없는 문서)`)
          continue
        }
      } else if (!routes.some((route) => route.test(url.pathname))) {
        broken.push(`${slug}: ${href} (없는 화면)`)
        continue
      }
      const id = decodeURIComponent(url.hash.slice(1))
      if (id && !docs.get(target ?? "")?.ids.has(id)) {
        broken.push(`${slug}: ${href} (없는 제목)`)
      }
    }
  }

  assert.deepEqual(broken, [])
})
