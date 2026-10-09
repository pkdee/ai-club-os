# Database

## 목적

이 문서는 AI Club OS의 데이터 경계와 관계를 관리합니다. 실제 표와 마이그레이션은 MVP 구현 설계가 승인된 뒤 작성합니다.

## 핵심 Entity

- Club
- Member
- Session
- Attendance
- AI Log
- Project
- AI Insight
- Web Presentation

## MVP 관계 초안

```text
User
  -> Member
  -> Club
       -> Session
            -> Attendance
            -> AI Log
```

## 데이터 원칙

- 모든 Club 소속 데이터는 Club 식별자를 통해 경계를 확인할 수 있어야 한다.
- Member는 사용자와 Club 사이의 소속과 역할을 나타낸다.
- Attendance는 Member와 Session의 관계를 기록한다.
- AI Log는 작성자와 Club에 속하며 필요할 때 Session과 연결한다.
- 사용자가 작성한 원본 AI Log와 이후 생성된 AI Insight를 구분한다.
- 삭제와 보존 정책은 구현 전에 별도로 결정한다.

## 이후 결정 사항

역할, Attendance 상태 값, AI Log 입력 구조는 `docs/REQUIREMENTS.md` 의 잠정 결정을 출발점으로 삼습니다.

- 식별자 형식
- 역할과 권한 모델
- Attendance 상태 값
- AI Log 입력 구조
- 시간대와 날짜 저장 규칙
- 수정 기록과 보존 기간
- 파일 첨부 범위
- 행 단위 보안 정책

