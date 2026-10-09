# Design

## 제품 메시지

**Record. Understand. Build.**

사용자가 활동을 쉽게 남기고, 기록에서 의미를 찾고, 다음 행동이나 결과물로 이어 갈 수 있어야 합니다.

## 경험 원칙

### 기록이 먼저다

AI 기능보다 빠르고 부담 없는 기록 경험을 먼저 만듭니다. 사용자가 남긴 원본 기록은 언제나 확인할 수 있어야 합니다.

### 흐름을 끊지 않는다

Club, Session, Attendance, AI Log가 서로 다른 관리 화면의 모음처럼 느껴지지 않게 합니다. 사용자는 한 회차의 맥락 안에서 참여하고 기록합니다.

### AI는 이해를 돕는다

AI는 사용자의 기록을 대신 소유하지 않습니다. 요약, 연결, 제안은 원본 기록으로 돌아갈 수 있어야 하며 사용자가 수정하거나 거절할 수 있어야 합니다.

### 결과보다 과정도 보인다

완성된 프로젝트뿐 아니라 어떤 실험과 기록을 거쳐 결과에 도달했는지 보여 줍니다.

## MVP 정보 구조

- 로그인
- 내 Club
- Club 개요
- Session
  - Session 상세: 개요, Attendance, AI Log
- AI Log
- Member
- Club 설정

Attendance 는 따로 메뉴를 두지 않고 Session 상세의 탭으로 둡니다. 한 회차의 맥락 안에서 참여하고 기록한다는 원칙을 따른 것입니다.

## 화면 설계

v0.1 화면 설계는 Figma 파일에서 관리합니다. 제품 이름은 화면에서도 AI Club OS 로 씁니다.

- 파일: https://www.figma.com/design/pSj712D4ia1bJZ1FytvzQ8/AI-DO
- 기준일: 2026-10-08

| 페이지 | 내용 |
|---|---|
| Foundations | 색, 글자, 간격, 모서리, 그림자 토큰과 견본 |
| Components | Icon, Action, Form, Display, Navigation, Domain 여섯 묶음의 컴포넌트 |
| Screens | 안내, Auth, Club, Member, Session, AI Log, 기본 상태, 작은 화면, Dark 모드 예시 |

화면은 모두 컴포넌트 인스턴스로 조립합니다. 화면에 쓴 역할, Attendance 상태, AI Log 항목은 `docs/REQUIREMENTS.md` 의 잠정 결정을 따릅니다.

### 디자인 토큰

- 색은 원시 색과 의미 색 두 층으로 나눕니다. 원시 색은 Tailwind 팔레트의 zinc, indigo, emerald, amber, red, sky 이고, 화면과 컴포넌트는 의미 색만 씁니다.
- 의미 색은 Light 와 Dark 두 모드를 가집니다. 변수의 코드 이름은 가능한 곳에서 shadcn/ui 의 CSS 변수 이름에 맞췄습니다.
- 대표 색은 indigo 입니다.
- 글꼴은 Noto Sans KR 입니다. 본문은 14px, 줄 높이 22px 입니다.
- 간격은 4px 단위이고, 모서리는 6, 8, 10, 14, 20px 단계입니다.

### 코드 연결

- 토큰은 `src/app/globals.css` 에 있습니다. 의미 색의 CSS 변수 이름은 Figma 변수의 코드 이름과 같고, 글자 단계는 `text-h1`, `text-body-m` 같은 Tailwind 클래스로 씁니다.
- 컴포넌트 이름은 shadcn/ui 관례를 따릅니다. Button 의 variant 는 `default` 가 Primary, `outline` 이 Secondary, `ghost` 가 Ghost, `destructive` 가 Danger 입니다. size 는 `default` 가 MD, `sm` 이 SM 입니다.
- 결정 배경은 `docs/adr/0001-design-tokens-as-css-variables.md` 에 있습니다.

### 화면 규칙

- 한 화면에 Primary 버튼은 하나만 둡니다.
- 상태는 색, 아이콘, 글자를 함께 써서 나타냅니다. Attendance 상태와 알림이 이 규칙을 따릅니다.
- 기본 상태는 AI Log 화면을 기준으로 그렸습니다. 권한이 없는 상태는 역할이 모자란 경우와 Club 소속이 아닌 경우를 나눕니다.
- 작은 화면은 390px 폭 기준이며 Club 개요, Attendance 기록, AI Log 쓰기를 그렸습니다.

## 기본 상태

모든 주요 화면은 다음 상태를 구분해야 합니다.

- 처음 사용하는 빈 상태
- 데이터를 불러오는 상태
- 정상적으로 내용을 보여 주는 상태
- 권한이 없는 상태
- 오류가 발생한 상태

## 접근성 원칙

- 키보드만으로 핵심 흐름을 수행할 수 있게 합니다.
- 색상만으로 상태를 전달하지 않습니다.
- 입력 항목의 이름과 오류 설명을 명확히 제공합니다.
- 작은 화면에서도 기록 작성 흐름을 유지합니다.

