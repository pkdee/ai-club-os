---
version: alpha
name: AI Club OS
description: 인공지능 동아리와 스터디가 활동을 기록하고 이해하고 결과물로 잇는 작업 공간. 조용한 zinc 바탕에 대표 색 indigo 하나를 쓰고, 한국어 본문을 Noto Sans KR 로 놓는다.
colors:
  # 면
  background: "#ffffff"
  bg-app: "#fafafa"
  card: "#ffffff"
  popover: "#ffffff"
  muted: "#f4f4f5"
  accent: "#f4f4f5"
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  primary-subtle: "#eef2ff"
  secondary: "#f4f4f5"
  secondary-hover: "#e4e4e7"
  destructive: "#dc2626"
  destructive-hover: "#b91c1c"
  danger-subtle: "#fef2f2"
  success-subtle: "#ecfdf5"
  warning-subtle: "#fffbeb"
  info-subtle: "#f0f9ff"
  bg-disabled: "#f4f4f5"
  bg-inverse: "#18181b"
  overlay: "rgb(0 0 0 / 0.5)"
  skeleton: "#e4e4e7"
  # 글자
  foreground: "#09090b"
  card-foreground: "#09090b"
  popover-foreground: "#09090b"
  secondary-foreground: "#09090b"
  accent-foreground: "#09090b"
  muted-foreground: "#52525b"
  text-tertiary: "#71717a"
  text-disabled: "#a1a1aa"
  primary-foreground: "#ffffff"
  text-brand: "#4338ca"
  text-success: "#047857"
  text-warning: "#92400e"
  text-danger: "#b91c1c"
  text-info: "#0369a1"
  text-inverse: "#ffffff"
  # 선
  border: "#e4e4e7"
  input: "#d4d4d8"
  ring: "#6366f1"
  border-brand: "#c7d2fe"
  border-success: "#a7f3d0"
  border-warning: "#fde68a"
  border-danger: "#fecaca"
  border-danger-strong: "#ef4444"
  border-info: "#bae6fd"
  # 아이콘
  icon: "#52525b"
  icon-subtle: "#a1a1aa"
  icon-strong: "#18181b"
  icon-on-primary: "#ffffff"
  icon-brand: "#4f46e5"
  icon-success: "#059669"
  icon-warning: "#d97706"
  icon-danger: "#dc2626"
  icon-info: "#0284c7"
  icon-disabled: "#d4d4d8"
typography:
  display-l:
    fontFamily: Noto Sans KR
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 2.875rem
    letterSpacing: -0.01em
  h1:
    fontFamily: Noto Sans KR
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 2.375rem
    letterSpacing: -0.01em
  h2:
    fontFamily: Noto Sans KR
    fontSize: 1.375rem
    fontWeight: 700
    lineHeight: 2rem
    letterSpacing: -0.005em
  h3:
    fontFamily: Noto Sans KR
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.75rem
  h4:
    fontFamily: Noto Sans KR
    fontSize: 1rem
    fontWeight: 700
    lineHeight: 1.5rem
  body-l:
    fontFamily: Noto Sans KR
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.625rem
  body-m:
    fontFamily: Noto Sans KR
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.375rem
  body-s:
    fontFamily: Noto Sans KR
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.25rem
  label-l:
    fontFamily: Noto Sans KR
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.5rem
  label-m:
    fontFamily: Noto Sans KR
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25rem
  label-s:
    fontFamily: Noto Sans KR
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1rem
  caption:
    fontFamily: Noto Sans KR
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.125rem
  overline:
    fontFamily: Noto Sans KR
    fontSize: 0.6875rem
    fontWeight: 500
    lineHeight: 1rem
    letterSpacing: 0.06em
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 20px
  full: 9999px
spacing:
  "1": 4px
  "1.5": 6px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-m}"
  app-canvas:
    backgroundColor: "{colors.bg-app}"
    textColor: "{colors.foreground}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: 20px
  dialog:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
    width: 480px
  dialog-overlay:
    backgroundColor: "{colors.overlay}"
  menu:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: 4px
  menu-item:
    typography: "{typography.label-m}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 10px
  menu-item-highlighted:
    backgroundColor: "{colors.accent}"
  menu-item-danger-highlighted:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.text-danger}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label-m}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.bg-disabled}"
    textColor: "{colors.text-disabled}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-m}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 16px
  button-secondary-hover:
    backgroundColor: "{colors.accent}"
  button-ghost:
    textColor: "{colors.foreground}"
    typography: "{typography.label-m}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 16px
  button-ghost-hover:
    backgroundColor: "{colors.accent}"
  button-danger:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label-m}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 16px
  button-danger-hover:
    backgroundColor: "{colors.destructive-hover}"
  button-sm:
    height: 32px
    padding: 12px
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-m}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 12px
  input-placeholder:
    textColor: "{colors.text-tertiary}"
  input-disabled:
    backgroundColor: "{colors.bg-disabled}"
    textColor: "{colors.text-disabled}"
  badge-neutral:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label-s}"
    rounded: "{rounded.full}"
    height: 22px
    padding: 8px
  badge-brand:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.text-brand}"
  badge-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.text-success}"
  badge-warning:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "{colors.text-warning}"
  badge-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.text-danger}"
  badge-info:
    backgroundColor: "{colors.info-subtle}"
    textColor: "{colors.text-info}"
  alert-info:
    backgroundColor: "{colors.info-subtle}"
    textColor: "{colors.text-info}"
    rounded: "{rounded.lg}"
    padding: 16px
  alert-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.text-success}"
  alert-warning:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "{colors.text-warning}"
  alert-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.text-danger}"
  avatar:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.text-brand}"
    rounded: "{rounded.full}"
    size: 32px
  skeleton:
    backgroundColor: "{colors.skeleton}"
    rounded: "{rounded.md}"
  tab-active-indicator:
    backgroundColor: "{colors.ring}"
    height: 2px
  club-mark:
    backgroundColor: "{colors.bg-inverse}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.label-m}"
    rounded: "{rounded.md}"
    size: 32px
  icon:
    textColor: "{colors.icon}"
    size: 16px
  icon-subtle:
    textColor: "{colors.icon-subtle}"
  icon-on-primary:
    textColor: "{colors.icon-on-primary}"
  icon-brand:
    textColor: "{colors.icon-brand}"
  icon-success:
    textColor: "{colors.icon-success}"
  icon-warning:
    textColor: "{colors.icon-warning}"
  icon-danger:
    textColor: "{colors.icon-danger}"
  icon-info:
    textColor: "{colors.icon-info}"
