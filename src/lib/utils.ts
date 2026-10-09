import { createCn } from "cn/config"

// globals.css 의 글자 단계 이름. 등록하지 않으면 text-label-m 같은 클래스가
// 글자 색으로 분류돼 text-foreground 같은 색 클래스와 합쳐질 때 사라진다.
const TEXT_SCALE = [
  "display-l",
  "h1",
  "h2",
  "h3",
  "h4",
  "body-l",
  "body-m",
  "body-s",
  "label-l",
  "label-m",
  "label-s",
  "caption",
  "overline",
]

export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: TEXT_SCALE }] } },
})
