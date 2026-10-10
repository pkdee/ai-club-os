# AI Club OS

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, 기록, 공유, 프로젝트, 발표, 회고를 한 공간에서 이어 가도록 돕는 작업 공간입니다.

제품 메시지는 **Record. Understand. Build.** 입니다.

핵심 흐름은 다음과 같습니다.

**Activity -> Knowledge -> Intelligence -> Action**

## 현재 단계

v0.1 구현 중입니다. Next.js 뼈대, 디자인 토큰, Google Login, Club 만들기, 내 Club 목록, Club 개요, Session 목록과 만들기, 수정, 상세, Session 별 Attendance 기록, AI Log 쓰기와 목록, 상세, 수정, Member 목록과 초대 링크, 역할 바꾸기와 내보내기, Club 설정이 들어 있습니다. AI Log 는 찾는 글자와 Session, 도구로 걸러 볼 수 있고, 쓰다 만 내용은 브라우저에 임시로 저장됩니다. Club 개요와 Session 개요, AI Log 목록에는 출석과 기록의 요약이 보입니다. AI Log, Session, Club 은 확인을 거쳐 지울 수 있습니다. v0.1 에 넣기로 한 기능은 모두 들어갔습니다.

## 실행

Node.js 24 와 npm 이 필요합니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` 에는 Supabase 프로젝트의 URL 과 publishable key 를 채웁니다. Supabase 쪽에는 아래 두 가지가 설정되어 있어야 합니다.

- Authentication 의 Providers 에서 Google 을 켜고 Google OAuth 클라이언트 ID 와 비밀 값을 입력한다.
- Authentication 의 URL Configuration 에서 Site URL 이 `http://localhost:3000` 이거나 Redirect URLs 에 `http://localhost:3000/**` 가 들어 있다.

데이터베이스 구조는 `supabase/migrations/` 의 SQL 파일에 있습니다. 새 Supabase 프로젝트에는 이 파일들을 이름 순서대로 적용해야 합니다. 대시보드의 SQL Editor 에 붙여 넣어 실행하거나 Supabase CLI 의 `supabase db push` 를 씁니다.

http://localhost:3000 을 열면 로그인 화면으로 이동합니다.

## 검증

```bash
npm run lint
npm run build
npm test
```

`npm test` 는 입력 규칙 시험과 접근 규칙 시험을 차례로 돌립니다. 접근 규칙 시험은 Docker 에 빈 Postgres 를 띄워 `supabase/migrations/` 를 적용한 뒤 시험하므로 Docker 가 켜져 있어야 합니다. 실제 Supabase 프로젝트에는 아무것도 보내지 않습니다. 하나만 돌리려면 `npm run test:unit` 이나 `npm run test:db` 를 씁니다.

화면에서의 흐름은 자동으로 확인하지 않습니다. 범위와 이유는 `docs/adr/0010-automated-checks-without-new-packages.md` 에 있습니다.

## 범위

- v0.1: Google Login, Club, Member, Session, Attendance, AI Log
- v0.2: AI Insight
- v0.3: Project
- v0.4: Web Presentation

AI Log는 제품의 핵심 Entity이며, 이후 AI Insight와 Project로 이어지는 지식의 시작점입니다.

## 문서

- [제품 요구 사항](docs/PRD.md)
- [요구 사항 목록](docs/REQUIREMENTS.md)
- [기능 단계](docs/FEATURES.md)
- [기술 선택](TECH.md)
- [구조 설계](ARCHITECTURE.md)
- [제품 디자인 원칙](DESIGN.md)
- [데이터 설계](docs/DATABASE.md)
- [설계 결정 기록](docs/adr/README.md)

