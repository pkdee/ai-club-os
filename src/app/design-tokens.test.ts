import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { lint, type ResolvedDimension } from "@google/design.md/linter"

// DESIGN.md 의 토큰이 globals.css 와 같은지 본다. 두 곳 가운데 한 곳만 고치면 실패한다.
const design = readFileSync(new URL("../../DESIGN.md", import.meta.url), "utf8")
const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8")
const report = lint(design)
const tokens = report.designSystem

function cssBlock(selector: string) {
  const start = css.indexOf(`${selector} {`)
  assert.ok(start >= 0, selector)
  const end = css.indexOf("\n}", start)
  const values = new Map<string, string>()
  for (const match of css.slice(start, end).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    values.set(match[1], match[2].trim())
  }
  return values
}

const light = cssBlock(":root")
const radius = light.get("radius") ?? ""
light.delete("radius")
const dark = cssBlock(".dark")
const inline = cssBlock("@theme inline")
const theme = cssBlock("@theme")

// 색은 DESIGN.md 를 읽는 도구가 바꾼 16진수로 견준다. rgb() 와 16진수로 적은 같은 색은 같다고 본다.
function hexes(colors: Map<string, string>) {
  const yaml = [...colors].map(([name, value]) => `  ${name}: "${value}"`).join("\n")
  const parsed = lint(`---\nname: css\ncolors:\n${yaml}\n---\n`).designSystem.colors
  return new Map([...parsed].map(([name, color]) => [name, color.hex]))
}

function size(dimension: ResolvedDimension | undefined) {
  return dimension ? `${dimension.value}${dimension.unit}` : undefined
}

// 컴포넌트 토큰에 적을 수 없는 테두리 색과, 코드에서 아직 쓰지 않는 토큰. 까닭은 DESIGN.md 의 Components 절에 있다.
const UNREFERENCED =
  /^colors\.(input|border-.+|popover.*|secondary-.+|accent-foreground|icon-strong|icon-disabled)$/

test("DESIGN.md 는 형식 검사에서 받아들이기로 한 경고만 낸다", () => {
  assert.equal(report.summary.errors, 0)
  const unexpected = report.findings.filter((finding) => {
    if (finding.severity === "info") return false
    if (finding.rule === "orphaned-tokens") return !UNREFERENCED.test(finding.path ?? "")
    // WCAG 는 비활성 요소를 대비 기준에서 뺀다.
    if (finding.rule === "contrast-ratio") return !/^components\.[a-z0-9-]+-disabled$/.test(finding.path ?? "")
    return true
  })
  assert.deepEqual(unexpected, [])
})

test("Light 색은 globals.css 의 :root 와 같다", () => {
  const expected = hexes(light)
  const actual = new Map([...tokens.colors].map(([name, color]) => [name, color.hex]))
  assert.deepEqual(actual, expected)
})

test("Dark 색과 클래스 이름의 표는 globals.css 와 같다", () => {
  const rows = new Map<string, { cls: string; light: string; dark: string }>()
  for (const match of design.matchAll(/^\| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \| `([^`]+)`[^|]*\| `([^`]+)`[^|]*\|$/gm)) {
    rows.set(match[1], { cls: match[2], light: match[3], dark: match[4] })
  }
  assert.deepEqual([...rows.keys()], [...light.keys()])

  const classOf = new Map<string, string>()
  for (const [name, value] of inline) {
    const target = value.match(/^var\(--([a-z0-9-]+)\)$/)?.[1]
    if (name.startsWith("color-") && target) classOf.set(target, name.slice("color-".length))
  }
  const tableLight = hexes(new Map([...rows].map(([name, row]) => [name, row.light])))
  const tableDark = hexes(new Map([...rows].map(([name, row]) => [name, row.dark])))
  assert.deepEqual(tableLight, hexes(light))
  assert.deepEqual(tableDark, hexes(dark))
  for (const [name, row] of rows) {
    assert.equal(row.cls, classOf.get(name), name)
  }
})

test("글자 단계는 globals.css 의 @theme 과 같다", () => {
  const levels = [...theme.keys()]
    .filter((name) => /^text-[a-z0-9-]+$/.test(name) && !name.includes("--"))
    .map((name) => name.slice("text-".length))
  assert.deepEqual([...tokens.typography.keys()], levels)

  for (const level of levels) {
    const typography = tokens.typography.get(level)!
    assert.deepEqual(
      {
        fontSize: size(typography.fontSize),
        fontWeight: typography.fontWeight === undefined ? undefined : String(typography.fontWeight),
        lineHeight: size(typography.lineHeight),
        letterSpacing: size(typography.letterSpacing),
      },
      {
        fontSize: theme.get(`text-${level}`),
        fontWeight: theme.get(`text-${level}--font-weight`),
        lineHeight: theme.get(`text-${level}--line-height`),
        letterSpacing: theme.get(`text-${level}--letter-spacing`),
      },
      level
    )
    assert.equal(typography.fontFamily, "Noto Sans KR")
  }
})

test("모서리는 globals.css 의 --radius 단계와 같다", () => {
  assert.ok(radius.endsWith("rem"), radius)
  const base = parseFloat(radius) * 16
  const expected = new Map<string, string>()
  for (const [name, value] of inline) {
    const level = name.match(/^radius-([a-z0-9]+)$/)?.[1]
    if (!level) continue
    const times = value === "var(--radius)" ? 1 : Number(value.match(/\*\s*([\d.]+)\)$/)?.[1])
    expected.set(level, `${Math.round(base * times * 100) / 100}px`)
  }
  expected.set("full", "9999px")
  const actual = new Map([...tokens.rounded].map(([name, value]) => [name, size(value)]))
  assert.deepEqual(actual, expected)
})

test("그림자 표는 globals.css 의 @theme 과 같다", () => {
  const rows = new Map<string, string>()
  for (const match of design.matchAll(/^\| `(shadow-[a-z0-9]+)` \| `([^`]+)` \|$/gm)) {
    rows.set(match[1], match[2])
  }
  const expected = new Map([...theme].filter(([name]) => name.startsWith("shadow-")))
  assert.deepEqual(rows, expected)
})