---

# Design

이 파일은 Google 의 [DESIGN.md 형식](https://github.com/google-labs-code/design.md)(alpha)을 따릅니다. 맨 위의 YAML 은 AI 도구가 그대로 읽는 디자인 토큰이고, 본문은 그 토큰을 언제 왜 쓰는지 적은 글입니다. 형식이 정한 여덟 절(Overview 부터 Do's and Don'ts 까지)은 도구가 알아보도록 영문 제목을 쓰고, 이 제품에만 있는 절은 그 뒤에 한국어 제목으로 둡니다.

토큰 값의 기준은 Figma 의 Foundations 페이지이고, 코드에서는 `src/app/globals.css` 입니다. 이 파일의 토큰과 표가 `globals.css` 와 어긋나면 `npm test` 가 실패합니다. 형식 검사는 `npm run design:lint` 로 합니다. 결정 배경은 `docs/adr/0030-design-md-format.md` 에 있습니다.

## Overview

### 제품 메시지

**Record. Understand. Build.**

사용자가 활동을 쉽게 남기고, 기록에서 의미를 찾고, 다음 행동이나 결과물로 이어 갈 수 있어야 합니다.

### 경험 원칙

#### 기록이 먼저다

AI 기능보다 빠르고 부담 없는 기록 경험을 먼저 만듭니다. 사용자가 남긴 원본 기록은 언제나 확인할 수 있어야 합니다.

#### 흐름을 끊지 않는다

Club, Session, Attendance, AI Log가 서로 다른 관리 화면의 모음처럼 느껴지지 않게 합니다. 사용자는 한 회차의 맥락 안에서 참여하고 기록합니다.

#### AI는 이해를 돕는다

AI는 사용자의 기록을 대신 소유하지 않습니다. 요약, 연결, 제안은 원본 기록으로 돌아갈 수 있어야 하며 사용자가 수정하거나 거절할 수 있어야 합니다.

#### 결과보다 과정도 보인다

완성된 프로젝트뿐 아니라 어떤 실험과 기록을 거쳐 결과에 도달했는지 보여 줍니다.

## Colors

- 색은 원시 색과 의미 색 두 층으로 나눕니다. 원시 색은 Tailwind 팔레트의 zinc, indigo, emerald, amber, red, sky 이고, 화면과 컴포넌트는 의미 색만 씁니다.
- 의미 색은 Light 와 Dark 두 모드를 가집니다. 변수의 코드 이름은 가능한 곳에서 shadcn/ui 의 CSS 변수 이름에 맞췄습니다. 2026-10-12 부터 앱이 두 모드를 모두 씁니다. 기기 설정을 따르고, 내 계정 화면에서 밝게와 어둡게를 고를 수 있습니다.
- 대표 색은 indigo 입니다.

화면은 zinc 의 무채색으로 조용하게 두고, 눈길을 모아야 하는 곳에만 indigo 를 씁니다. 성공, 주의, 위험, 안내는 emerald, amber, red, sky 를 옅은 바탕(`*-subtle`), 진한 글자(`text-*`), 테두리(`border-*`), 아이콘(`icon-*`)의 네 갈래로 나눠 씁니다.

맨 위 `colors` 의 값은 Light 모드입니다. DESIGN.md 형식에는 모드를 나누는 자리가 없어서 Dark 모드의 값은 아래 표에 함께 적습니다. 토큰 이름은 `src/app/globals.css` 의 CSS 변수 이름에서 `--` 를 뺀 것이고, 클래스 이름은 Tailwind 클래스에서 `bg-`, `text-`, `border-` 뒤에 붙이는 이름입니다. 예를 들어 `text-tertiary` 토큰은 `text-tertiary` 클래스로, `border-danger` 토큰은 `border-danger-border` 클래스로 씁니다. 값 옆의 이름은 Figma 의 원시 색입니다.

| 토큰 | 클래스 이름 | Light | Dark |
|---|---|---|---|
| `background` | `background` | `#ffffff` base/white | `#09090b` zinc/950 |
| `bg-app` | `app` | `#fafafa` zinc/50 | `#09090b` zinc/950 |
| `card` | `card` | `#ffffff` base/white | `#18181b` zinc/900 |
| `popover` | `popover` | `#ffffff` base/white | `#18181b` zinc/900 |
| `muted` | `muted` | `#f4f4f5` zinc/100 | `#27272a` zinc/800 |
| `accent` | `accent` | `#f4f4f5` zinc/100 | `#27272a` zinc/800 |
| `primary` | `primary` | `#4f46e5` indigo/600 | `#4f46e5` indigo/600 |
| `primary-hover` | `primary-hover` | `#4338ca` indigo/700 | `#6366f1` indigo/500 |
| `primary-subtle` | `primary-subtle` | `#eef2ff` indigo/50 | `#1e1b4b` indigo/950 |
| `secondary` | `secondary` | `#f4f4f5` zinc/100 | `#27272a` zinc/800 |
| `secondary-hover` | `secondary-hover` | `#e4e4e7` zinc/200 | `#3f3f46` zinc/700 |
| `destructive` | `destructive` | `#dc2626` red/600 | `#dc2626` red/600 |
| `destructive-hover` | `destructive-hover` | `#b91c1c` red/700 | `#ef4444` red/500 |
| `danger-subtle` | `danger-subtle` | `#fef2f2` red/50 | `#450a0a` red/950 |
| `success-subtle` | `success-subtle` | `#ecfdf5` emerald/50 | `#022c22` emerald/950 |
| `warning-subtle` | `warning-subtle` | `#fffbeb` amber/50 | `#451a03` amber/950 |
| `info-subtle` | `info-subtle` | `#f0f9ff` sky/50 | `#082f49` sky/950 |
| `bg-disabled` | `disabled` | `#f4f4f5` zinc/100 | `#27272a` zinc/800 |
| `bg-inverse` | `inverse` | `#18181b` zinc/900 | `#fafafa` zinc/50 |
| `overlay` | `overlay` | `rgb(0 0 0 / 0.5)` alpha/black-50 | `rgb(0 0 0 / 0.7)` alpha/black-70 |
| `skeleton` | `skeleton` | `#e4e4e7` zinc/200 | `#27272a` zinc/800 |
| `foreground` | `foreground` | `#09090b` zinc/950 | `#fafafa` zinc/50 |
| `card-foreground` | `card-foreground` | `#09090b` zinc/950 | `#fafafa` zinc/50 |
| `popover-foreground` | `popover-foreground` | `#09090b` zinc/950 | `#fafafa` zinc/50 |
| `secondary-foreground` | `secondary-foreground` | `#09090b` zinc/950 | `#fafafa` zinc/50 |
| `accent-foreground` | `accent-foreground` | `#09090b` zinc/950 | `#fafafa` zinc/50 |
| `muted-foreground` | `muted-foreground` | `#52525b` zinc/600 | `#a1a1aa` zinc/400 |
| `text-tertiary` | `tertiary` | `#71717a` zinc/500 | `#71717a` zinc/500 |
| `text-disabled` | `disabled-foreground` | `#a1a1aa` zinc/400 | `#52525b` zinc/600 |
| `primary-foreground` | `primary-foreground` | `#ffffff` base/white | `#ffffff` base/white |
| `text-brand` | `brand` | `#4338ca` indigo/700 | `#a5b4fc` indigo/300 |
| `text-success` | `success` | `#047857` emerald/700 | `#34d399` emerald/400 |
| `text-warning` | `warning` | `#92400e` amber/800 | `#fbbf24` amber/400 |
| `text-danger` | `danger` | `#b91c1c` red/700 | `#f87171` red/400 |
| `text-info` | `info` | `#0369a1` sky/700 | `#38bdf8` sky/400 |
| `text-inverse` | `inverse-foreground` | `#ffffff` base/white | `#09090b` zinc/950 |
| `border` | `border` | `#e4e4e7` zinc/200 | `#27272a` zinc/800 |
| `input` | `input` | `#d4d4d8` zinc/300 | `#3f3f46` zinc/700 |
| `ring` | `ring` | `#6366f1` indigo/500 | `#818cf8` indigo/400 |
| `border-brand` | `brand-border` | `#c7d2fe` indigo/200 | `#3730a3` indigo/800 |
| `border-success` | `success-border` | `#a7f3d0` emerald/200 | `#064e3b` emerald/900 |
| `border-warning` | `warning-border` | `#fde68a` amber/200 | `#78350f` amber/900 |
| `border-danger` | `danger-border` | `#fecaca` red/200 | `#7f1d1d` red/900 |
| `border-danger-strong` | `danger-border-strong` | `#ef4444` red/500 | `#ef4444` red/500 |
| `border-info` | `info-border` | `#bae6fd` sky/200 | `#0c4a6e` sky/900 |
| `icon` | `icon` | `#52525b` zinc/600 | `#a1a1aa` zinc/400 |
| `icon-subtle` | `icon-subtle` | `#a1a1aa` zinc/400 | `#71717a` zinc/500 |
| `icon-strong` | `icon-strong` | `#18181b` zinc/900 | `#fafafa` zinc/50 |
| `icon-on-primary` | `icon-on-primary` | `#ffffff` base/white | `#ffffff` base/white |
| `icon-brand` | `icon-brand` | `#4f46e5` indigo/600 | `#818cf8` indigo/400 |
| `icon-success` | `icon-success` | `#059669` emerald/600 | `#34d399` emerald/400 |
| `icon-warning` | `icon-warning` | `#d97706` amber/600 | `#fbbf24` amber/400 |
| `icon-danger` | `icon-danger` | `#dc2626` red/600 | `#f87171` red/400 |
| `icon-info` | `icon-info` | `#0284c7` sky/600 | `#38bdf8` sky/400 |
| `icon-disabled` | `icon-disabled` | `#d4d4d8` zinc/300 | `#3f3f46` zinc/700 |

## Typography

- 글꼴은 Noto Sans KR 입니다. 본문은 14px, 줄 높이 22px 입니다.

글꼴은 `next/font` 로 불러와 `--font-sans` 에 담습니다(`src/app/layout.tsx`). 글자 단계는 크기, 줄 높이, 굵기, 자간을 한 이름으로 묶은 것이고 `text-h1`, `text-body-m` 같은 클래스로 씁니다. 제목(`display-l`, `h1` 부터 `h4`)은 700, 이름표(`label-*`, `overline`)는 500, 본문(`body-*`, `caption`)은 400 입니다. 화면의 기본 글자는 `body-m` 이고, 버튼과 메뉴 항목은 `label-m`, 배지는 `label-s` 입니다. 입력 칸의 글자는 작은 화면에서 16px 이고 md 폭부터 `body-m` 입니다.

글자 단계 이름을 바꾸거나 더하면 `src/app/globals.css` 와 `src/lib/utils.ts` 두 곳을 함께 고칩니다. `utils.ts` 에 등록하지 않으면 `cn` 이 글자 단계 클래스를 글자 색으로 여겨, 색 클래스와 합칠 때 지웁니다.

## Layout

- 간격은 4px 단위이고, 모서리는 6, 8, 10, 14, 20px 단계입니다.

간격은 Tailwind 의 기본 간격(한 칸 4px)을 그대로 씁니다. `spacing` 토큰의 이름은 Tailwind 의 칸 수라서 `gap-1.5`, `p-5` 처럼 클래스에 바로 옮겨 씁니다. 자주 쓰는 값은 다음과 같습니다.

- 카드의 안쪽 여백은 20px(`p-5`)이고, 넓은 화면에서 24px(`sm:p-6`)로 늘리기도 합니다.
- 창의 안쪽 여백은 24px, 안쪽 칸 사이는 20px 이고 너비는 480px 까지입니다.
- 버튼의 좌우 여백은 MD 가 16px, SM 이 12px 입니다.

본문의 폭은 제한하지 않습니다. Club 안쪽 화면은 1024px 폭부터 왼쪽에 256px 의 메뉴를 두고, 그보다 좁으면 아래쪽 메뉴와 위쪽 막대로 바꿉니다. 작은 화면의 기준과 아래쪽 메뉴의 규칙은 Do's and Don'ts 의 화면 규칙에 있습니다.

## Elevation & Depth

층은 그림자보다 면의 색과 테두리로 나눕니다. Club 안쪽 화면의 본문은 흰 바탕(`background`)이고, 카드는 같은 흰 면(`card`)에 1px 테두리(`border`)를 둘러 나누며 그림자를 쓰지 않습니다. 왼쪽 메뉴와 로그인 화면의 옆면, 처음 화면과 오류 화면처럼 한 단계 물러난 면은 `bg-app` 입니다. Dark 모드에서는 바탕이 zinc/950, 카드가 zinc/900 이라 카드가 한 단계 밝게 떠오릅니다.

그림자는 다른 내용 위에 떠서 열리는 것에만 씁니다. 메뉴는 `shadow-lg`, 창은 `shadow-xl` 이고, 창 뒤에는 `overlay` 를 깝니다. 그림자 단계는 Figma 의 Effect style 과 같습니다.

| 이름 | 값 |
|---|---|
| `shadow-xs` | `0 1px 2px 0 rgb(13 13 26 / 0.05)` |
| `shadow-sm` | `0 1px 3px 0 rgb(13 13 26 / 0.08), 0 1px 2px -1px rgb(13 13 26 / 0.06)` |
| `shadow-md` | `0 4px 8px -1px rgb(13 13 26 / 0.08), 0 2px 4px -2px rgb(13 13 26 / 0.06)` |
| `shadow-lg` | `0 12px 20px -4px rgb(13 13 26 / 0.1), 0 4px 8px -4px rgb(13 13 26 / 0.06)` |
| `shadow-xl` | `0 24px 40px -8px rgb(13 13 26 / 0.16), 0 8px 12px -6px rgb(13 13 26 / 0.08)` |

## Shapes

모서리는 `--radius`(10px)를 기준으로 한 단계입니다. 카드와 창은 `rounded-xl`(14px), 메뉴와 알림 상자는 `rounded-lg`(10px), 버튼과 입력 칸, 메뉴 항목은 `rounded-md`(8px)입니다. 배지, Avatar, 탭의 수 표시는 `rounded-full` 로 끝을 둥글게 둡니다.

## Components

### 코드 연결

- 토큰은 `src/app/globals.css` 에 있습니다. 의미 색의 CSS 변수 이름은 Figma 변수의 코드 이름과 같고, 글자 단계는 `text-h1`, `text-body-m` 같은 Tailwind 클래스로 씁니다.
- 컴포넌트 이름은 shadcn/ui 관례를 따릅니다. Button 의 variant 는 `default` 가 Primary, `outline` 이 Secondary, `ghost` 가 Ghost, `destructive` 가 Danger 입니다. size 는 `default` 가 MD, `sm` 이 SM 입니다.
- 결정 배경은 `docs/adr/0001-design-tokens-as-css-variables.md` 에 있습니다.

### 컴포넌트 토큰

맨 위 `components` 는 자주 쓰는 컴포넌트의 면, 글자, 모서리, 크기를 적은 것입니다. `-hover`, `-disabled` 처럼 붙인 이름은 상태이고, 적지 않은 값은 붙기 전의 이름에서 이어받습니다. 코드에서는 다음 파일이 이 값을 씁니다.

| 토큰 | 코드 |
|---|---|
| `button-*` | `src/components/ui/button.tsx`. `primary` 는 variant `default`, `secondary` 는 `outline`, `ghost` 는 `ghost`, `danger` 는 `destructive`, `button-sm` 은 size `sm` 입니다. |
| `input-*` | `input.tsx`, `textarea.tsx`, `native-select.tsx` 가 함께 쓰는 모양 |
| `badge-*` | `badge.tsx` 의 tone |
| `alert-*` | `alert.tsx` 의 tone |
| `menu`, `menu-item-*`, `divider` | `menu.tsx` |
| `dialog`, `dialog-overlay` | `dialog.tsx` |
| `avatar` | `avatar.tsx` 의 기본 크기 md |
| `skeleton` | `skeleton.tsx` |
| `tab-active-indicator` | `link-tabs.tsx` 에서 고른 탭의 밑줄 |
| `card` | 따로 컴포넌트가 없고 `rounded-xl border bg-card p-5` 클래스로 씁니다. |
| `club-mark` | Club 안쪽 메뉴 위의 Club 이름 첫 글자 상자(`club-shell.tsx`) |
| `icon-*` | lucide 아이콘. 글자 색을 따르므로 `textColor` 로 적습니다. |

DESIGN.md 형식의 컴포넌트에는 테두리 속성이 없어서 테두리 색은 글로 적습니다. 카드와 메뉴의 테두리는 `border`, 버튼(`secondary`)과 입력 칸의 테두리는 `input`, 입력 칸의 오류는 `border-danger-strong`, 알림 상자는 tone 마다 `border-info` 같은 `border-*` 입니다. 초점은 `ring` 색으로 나타냅니다.

`npm run design:lint` 는 어떤 컴포넌트도 참조하지 않는 색 토큰마다 경고를 냅니다. 위의 테두리 색과, Figma 에는 있지만 코드에서 아직 쓰지 않는 토큰(`popover` 계열, `secondary` 계열, `accent-foreground`, `icon-strong`, `icon-disabled`)이 여기에 해당하며 받아들입니다. 비활성 상태(`*-disabled`)의 대비 경고도 WCAG 가 비활성 요소를 대비 기준에서 빼므로 받아들입니다. 이 밖의 경고는 `npm test` 가 실패로 봅니다.

## Do's and Don'ts

### 화면 규칙

- 한 화면에 Primary 버튼은 하나만 둡니다.
- 켜고 끄는 선택은 Checkbox 로 두고, 켜면 무슨 일이 생기는지를 바로 아래에 글로 적습니다. 밖으로 나가는 것과 되돌릴 수 없는 것을 다루는 선택은 기본을 꺼 둡니다.
- 한국어 문장은 단어 중간에서 줄을 바꾸지 않습니다.
- 상태는 색, 아이콘, 글자를 함께 써서 나타냅니다. Attendance 상태와 알림이 이 규칙을 따릅니다.
- 기본 상태는 AI Log 화면을 기준으로 그렸습니다. 권한이 없는 상태는 역할이 모자란 경우와 Club 소속이 아닌 경우를 나눕니다.
- 작은 화면은 390px 폭 기준이며 Club 개요, Attendance 기록, AI Log 쓰기를 그렸습니다.
- 작은 화면의 아래쪽 메뉴는 개요, Session, AI Log, AI Insight, Project, Member 여섯 칸입니다. 설정은 자리가 모자라 위쪽 막대의 버튼으로 두고 운영자에게만 보입니다. 칸 너비는 글자 길이에 맞춰서 320px 폭에서도 이름이 한 줄에 들어갑니다.

### 색과 토큰

- 화면과 컴포넌트에는 의미 색의 클래스만 씁니다. `zinc-500` 같은 원시 색의 클래스나 16진수 값을 직접 쓰지 않습니다.
- 토큰 값을 바꾸면 Figma, `src/app/globals.css`, 이 파일의 세 곳을 함께 고칩니다. `globals.css` 와 이 파일이 어긋나면 `npm test` 가 알려 주고, Figma 와는 손으로 맞춥니다.

### 접근성 원칙

- 키보드만으로 핵심 흐름을 수행할 수 있게 합니다.
- 색상만으로 상태를 전달하지 않습니다.
- 입력 항목의 이름과 오류 설명을 명확히 제공합니다.
- 작은 화면에서도 기록 작성 흐름을 유지합니다.

## MVP 정보 구조

- 로그인
- 내 Club
- Club 개요
- Session
  - Session 상세: 개요, Attendance, AI Log, AI Insight, 회고
- AI Log
- AI Insight
  - 한 달 정리
- Project
  - Project 상세: 목표, 할 일, 이 Project 의 AI Log, 이 Project 의 회고, 진행 상태, 참여자, 결과물 링크
- 회고
  - 최근 회고와 한 달 회고로 가는 달 목록
  - 한 달 회고: 그 달에 내가 한 것과, 이 달의 회고
- Member
- 알림: 내가 챙길 것과 새 소식
- Club 설정
- 발표: 로그인 없이 링크로 여는 화면. Club 안쪽 메뉴에는 없다
  - Project 발표
  - Club 발표
  - 발표 모드: 같은 발표를 한 장씩 넘겨 보는 화면

Attendance 는 따로 메뉴를 두지 않고 Session 상세의 탭으로 둡니다. 한 회차의 맥락 안에서 참여하고 기록한다는 원칙을 따른 것입니다.

AI Insight 는 v0.2 에서 더했습니다. 한 회차를 정리한 것은 그 Session 의 탭에서, 한 달을 정리한 것은 AI Insight 메뉴에서 만들고 봅니다. "AI는 이해를 돕는다" 는 원칙에 따라 항목마다 근거가 된 원본 AI Log 로 갈 수 있고, 운영자가 고치거나 빼거나 통째로 지울 수 있습니다. AI 가 정리한 것임을 항상 밝힙니다.

Project 는 v0.3 에서 더했습니다. "결과보다 과정도 보인다" 는 원칙에 따라 Project 화면은 결과물 링크만이 아니라 거기까지 온 할 일과 AI Log 를 함께 보여 줍니다. 참여자와 운영자에게만 고치는 버튼이 보이고, 다른 Member 는 같은 화면을 읽기만 합니다. AI Log 를 Project 에 묶는 일은 AI Log 를 쓰는 화면에서 하므로 기록하는 흐름이 끊기지 않습니다.

발표는 v0.4 에서 더했습니다. Club 밖의 사람이 보는 단 하나의 화면이라 Club 안쪽 화면과 틀이 다릅니다. 메뉴와 로그인한 사람의 정보가 없고, 위에 로고, 아래에 누가 볼 수 있는지 알리는 한 줄만 둡니다. Project 발표는 "결과보다 과정도 보인다" 는 원칙에 따라 결과물 링크 다음에 거기까지 온 AI Log 를 남긴 순서대로 보여 줍니다. 무엇이 밖으로 나가는지는 공개하기 전의 확인 창에서 글로 알리고, 작성자에게는 AI Log 를 쓰는 화면에서 기록마다 묻습니다.

발표 모드는 여러 사람 앞에서 띄워 놓고 보는 화면입니다. 위에는 발표 이름과 전체 화면 버튼, 아래에는 진행 막대와 앞뒤로 넘기는 버튼만 두고 가운데에 한 장을 놓습니다. AI Log 하나가 한 장이라 과정이 한 걸음씩 보입니다. 넓은 화면에서는 멀리서도 읽히게 장 전체를 키웁니다(1024px 부터 1.25배, 1536px 부터 1.5배). Figma 에는 키우지 않은 크기로 그렸습니다.

회고는 돌아보는 대상의 화면 안에 둡니다. Project 회고는 Project 화면에, Session 회고는 Session 의 탭에 있어서 그 맥락을 보면서 씁니다. 한 달 회고는 돌아볼 거리가 먼저 보이도록 그 달에 내가 남긴 AI Log 와 출석, 적어 둔 다음 행동을 옆에 둡니다. 세 칸은 색만으로 가르지 않고 이름과 아이콘을 함께 적습니다. 좁은 화면에서는 아래쪽 메뉴에 자리가 없어 개요의 내 기록에서 이번 달 회고로 갑니다.

탭이 화면보다 넓으면 옆으로 밀어 봅니다. 밀 수 있다는 것은 잘린 탭 이름으로 알리고 막대는 그리지 않습니다.

알림은 메뉴의 아래쪽, 설정 위에 둡니다. 기록하는 흐름을 끊지 않도록 화면 위에 뜨는 창이나 소리로 알리지 않고, 메뉴의 수로만 알립니다. 화면은 처리해야 사라지는 "챙길 것" 과 읽으면 되는 "소식" 을 나눠 보여 줍니다. 좁은 화면에서는 아래쪽 메뉴에 자리가 없어 위쪽 막대의 종 모양 버튼으로 둡니다.

## 화면 설계

화면 설계는 Figma 파일에서 관리합니다. v0.1 화면과 v0.2 의 AI Insight 화면, v0.3 의 Project 화면, v0.4 의 발표 화면이 들어 있습니다. 제품 이름은 화면에서도 AI Club OS 로 씁니다.

- 파일: https://www.figma.com/design/pSj712D4ia1bJZ1FytvzQ8/AI-DO
- 기준일: 2026-10-08. 2026-10-10 과 2026-10-11 에 구현하면서 바뀐 부분을 반영했습니다.

| 페이지 | 내용 |
|---|---|
| Foundations | 색, 글자, 간격, 모서리, 그림자 토큰과 견본 |
| Components | Icon, Action, Form, Display, Navigation, Domain 여섯 묶음의 컴포넌트 |
| Screens | 안내, Auth, Club, Member, Session, AI Log, 기본 상태, 작은 화면, Dark 모드 예시, AI Insight, Project, Web Presentation, 알림, 회고, 내 계정 |

화면은 모두 컴포넌트 인스턴스로 조립합니다. 화면에 쓴 역할, Attendance 상태, AI Log 항목은 `docs/REQUIREMENTS.md` 의 잠정 결정을 따릅니다.

디자인 토큰, 코드 연결, 화면 규칙은 2026-10-21 에 DESIGN.md 형식에 맞춰 위의 Colors 부터 Do's and Don'ts 까지의 절로 옮겼습니다.

### 설계에는 있고 아직 만들지 않은 것

2026-10-11 기준입니다. 만들 때 이 목록에서 지웁니다.

- 본문 폭 제한. 2026-10-10 에 사용자가 화면 폭을 그대로 쓰기로 정했습니다.

Member 목록의 더 보기와 Session 소개 아래의 시간표는 2026-10-11 에 만들어서 이 목록에서 지웠습니다.

### 구현하면서 바꾸고 Figma 에 반영한 것

2026-10-10 과 2026-10-11 에 아래 변경을 Figma 에도 반영했습니다. 지금은 구현과 Figma 가 같습니다.

- Avatar. Google 계정의 프로필 사진을 보여 줍니다. 컴포넌트에 `Show photo` 속성을 더했고 기본값은 켜짐입니다. 사진이 없거나 불러오지 못할 때는 이 속성을 끈 모습, 곧 이름의 첫 글자가 보입니다. Figma 의 사진은 사람 모양의 자리 표시입니다.
- Member 초대 창(`04-1`). "참여할 때 역할" 고르기를 빼고 만료 시각과 "새 링크 만들기" 를 넣었습니다. 참여하면 항상 구성원이 되고 링크는 7일 뒤 만료됩니다.
- Club 설정(`03-1`). 초대 링크 영역을 뺐습니다. 초대 링크는 Member 초대 창 한 곳에서만 다룹니다. 구성원에게는 설정 메뉴가 보이지 않습니다.
- 로그인 화면의 초대 안내(`01-2`). 초대 링크에서 넘어온 사람에게 보입니다.
- Member 의 관리 메뉴(`04-2`)와 내보내기 확인 창(`04-3`). 운영자에게는 역할 바꾸기와 내보내기가, 본인 행에는 Club 나가기가 보입니다. 되돌릴 수 없는 일은 확인 창을 거칩니다.
- 초대 참여 화면(`04-4`). 초대 링크를 열면 Club 을 미리 보고 참여하기를 누릅니다.
- AI Log 검색 결과(`06-3`)와 맞는 기록이 없을 때(`06-4`). 조건에 맞는 기록 수와 "조건 지우기" 를 보여 줍니다. 옆의 요약 영역은 아직 만들지 않아 이 두 화면에서는 뺐습니다.
- 없는 주소 화면(`07-7`). 로그인한 사람의 정보 없이 로고만 있는 머리말을 씁니다.
- AI Log 쓰기의 도구 고르기(`06-5`). 도구 칸에 적는 동안 맞는 도구를 아래에 보여 주고 고르게 합니다. `06-1` 의 도구 칸 안내 글도 이에 맞게 고쳤습니다.
- 도구 이름표의 로고. 도구 이름 앞에 그 도구의 로고를 둡니다. 로고가 없는 도구는 종류 아이콘을, 목록에 없는 도구는 공구 아이콘을 둡니다. Badge 에 `Show icon` 과 `Icon` 속성을 더했고 기본값은 꺼짐이라 다른 이름표는 그대로입니다. AILogCard 와 AI Log 상세(`06-2`)에서 이름표 줄 앞의 공구 아이콘을 뺐습니다. 고르는 목록(`06-5`)의 항목에도 로고가 있습니다. Components 페이지에 `Tool logo` 블록과 종류 아이콘 8개를 더했습니다. Figma 에는 로고 10개만 두었고 전체 짝은 코드의 `tool-logos.ts` 가 기준입니다.
- AI Log 목록 옆의 요약. 자주 쓴 도구와 Session 별 기록의 줄을 누를 수 있는 모양으로 고쳤고, 고른 줄은 바탕색으로 표시합니다. 요약을 만들었으므로 검색 결과(`06-3`)와 맞는 기록 없음(`06-4`)에도 다시 넣었습니다.
- AI Log 쓰기의 임시 저장(`06-6`). 다시 열면 불러온 내용과 맡긴 시각을 알리고 지우는 버튼을 둡니다. 쓰기 화면들의 기록 안내에 임시 저장 줄을 더했습니다.
- 삭제. AI Log 상세(`06-2`)와 Session 상세의 머리말에 삭제 버튼을, Club 설정(`03-1`)에 Club 삭제 영역을 더했습니다. 확인 창은 `06-7`, `05-5`, `03-2` 입니다. Club 은 이름을 입력해야 지울 수 있습니다.
- Member 검색 결과(`04-5`). 찾는 글자에 맞는 Member 수와 검색 지우기를 보여 줍니다.
- AI Insight(`10` 부터 `10-6`). v0.2 에서 새로 그린 화면입니다. 목록(`10`), Session 의 AI Insight 탭의 빈 상태(`10-1`), 만들기 확인(`10-2`), 초안(`10-3`), 고치기(`10-4`), 구성원이 보는 공개된 모습(`10-5`), 한 달 정리(`10-6`)입니다. Sidebar 와 좁은 화면의 아래쪽 메뉴에 AI Insight 를, Session 상세의 탭에 AI Insight 를 더했습니다. 쓰기 화면들의 기록 안내에는 기록이 AI 서비스로 보내질 수 있다는 줄을 더했습니다. 목록의 한 달 정리에는 AI Log 가 실제로 있는 달만 기록 수와 함께 나옵니다.
- Club 개요, Session 개요, Member 표는 처음 설계대로 만들어서 Figma 를 고치지 않았습니다. 다가오는 Session 은 옆 칸으로, Attendance 요약은 Session 개요의 옆 칸으로 옮겼습니다.
- AI Insight 다듬기. Club 개요(`03`)의 옆 칸에 가장 최근에 공개된 AI Insight 의 요약 카드를, Session 개요(`05-2`)에 지난 회차의 AI Insight 에 정리된 다음 행동 카드를 더했습니다. AI Insight 화면(`10-3`, `10-5`, `10-6`)에는 "글로 복사" 버튼을, 고치기(`10-4`)에는 묶음마다 항목을 더하는 버튼을 더했습니다.
- Project(`11` 부터 `11-5`). v0.3 에서 새로 그린 화면입니다. 목록(`11`), 빈 상태(`11-1`), 만들기 창(`11-2`), 참여자와 운영자가 보는 상세(`11-3`), 다른 Member 가 읽기만 하는 상세(`11-4`), 삭제 확인(`11-5`)입니다. 목록은 진행 상태로 걸러 보는 탭과 두 줄로 놓인 카드이고, 상세는 왼쪽에 목표, 할 일, 이 Project 의 AI Log 를, 오른쪽에 진행 상태, 참여자, 결과물 링크를 둡니다.
- 메뉴의 Project. Sidebar 에 `Nav/Project` 와 `Active=Project` 변형을, 좁은 화면의 아래쪽 메뉴에 `Tab/Project` 를 더했습니다. 아이콘 `folder-kanban` 과 `external-link` 를 Components 페이지에 더했습니다. 작은 화면의 Club 개요(`08-1`)는 위쪽 막대의 버튼을 설정으로 바꿨습니다.
- Project 다듬기. Project 상세(`11-3`, `11-4`)의 할 일에 담당자와 기한을 한 줄로 보이고, 기한이 지난 일은 색과 글로 알립니다. 고치는 창은 `11-6` 입니다. 참여자 영역에는 들어온 참여 요청과 받기, 거절 버튼을, 참여자가 아닌 구성원에게는 참여 요청 버튼을 둡니다. 옆 칸에 기록이 나온 Session 을 더했습니다. Club 개요(`03`)에는 내 Project 를, Session 개요(`05-2`)에는 이 회차의 Project 를 더했습니다.
- 발표(`12` 부터 `12-2`, `11-7`, `11-8`). v0.4 에서 새로 그린 화면입니다. Project 발표(`12`), Club 발표(`12-1`), 볼 수 없는 발표(`12-2`)가 로그인 없이 보는 화면입니다. Project 상세의 옆 칸에 발표 영역을 두었고, 공개하기 전의 확인 창이 `11-7`, 공개된 뒤의 모습이 `11-8` 입니다. Club 설정(`03-1`)에는 Club 발표 영역을 더했습니다. 아이콘 `presentation`, `ban`, `circle` 을 Components 페이지에 더했습니다.
- 운영 규칙. Member 내보내기 확인 창(`04-3`)에 다시 들어오지 못하게 막는 선택을 넣었습니다. 막은 사람의 목록은 `04-6`, 막힌 사람이 초대 링크를 열었을 때는 `04-7` 입니다. Club 설정(`03-1`)에 지운 기록을 더했습니다. AI Log 쓰기 화면들(`06-1`, `06-5`, `06-6`, `09-3`)의 옆 칸에 "이 기록의 쓰임" 을 두어 AI Insight 에 쓰지 않기와 발표에 넣어도 됨을 고르게 했고, AI Log 상세(`06-2`)의 기록 정보에 그 값을 보입니다. AI Insight 만들기 확인 창(`10-2`)에는 보내지 않는 기록 수와 오늘 남은 횟수를 적었습니다.
- 알림(`13`, `13-1`). 새로 그린 화면입니다. 챙길 것과 소식을 나눠 보여 주는 화면(`13`)과 알림이 없을 때(`13-1`)입니다. Sidebar 의 설정 위에 `Nav/Notification` 을 두고 `Active=Notification` 변형을 더했습니다. NavItem 에 수를 보이는 `Show count` 와 `Count` 속성을 더했고 기본값은 꺼짐입니다. 좁은 화면의 위쪽 막대(MobileTopBar)에는 기본으로 숨겨 둔 알림 버튼을 더했고 Club 개요(`08-1`)에서 켰습니다. 아이콘 `bell`, `list-todo`, `user-check`, `check-check` 를 Components 페이지에 더했습니다.
- 내 이름 고치기. 본인 행의 메뉴(`04-8`)에 "내 이름 고치기" 를 두고, 고치는 창은 `04-9` 입니다. Member 목록 아래의 "N명 중 M명" 과 더 보기는 처음 설계 그대로 만들었습니다.
- Session 시간표. Session 만들기 창(`05-1`)에 시간표 칸을 더했습니다. 개요에 보이는 모습은 처음 설계(`05-2`)대로입니다.
- AI Log 수정 기록(`06-8`). 본문 아래에 수정 기록 영역을 두고, 한 번의 수정을 펼치면 항목마다 고치기 전과 고친 뒤를 나란히 보여 줍니다. 쓰기 화면들(`06-1`, `06-5`, `06-6`, `07-6`, `09-3`)의 기록 안내에 수정 기록이 남는다는 줄을 더했습니다.
- 도구 표기 정리. Club 설정(`03-1`)의 Club 발표와 지운 기록 사이에 영역을 더했습니다. 합치면 좋은 묶음마다 합치기 버튼이 있고, 직접 골라 바꾸는 칸은 접어 둡니다. 아이콘 `combine` 을 더했습니다.
- 발표 다듬기. 공개 확인 창(`11-7`)에 소개 글 칸을, 공개된 뒤의 발표 영역(`11-8`)에 소개 글과 "발표 모드로 열기" 버튼을 더했습니다. 소개 글을 고치는 창은 `11-9` 입니다. 발표 화면(`12`, `12-1`)의 머리말에 "발표 모드" 버튼을, 제목 아래에 소개 글을 더했습니다. 발표 모드는 표지(`12-3`)와 AI Log 한 장(`12-4`)을 그렸습니다. 아이콘 `monitor-play`, `maximize` 를 더했습니다.
- 회고(`14` 부터 `14-3`). 새로 그린 화면입니다. 최근 회고와 달 목록을 보여 주는 화면(`14`), 한 달 회고(`14-1`), 쓰는 창(`14-2`), Session 상세의 회고 탭(`14-3`)입니다. Project 상세(`11-3`)에는 AI Log 아래에 회고 영역을 더했습니다. Sidebar 의 Project 다음에 `Nav/Retro` 를 두고 `Active=Retro` 변형을 더했습니다. Session 상세를 그린 화면들의 탭에 회고를 더했고, Club 개요(`03`)의 내 기록에 "이번 달 돌아보기" 버튼을 더했습니다. 아이콘 `rotate-ccw`, `notebook-pen` 을 Components 페이지에 더했습니다.
- 남은 운영 규칙. 알림(`13`)의 소식에 운영자가 된 것을 더했습니다. 수정 기록(`06-8`)과 쓰기 화면들의 기록 안내에는 90일을, Club 설정(`03-1`)의 지운 기록에는 365일을 적었습니다.
- 댓글과 이미지(`06-9`). AI Log 상세의 본문 아래에 이미지 영역과 댓글 영역을 더했습니다. 이미지는 네 칸의 작은 그림으로 놓고, 작성자에게는 붙이기 버튼과 장수를, 지울 수 있는 사람에게는 크기와 삭제 버튼을 보여 줍니다. 파일이 없는 줄은 빈 그림으로 보여 줍니다. 댓글 영역의 제목 줄 오른쪽에는 도움이 됐다고 표시한 사람의 이름이 옵니다.
- Session 과 Project 잇기. Session 개요(`05-2`)의 "이 회차의 Project" 와 Project 상세(`11-3`)의 "이어진 Session" 에 고르는 칸과 잇기 버튼을 더했습니다. 직접 이은 줄에는 "이어 둠" 과 끊는 아이콘이 붙습니다.
- 회고의 쓰임. 회고 쓰기 창(`14-2`)의 세 칸 아래에 켜고 끄는 선택을 하나 더했습니다. Project 발표(`12`)에는 과정 다음에 회고 영역을 더했습니다.
- 내 계정(`15` 부터 `15-2`). 새로 그린 화면입니다. 내 정보, 화면 모드, 개인 정보, 계정 지우기를 카드 네 장으로 놓은 화면(`15`), 계정 지우기 확인 창(`15-1`), 로그인 없이 읽는 개인 정보 안내(`15-2`)입니다. 화면 모드는 세 칸 가운데 하나를 고르는 모양입니다.
- 로그인. 계정을 지운 뒤에 돌아온 화면(`01-3`)을 더했고, 로그인 화면들의 아래 글에 개인 정보 안내를 가리키는 문장을 더했습니다. 왼쪽 아래의 글은 지금의 범위에 맞게 고쳤습니다.
- AI Log 와 Project. AI Log 쓰기 화면들(`06-1`, `06-5`, `06-6`, `08-3`, `09-3`)에 Project 를 고르는 칸을 더했습니다. AILogCard 에 `Show project` 와 `Project` 속성을 더했고 기본값은 꺼짐이라 다른 화면의 카드는 그대로입니다. AI Log 상세(`06-2`)에는 묶인 Project 이름을 Session 앞에 둡니다.

## 기본 상태

모든 주요 화면은 다음 상태를 구분해야 합니다.

- 처음 사용하는 빈 상태
- 데이터를 불러오는 상태
- 정상적으로 내용을 보여 주는 상태
- 권한이 없는 상태
- 오류가 발생한 상태

구현에서는 아래처럼 나눕니다.

| 상태 | 구현 |
|---|---|
| 불러오는 중 | `loading.tsx` 가 `ContentSkeleton` 을 보여 준다. Club 안쪽에서는 메뉴가 그대로 남고 내용 자리만 바뀐다. |
| 빈 상태, 불러오지 못함 | 각 화면이 `Empty` 로 안내하고 다음에 할 일을 버튼으로 준다. |
| 권한 없음 | 소속이 아니면 `ClubUnavailable`, 역할이 모자라면 그 화면 안의 안내. |
| 예상하지 못한 오류 | `error.tsx` 가 `ErrorState` 를 보여 준다. 다시 시도 버튼과 서버 기록을 찾는 번호가 있다. |
| 없는 주소 | `not-found.tsx` |
