import assert from "node:assert/strict"
import { test } from "node:test"

import {
  clubLogoFileType,
  clubLogoPath,
  clubLogoUrl,
  isClubLogoType,
  logoSourceError,
} from "./logo-rules"

const CLUB = "0f0e0d0c-0b0a-4908-8706-050403020100"
const FILE = "11111111-1111-4111-8111-111111111111"

test("로고의 경로는 Club 과 앱이 만든 파일 이름의 두 마디다", () => {
  assert.equal(clubLogoPath(CLUB, FILE, "image/webp"), `${CLUB}/${FILE}.webp`)
  assert.equal(clubLogoPath(CLUB, FILE, "image/jpeg"), `${CLUB}/${FILE}.jpg`)
  assert.equal(isClubLogoType("image/png"), true)
  assert.equal(isClubLogoType("image/gif"), false)
  assert.equal(isClubLogoType("image/svg+xml"), false)
})

test("주소의 파일 이름은 앱이 만든 모양만 받는다", () => {
  assert.equal(clubLogoFileType(`${FILE}.png`), "image/png")
  assert.equal(clubLogoFileType(`${FILE}.jpg`), "image/jpeg")
  assert.equal(clubLogoFileType(`${FILE}.webp`), "image/webp")
  for (const file of [
    `${FILE}.svg`,
    `${FILE}.PNG`,
    `${FILE.replace(/1/g, "A")}.png`,
    FILE,
    "../secret.png",
    `x/${FILE}.png`,
  ]) {
    assert.equal(clubLogoFileType(file), null, file)
  }
})

test("화면의 로고 주소는 그 Club 의 자리를 가리킬 때만 만든다", () => {
  assert.equal(
    clubLogoUrl(CLUB, `${CLUB}/${FILE}.webp`),
    `/clubs/${CLUB}/logo/${FILE}.webp`
  )
  assert.equal(clubLogoUrl(CLUB, null), null)
  assert.equal(
    clubLogoUrl(CLUB, `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/${FILE}.webp`),
    null
  )
  assert.equal(clubLogoUrl(CLUB, `${CLUB}/../${FILE}.webp`), null)
})

test("줄이기 전의 원본은 네 가지 형식과 10MB 까지만 받는다", () => {
  assert.equal(logoSourceError({ type: "image/gif", size: 1000 }), null)
  assert.match(
    logoSourceError({ type: "image/svg+xml", size: 1000 }) ?? "",
    /형식/
  )
  assert.match(logoSourceError({ type: "image/png", size: 0 }) ?? "", /빈 파일/)
  assert.match(
    logoSourceError({ type: "image/png", size: 10 * 1024 * 1024 + 1 }) ?? "",
    /10MB/
  )
})
