# AGENTS.md

이 파일은 AI Club OS 저장소에서 일하는 에이전트가 따라야 할 단일 관리 지침입니다.

## 프로젝트 목적

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, AI Log, 공유, 프로젝트, 발표, 회고를 하나의 흐름으로 수행하도록 돕는 작업 공간입니다.

핵심 제품 메시지는 `Record. Understand. Build.`이며, 제품 흐름은 `Activity -> Knowledge -> Intelligence -> Action`입니다.

## 현재 작업 단계

- 현재는 저장소와 문서 기반만 준비한다.
- 사용자가 다음 구현 단계를 승인하기 전까지 애플리케이션 코드를 작성하지 않는다.
- 패키지 설치, 외부 서비스 연결, 데이터베이스 변경, 배포 설정을 임의로 진행하지 않는다.
- 기존 파일을 삭제하거나 덮어쓰기 전에 반드시 상태와 사용자 변경 사항을 확인한다.

## 제품 범위

- v0.1: Google Login, Club, Member, Session, Attendance, AI Log
- v0.2: AI Insight
- v0.3: Project
- v0.4: Web Presentation
- AI Log를 핵심 Entity로 취급한다.

## 기본 기술 방향

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL, Auth, Storage
- Vercel
- MVP에서는 별도 Spring Boot 서버를 두지 않는다.
- AI Provider는 교체 가능한 경계 뒤에 둔다.

## 구조 원칙

- 기능 단위 경계를 우선한다.
- `auth`, `club`, `member`, `session`, `attendance`, `ai-log`를 서로 구분한다.
- 화면, 데이터 접근, 외부 서비스 연결이 한 파일에 섞이지 않게 한다.
- 아직 필요하지 않은 기능과 추상화는 미리 구현하지 않는다.
- 중요한 기술 선택은 `docs/adr/`에 기록한다.

## 문서 관리

- 제품 목표와 범위는 `docs/PRD.md`에서 관리한다.
- 검증 가능한 요구 사항은 `docs/REQUIREMENTS.md`에서 관리한다.
- 기능 단계는 `docs/FEATURES.md`에서 관리한다.
- 기술 선택은 `TECH.md`에서 관리한다.
- 전체 구조는 `Architecture.md`에서 관리한다.
- 화면과 경험 원칙은 `DESIGN.md`에서 관리한다.
- 데이터 구조는 `docs/DATABASE.md`에서 관리한다.
- `CLAUDE.md`에는 별도 지침을 추가하지 않고 이 파일만 불러오게 유지한다.

## 작업 규칙

- 변경 전 현재 깃 상태를 확인한다.
- 작은 단위로 변경하고 변경 이유를 문서에 남긴다.
- 검증하지 않은 상태를 완료로 표현하지 않는다.
- 비밀 값과 개인 정보는 저장소에 넣지 않는다.
- 사용자 승인 없이 원격 저장소 생성, 푸시, 배포를 하지 않는다.

