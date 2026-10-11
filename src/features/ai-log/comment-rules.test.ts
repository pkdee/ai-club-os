import assert from "node:assert/strict"
import { test } from "node:test"

import { AI_LOG_COMMENT_MAX, cleanComment, commentError } from "./comment-rules"

test("댓글의 앞뒤 공백을 떼고 줄바꿈을 한 글자로 맞춘다", () => {
  assert.equal(cleanComment("  겹치는 길이도\r\n바꿔 보셨나요?  "), "겹치는 길이도\n바꿔 보셨나요?")
  assert.equal(cleanComment(undefined), "")
  assert.equal(cleanComment(" \n "), "")
})

test("빈 댓글과 너무 긴 댓글은 받지 않는다", () => {
  assert.equal(commentError(""), "댓글을 입력해 주세요.")
  assert.equal(commentError("좋아요"), null)
  assert.equal(commentError("가".repeat(AI_LOG_COMMENT_MAX)), null)
  assert.equal(commentError("가".repeat(AI_LOG_COMMENT_MAX + 1)), `댓글은 ${AI_LOG_COMMENT_MAX}자 이내로 적어 주세요.`)
})
