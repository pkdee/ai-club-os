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

// 그림 파일은 번들러가 주소로 바꿔 주는 것이라 Node 가 읽을 수 없다. 시험에서는 주소가 든 빈 값으로 대신한다.
const IMAGE_STUB =
  "data:text/javascript,export default { src: '/stub.svg' }"

// Next.js 는 "server-only" 를 서버에서만 불러올 수 있다는 표시로 직접 다룬다. 시험에서는 빈 모듈로 대신한다.
const EMPTY_MODULE = "data:text/javascript,export {}"

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: EMPTY_MODULE, shortCircuit: true }
    }
    if (specifier.endsWith(".svg")) {
      return { url: IMAGE_STUB, shortCircuit: true }
    }
    if (specifier.startsWith("@/")) {
      const target = withExtension(path.join(sourceRoot, specifier.slice(2)))
      return nextResolve(pathToFileURL(target).href, context)
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const filePath = fileURLToPath(new URL(specifier, context.parentURL))
      const target = withExtension(filePath)
      // .ts 를 찾지 못한 주소는 Node 에 그대로 맡긴다. node_modules 의 CommonJS 가 확장자 없이 부르는 .js 가 그렇다.
      if (target !== filePath) {
        return nextResolve(pathToFileURL(target).href, context)
      }
    }
    return nextResolve(specifier, context)
  },
})
