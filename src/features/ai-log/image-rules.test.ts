import assert from "node:assert/strict"
import { test } from "node:test"

import {
  AI_LOG_IMAGE_ACCEPT,
  AI_LOG_IMAGE_MAX_BYTES,
  aiLogImagePath,
  formatImageSize,
  imageFileError,
  isAiLogImageType,
  parseAiLogImagePath,
  pickImageFiles,
} from "./image-rules"

const CLUB = "11111111-1111-4111-8111-111111111111"
const LOG = "22222222-2222-4222-8222-222222222222"
const FILE = "33333333-3333-4333-8333-333333333333"

test("이미지 네 가지 형식만 받는다", () => {
  assert.equal(AI_LOG_IMAGE_ACCEPT, "image/png,image/jpeg,image/webp,image/gif")
  assert.equal(isAiLogImageType("image/png"), true)
  assert.equal(isAiLogImageType("image/svg+xml"), false)
  assert.equal(isAiLogImageType("toString"), false)
  assert.equal(isAiLogImageType(undefined), false)
})

test("형식과 크기가 맞는 파일만 올릴 수 있다", () => {
  assert.equal(imageFileError({ type: "image/png", size: 1 }), null)
  assert.equal(imageFileError({ type: "image/gif", size: AI_LOG_IMAGE_MAX_BYTES }), null)
  assert.match(imageFileError({ type: "application/pdf", size: 10 }) ?? "", /형식/)
  assert.match(imageFileError({ type: "", size: 10 }) ?? "", /형식/)
  assert.match(imageFileError({ type: "image/png", size: 0 }) ?? "", /빈 파일/)
  assert.match(imageFileError({ type: "image/png", size: 1.5 }) ?? "", /빈 파일/)
  assert.match(imageFileError({ type: "image/png", size: "10" }) ?? "", /빈 파일/)
  assert.match(
    imageFileError({ type: "image/png", size: AI_LOG_IMAGE_MAX_BYTES + 1 }) ?? "",
    /5MB 까지/
  )
})

test("크기를 읽기 쉬운 글자로 바꾼다", () => {
  assert.equal(formatImageSize(1), "1KB")
  assert.equal(formatImageSize(204800), "200KB")
  assert.equal(formatImageSize(1024 * 1024), "1MB")
  assert.equal(formatImageSize(1.26 * 1024 * 1024), "1.3MB")
  assert.equal(formatImageSize(12.4 * 1024 * 1024), "12MB")
})

test("경로는 Club, 기록, 앱이 만든 파일 이름의 세 마디다", () => {
  const path = aiLogImagePath(CLUB, LOG, FILE, "image/jpeg")
  assert.equal(path, `${CLUB}/${LOG}/${FILE}.jpg`)
  assert.deepEqual(parseAiLogImagePath(path), { clubId: CLUB, logId: LOG })
  assert.equal(parseAiLogImagePath(`${CLUB}/${LOG}/../x.png`), null)
  assert.equal(parseAiLogImagePath(`${CLUB}/${LOG}/${FILE}.svg`), null)
  assert.equal(parseAiLogImagePath(`${CLUB}/${FILE}.png`), null)
  assert.equal(parseAiLogImagePath(`/${CLUB}/${LOG}/${FILE}.png`), null)
  assert.equal(parseAiLogImagePath(`${CLUB}/${LOG}/${FILE}.png?x=1`), null)
  assert.equal(parseAiLogImagePath(null), null)
})

test("고른 파일을 남은 자리만큼만 올린다", () => {
  const files = [
    { name: "a.png", type: "image/png", size: 100 },
    { name: "b.pdf", type: "application/pdf", size: 100 },
    { name: "c.webp", type: "image/webp", size: 100 },
    { name: "d.gif", type: "image/gif", size: 100 },
  ]
  const pick = pickImageFiles(files, 2)
  assert.deepEqual(pick.accepted.map((file) => file.name), ["a.png", "c.webp"])
  assert.deepEqual(pick.rejected.map((file) => file.name), ["b.pdf", "d.gif"])
  assert.match(pick.rejected[0].message, /형식/)
  assert.match(pick.rejected[1].message, /4장까지/)
  assert.equal(pickImageFiles(files, 0).accepted.length, 0)
  assert.equal(pickImageFiles(files, -1).accepted.length, 0)
})
