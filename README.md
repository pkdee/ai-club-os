# AI Club OS

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, 기록, 공유, 프로젝트, 발표, 회고를 한 공간에서 이어 가도록 돕는 작업 공간입니다.

제품 메시지는 **Record. Understand. Build.** 입니다.

핵심 흐름은 다음과 같습니다.

**Activity -> Knowledge -> Intelligence -> Action**

## 현재 단계

v0.1 구현 중입니다. Next.js 뼈대, 디자인 토큰, Google Login 이 들어 있습니다. Club, Member, Session, Attendance, AI Log 는 아직 없습니다.

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

http://localhost:3000 을 열면 로그인 화면으로 이동합니다. 검사는 `npm run lint` 와 `npm run build` 로 합니다.

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

