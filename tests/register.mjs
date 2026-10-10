// 단위 시험을 Node 로 바로 돌릴 때 쓰는 주소 풀이 규칙.
// Next.js 가 해 주던 두 가지를 대신한다. "@/..." 를 src 아래로 바꾸고, 확장자를 뺀 주소에 .ts 를 붙인다.
import { existsSync } from "node:fs"
import { registerHooks } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const sourceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src"
)

function withExtension(filePath) {
  if (path.extname(filePath)) {
    return filePath
  }
  for (const candidate of [`${filePath}.ts`, `${filePath}.tsx`]) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return filePath
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = withExtension(path.join(sourceRoot, specifier.slice(2)))
      return nextResolve(pathToFileURL(target).href, context)
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const target = withExtension(
        fileURLToPath(new URL(specifier, context.parentURL))
      )
      return nextResolve(pathToFileURL(target).href, context)
    }
    return nextResolve(specifier, context)
  },
})
