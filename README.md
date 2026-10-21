# AI Club OS

인공지능 동아리와 스터디가 학습, 실험, 기록, 공유, 프로젝트, 발표, 회고를 한 곳에서 이어 가는 작업 공간입니다.

**Record. Understand. Build.** · Activity -> Knowledge -> Intelligence -> Action

## 기능

| 단계 | 내용 |
|---|---|
| v0.1 | Google 로그인, Club 과 Member(초대 링크, 역할), Session 과 Attendance, AI Log(찾기, 임시 저장, 이미지, 댓글, 수정 기록) |
| v0.2 | AI Insight: 운영자가 한 회차나 한 달의 AI Log 를 AI 로 정리하고 확인한 뒤 공개 |
| v0.3 | Project: 참여자, 할 일, 결과물 링크, AI Log 묶기, Session 잇기 |
| v0.4 | Web Presentation: 링크를 아는 사람만 보는 Project 와 Club 의 발표, 발표 모드 |

그 밖에 회고, 앱 안 알림, Docs, Club 목록과 로고, 화면 모드, 계정 지우기, 개인 정보 안내가 있습니다. AI Log 는 제품의 핵심 Entity 입니다.

## 실행

Node.js 24 와 npm 이 필요합니다.

```bash
npm install
cp .env.example .env.local   # Supabase URL 과 publishable key 를 채운다
npm run dev                  # http://localhost:3000
```


## 검증

```bash
npm run lint
npm run design:lint
npm run build
npm test   # 단위 시험과 접근 규칙 시험. 접근 규칙 시험에는 Docker 가 필요하다
```
