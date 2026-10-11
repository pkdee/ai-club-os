import assert from "node:assert/strict"
import { test } from "node:test"

import {
  accountDeleteConfirmValue,
  isAccountDeleteConfirmed,
  planAccountDeletion,
  type AccountClub,
} from "./plan"

function club(name: string, extra: Partial<AccountClub>): AccountClub {
  return { id: name, name, role: "member", memberCount: 3, adminCount: 1, ...extra }
}

test("Club 마다 생길 일을 가른다", () => {
  const plan = planAccountDeletion([
    club("혼자", { role: "admin", memberCount: 1 }),
    club("마지막 운영자", { role: "admin", memberCount: 4, adminCount: 1 }),
    club("운영자 둘", { role: "admin", memberCount: 4, adminCount: 2 }),
    club("구성원", { role: "member", memberCount: 2, adminCount: 1 }),
  ])
  assert.deepEqual(plan.removed.map((item) => item.name), ["혼자"])
  assert.deepEqual(plan.handedOver.map((item) => item.name), ["마지막 운영자"])
  assert.deepEqual(plan.left.map((item) => item.name), ["운영자 둘", "구성원"])
})

test("속한 Club 이 없으면 생길 일도 없다", () => {
  assert.deepEqual(planAccountDeletion([]), { removed: [], handedOver: [], left: [] })
})

test("이메일을 입력해야 지울 수 있고, 이메일이 없으면 정해 둔 말을 입력한다", () => {
  assert.equal(accountDeleteConfirmValue("me@example.com"), "me@example.com")
  assert.equal(accountDeleteConfirmValue(null), "계정 지우기")
  assert.equal(accountDeleteConfirmValue("  "), "계정 지우기")
  assert.equal(isAccountDeleteConfirmed(" Me@Example.com ", "me@example.com"), true)
  assert.equal(isAccountDeleteConfirmed("me@example.co", "me@example.com"), false)
  assert.equal(isAccountDeleteConfirmed("", "me@example.com"), false)
  assert.equal(isAccountDeleteConfirmed("계정 지우기", null), true)
  assert.equal(isAccountDeleteConfirmed(undefined, null), false)
})
