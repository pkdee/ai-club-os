# Technology

## 기본 기술 구성

| 영역 | 선택 | 현재 상태 |
|---|---|---|
| 웹 | Next.js App Router | 도입 예정 |
| 언어 | TypeScript | 도입 예정 |
| 스타일 | Tailwind CSS | 도입 예정 |
| 사용자 인터페이스 | shadcn/ui | 도입 예정 |
| 데이터베이스 | Supabase PostgreSQL | 도입 예정 |
| 인증 | Supabase Auth와 Google Login | 도입 예정 |
| 파일 저장 | Supabase Storage | 필요 시 도입 |
| 배포 | Vercel | 도입 예정 |
| 패키지 관리 | npm | 도입 예정 |

## 서버 방향

MVP에서는 별도 Spring Boot 서버를 두지 않습니다. Next.js와 Supabase를 중심으로 구성하고, 별도 서버가 필요한 근거가 생길 때 설계 결정을 다시 검토합니다.

## AI Provider 방향

초기 공급자를 제품 핵심 영역에 직접 결합하지 않습니다. AI Insight 단계에서 공급자별 구현과 제품 기능 사이에 교체 가능한 경계를 둡니다.

## 아직 정하지 않은 항목

- 정확한 패키지 버전
- 테스트 도구와 테스트 범위
- 상태 관리 방식
- 관측성과 오류 수집 도구
- AI Provider와 모델

이 항목은 해당 기능을 구현하는 마일스톤에서 필요 근거와 함께 정합니다.

