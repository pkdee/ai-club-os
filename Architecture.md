# Architecture

## 목표

AI Club OS는 활동 기록이 지식이 되고, 지식이 이해와 행동으로 이어지는 흐름을 지원합니다.

```text
Activity -> Knowledge -> Intelligence -> Action
```

## 핵심 영역

- Club: 활동이 이루어지는 작업 공간
- Member: Club에 참여하는 구성원과 역할
- Session: 학습과 실험이 일어나는 회차
- Attendance: Session 참여 기록
- AI Log: 구성원이 남긴 인공지능 활용 기록
- AI Insight: AI Log를 바탕으로 만든 이해와 제안
- Project: 여러 활동과 기록이 모이는 결과물
- Web Presentation: 결과를 외부에 보여 주는 발표 화면

AI Log는 나머지 확장 기능이 지식을 얻는 핵심 Entity입니다.

## MVP 경계

v0.1은 인증과 Club 운영의 기본 흐름만 포함합니다.

```text
Google Login
  -> Club
  -> Member
  -> Session
  -> Attendance
  -> AI Log
```

AI Insight, Project, Web Presentation은 MVP 밖에 둡니다.

## 목표 디렉터리 구조

실제 코드를 작성할 때 다음 기능 경계를 기준으로 확장합니다.

```text
src/
├── app/
└── features/
    ├── auth/
    ├── club/
    ├── member/
    ├── session/
    ├── attendance/
    └── ai-log/
```

각 기능은 자신의 화면, 규칙, 데이터 접근 경계를 소유합니다. 여러 기능이 함께 쓰는 요소는 실제 중복이 확인된 뒤에만 공용 영역으로 이동합니다.

## 데이터 흐름 원칙

1. 사용자가 Club과 Session 안에서 활동합니다.
2. Attendance와 AI Log가 활동을 기록합니다.
3. 이후 버전의 AI Insight가 기록을 이해 가능한 정보로 바꿉니다.
4. Project와 Web Presentation이 기록과 이해를 결과물과 공유 행동으로 연결합니다.

## 외부 경계

- 인증과 기본 데이터는 Supabase를 사용합니다.
- 파일이 필요한 기능만 Supabase Storage를 사용합니다.
- AI Provider는 교체 가능한 연결부 뒤에 둡니다.
- 배포는 Vercel을 기본으로 합니다.

## 오류와 권한 원칙

- 모든 Club 데이터는 소속과 역할을 기준으로 접근을 제한합니다.
- 인증되지 않은 요청과 권한이 없는 요청을 구분합니다.
- 외부 서비스 오류가 사용자의 원본 기록을 손상시키지 않게 합니다.
- AI 기능 실패와 기본 기록 기능 실패를 분리합니다.

## 검증 방향

- 도메인 규칙은 작은 단위 테스트로 검증합니다.
- 인증과 권한 경계는 통합 테스트로 검증합니다.
- 가입부터 AI Log 작성까지의 핵심 흐름은 사용자 흐름 테스트로 검증합니다.
- 구체적인 도구는 첫 구현 마일스톤에서 확정합니다.

