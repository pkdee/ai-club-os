# AGENTS.md

이 파일은 AI Club OS 저장소에서 일하는 에이전트가 따라야 할 단일 관리 지침입니다.

## 프로젝트 목적

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, AI Log, 공유, 프로젝트, 발표, 회고를 하나의 흐름으로 수행하도록 돕는 작업 공간입니다.

핵심 제품 메시지는 `Record. Understand. Build.`이며, 제품 흐름은 `Activity -> Knowledge -> Intelligence -> Action`입니다.

## 현재 작업 단계

- 2026-10-08 에 사용자가 v0.1 구현 첫 단계를 승인했다. 범위는 Next.js 뼈대, 디자인 토큰 이식, 로그인 화면이다.
- 2026-10-10 에 사용자가 Supabase 프로젝트와 Google OAuth 설정을 마쳤고, 이어서 Supabase 연결과 Google Login 을 구현했다.
- 2026-10-10 에 사용자가 다음 단계를 승인해 Club 만들기와 내 Club 목록을 구현했다.
- 2026-10-10 에 데이터베이스 적용을 확인한 뒤 Club 개요와 Club 안쪽 화면 틀을 구현했다.
- 2026-10-10 에 사용자가 Session 단계를 승인하고 시각을 한국 시간으로 고정하기로 정했다. Session 목록, 만들기, 수정, 상세를 구현했다.
- 2026-10-10 에 사용자가 Attendance 단계를 승인했다. `attendance` 테이블과 Member 이름 열, Session 상세의 Attendance 탭을 구현했다.
- 2026-10-10 에 사용자가 Attendance 적용을 확인하고 다음 단계를 승인했다. `ai_logs` 테이블과 AI Log 쓰기, 목록, 상세, 수정, Session 상세의 AI Log 탭을 구현했다.
- 2026-10-10 에 사용자가 초대 방식을 초대 링크로, 만료를 7일로 정했다. `club_invites` 테이블과 Member 목록, 초대 창, 초대 링크로 참여하는 화면을 구현했다.
- 2026-10-10 에 사용자가 프로필 사진을 Google 계정에서 가져오기로 정했다. `members` 에 사진 주소 열을 더하고 Avatar 가 사진을 보여 주게 했다.
- 2026-10-10 에 사용자가 운영자의 권한과 마지막 운영자 규칙, 나간 사람의 기록 처리를 정했다. Member 역할 바꾸기, 내보내기와 나가기, Club 설정을 구현했다.
- 2026-10-10 에 사용자가 자동 검증, 빠진 기본 상태, AI Log 검색을 다음 일로 골랐다. 자동 검증은 새 패키지 없이 하기로 정했다. 세 가지를 모두 구현했다.
- 2026-10-10 에 사용자가 검색과 도구 이름의 한계를 해결하자고 했다. 띄어쓰기와 대소문자를 넘어 찾게 하고, 널리 쓰는 AI 도구 목록을 두어 도구 이름을 그 표기에 맞추게 했다.
- 2026-10-10 에 사용자가 도구 이름에 아이콘을 넣자고 했고 실제 로고를 패키지로 설치해 쓰기로 정했다. `@lobehub/icons-static-svg` 를 더하고 도구 이름표와 고르는 목록에 로고를 넣었다.
- 2026-10-10 에 사용자가 그려 둔 요약 채우기, AI Log 임시 저장, 삭제 기능을 다음 일로 골랐다. 삭제는 AI Log 를 작성자와 운영자가, Session 과 Club 을 운영자가 지우고 되살리지 않기로 정했다. 세 가지를 모두 구현했다.
- 2026-10-10 에 사용자가 v0.2 AI Insight 를 시작하기로 했다. AI Provider 는 Claude, 단위는 Session 과 한 달 둘 다, 만드는 사람은 운영자, 운영자가 확인한 뒤 공개하기로 정했다. `ai_insights` 테이블과 AI Provider 경계, AI Insight 화면을 구현했다.
- 2026-10-10 에 사용자가 AI Insight 를 다듬는 일로 개요에 최근 Insight 보이기, 다음 행동 이어 가기, 내용 복사하기, 고칠 때 항목 더하기를 골랐다. 네 가지를 모두 구현했다.
- 2026-10-10 에 사용자가 v0.3 Project 를 시작하기로 했다. 누구나 만들고 참여자가 고치며, AI Log 묶기와 참여자, 결과물 링크, 할 일 목록을 넣고, AI Log 는 Project 하나에만 묶기로 정했다. `projects` 와 딸린 테이블, Project 목록과 상세, AI Log 의 Project 고르기를 2026-10-11 에 구현했다.
- 2026-10-11 에 사용자가 v0.4 Web Presentation 시작, Project 다듬기, 남은 운영 규칙 정하기를 함께 골랐다. 발표는 Project 와 Club 둘 다, 링크를 아는 사람만, 작성자가 허락한 AI Log 만, 이름은 발표마다 고르기로 정했다. 재참여는 내보낼 때 막을지 고르기로 정했다. 세 가지를 모두 구현했다.
- 2026-10-11 에 사용자가 발표 다듬기, Member 이름과 알림, 미뤄 둔 것 정리를 함께 골랐다. 알림은 앱 안에서만, 이름은 본인만 고치고, 수정 기록은 작성자와 운영자가 보기로 정했다. 발표의 소개 글과 발표 모드, 알림, 이름 고치기, AI Log 수정 기록, 도구 표기 합치기, Session 시간표, Member 목록 더 보기를 구현했다. 발표를 공개한 때의 모습으로 고정할지와 Club 발표에 AI Insight 를 넣을지는 사용자가 이 일을 마친 뒤에 이야기하기로 미뤘다.
- 2026-10-11 에 사용자가 미뤄 둔 두 가지를 정했다. 발표는 고정하지 않고 열 때마다 지금의 내용을 보여 준다. Club 발표에 AI Insight 를 넣지 않는다.
- 2026-10-11 에 사용자가 회고와 남은 운영 규칙을 다음 일로 골랐다. 회고는 Project, Session, 한 달을 사람마다 하나씩 세 칸으로 쓰고 Member 가 모두 보기로 정했다. 지운 기록은 1년, 수정 기록은 90일, 운영자가 없어지면 먼저 참여한 구성원이 이어받고, 참여자 없는 Project 는 운영자가 맡고, 스스로 나간 사람은 막지 않기로 정했다. 모두 구현했다. 화면 흐름의 자동 검증은 아직 하지 않기로 했다.
- 2026-10-11 에 사용자가 댓글과 반응, 계정과 개인 정보, 미뤄 둔 것 다듬기를 함께 골랐다. 댓글과 도움 표시는 AI Log 에만, 계정을 지울 때 쓴 것을 남길지는 그때 고르고, Member 가 없는 Club 은 함께 지우고, 파일은 이미지만 받고, 회고는 작성자가 켠 것만 AI Insight 와 발표에 쓰고, Session 과 Project 는 운영자와 참여자가 잇기로 정했다. 2026-10-12 에 댓글과 표시, Session 과 Project 잇기, 회고의 쓰임, AI Log 이미지, 내 계정과 계정 지우기, 개인 정보 안내, 화면 모드를 구현했다. Supabase Storage 를 처음 썼다.
- 2026-10-20 에 사용자가 Vercel 배포를 준비하면서 AI Insight 에 Gemini 3.8 Flash 무료 등급을 쓰기로 정했다. 무료 등급에서 Google 이 받은 글을 개선에 쓴다는 조건을 듣고 정했다. Gemini 구현과 안내 글을 더했다.
- 2026-10-21 에 사용자가 Google 의 DESIGN.md 형식을 들이기로 했다. `@google/design.md` 를 개발 도구로 더하고 `DESIGN.md` 를 그 형식에 맞췄다. 같은 날 프로젝트 분석에서 나온 로그인 뒤 돌아갈 경로의 우회, Claude 호출의 제한 시간, 알림 수를 세는 조회의 순서를 고쳤다. AI Insight 는 Gemini 무료 모델을 쓰므로 Provider 가 없을 때의 안내도 Gemini 에 맞췄다.
- 2026-10-21 에 사용자가 프로필 메뉴와 화면 모드의 자리, 계정 관련 버튼의 색을 고치자고 했다. 모든 화면의 상단 막대 오른쪽에 화면 모드 버튼과 내 프로필 메뉴(계정 설정, 로그아웃)를 두고, 내 계정 화면의 화면 모드를 뺐다. 계정 지우기와 로그아웃은 붉은 계열로 바꿨다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 앱 사용 안내인 Docs 를 MDX 로 쓰고 빌드할 때 올리기로 했다. 문서는 모든 Club 에 같고, 코드 블록은 macOS 창 모양에 복사 버튼을 둔다. `@next/mdx` 와 remark, rehype 플러그인, Shiki 를 더하고 Docs 화면과 첫 문서를 구현했다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 AI Log, Session, Club 을 지우는 확인 창을 여는 버튼도 붉은 테두리로 맞추기로 했다. 공용 삭제 창을 쓰는 버튼이 모두 함께 바뀐다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 Docs 에 문서를 Markdown 으로 복사하는 버튼을 더하기로 했다. 빌드할 때 MDX 원문에서 Markdown 을 만들고, Callout 은 GitHub 의 알림 인용으로, 앱 안의 링크는 복사할 때 전체 주소로 바꾼다. 새 패키지는 더하지 않았다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 로그인한 사용자 모두가 처음 화면에서 등록된 Club 을 보고, Member 가 아닌 Club 을 누르면 권한이 없다는 안내가 나오게 하자고 했다. 같은 날 Club 에 로고 사진을 등록하게 하자고 했다. Club 안의 접근 규칙은 그대로 두고 `list_clubs` 함수로 이름, 소개, 로고, Member 수만 보여 준다. 로고는 Storage 의 `club-logos` 에 두고 운영자만 올린다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 Docs 를 Sidebar 를 뺀 영역의 가운데에 두고 예시의 기술 블로그처럼 제목, 작성일, 태그를 보이게 하자고 했다. `list.ts` 에 게시한 날, 고친 날, 태그를 더하고, 본문의 첫 `#` 제목을 머리말로 옮기고, 읽는 시간을 보인다. 같은 날 Session 에 Docs 의 문서를 참고 자료로 가져오게 하자고 해서 `session_docs` 테이블을 더했다. 운영자가 잇고 빼며 Member 가 모두 본다. 고르는 칸은 `src/components/link-controls.tsx` 로 옮겨 함께 쓴다. Base UI 의 Input 이 처음 값이 바뀌었다고 경고하던 폼들은 `key` 로 칸을 새로 그리게 했다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 Docs 시작하기, Prompt Engineering, Context Engineering 세 문서를 MDX 에 맞게 다듬자고 했다. 같은 날 Docs 로 옮기거나 새로고침할 때 문서 목록만 먼저 뜨는 것을 고치고, 스켈레톤을 다시 점검하고, 반응형을 적용하자고 했다. Docs 메뉴가 첫 문서로 바로 가게 하고, `loading.tsx` 가 주소로 화면을 골라 그 화면을 닮은 자리 표시를 그리게 했다. Sidebar 를 화면 높이에 붙이고 Club 안쪽 본문의 폭을 1360px 로 막는 등 반응형의 빈틈을 고쳤다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 Docs 의 접는 칸을 자주 하는 질문 같은 아코디언으로 바꾸고, 문서마다 접는 것을 한결같게 맞추고, 다음 회차 내용을 지우고, 글의 품질을 검증해 고치고, README 를 간략하게 쓰자고 했다. 다음 회차는 바뀔 수 있어 설명하지 않기로 했다. Docs 쓰는 법은 `src/content/docs/README.md` 로 옮겼다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 Docs 의 접는 칸이 이상해 보인다고 하고, 문서 맨 앞에 `---` 로 감싼 title 과 description 을 두었더니 화면이 깨진다며 MDX 에 맞게 화면을 꾸려 달라고 했다. 접는 칸은 상자를 없애고 위아래 선만 둔 목록으로 바꿨다. 문서의 제목, 소개, 날짜, 태그는 frontmatter 에 두고 `list.ts` 에는 순서만 남겼다. 새 패키지 없이 `remark-front-matter.mjs` 가 읽는다. Figma 에는 아직 반영하지 않았다.
- 2026-10-21 에 사용자가 Docs 의 내용이 사실인지 확인하고, 맞지 않는 링크는 다른 것으로 바꾸자고 했다. 없는 문서로 가던 링크를 이 문서의 절이나 공식 문서로 바꾸고, 앱과 다른 설명을 고치고, 링크가 있는 화면과 문서, 제목을 가리키는지 보는 `links.test.ts` 를 더했다.
- 승인된 범위를 넘는 구현은 사용자가 다음 단계를 승인한 뒤에 진행한다.
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
- AI Provider는 교체 가능한 경계 뒤에 둔다. 경계는 `src/features/ai-insight/provider/` 이고 Gemini 와 Claude 구현이 있다. 2026-10-20 부터 Gemini 3.8 Flash 무료 등급을 쓴다. 키는 서버의 환경 변수로만 받는다.
- Next.js 16 은 이전 버전과 달라진 점이 많다. Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/` 의 해당 문서를 확인한다.

## 구조 원칙

- 기능 단위 경계를 우선한다.
- `auth`, `club`, `member`, `session`, `attendance`, `ai-log`, `ai-insight`, `project`, `presentation`, `notification`, `retrospective`, `account`, `docs`를 서로 구분한다.
- Docs 의 문서는 `src/content/docs/` 에 `<slug>.mdx` 로 쓰고 같은 폴더의 `list.ts` 에 순서를 적는다. 제목, 소개, 날짜, 태그는 문서 맨 앞의 frontmatter 에 적는다. 문서는 저장소에 그대로 들어가므로 비밀 값과 개인 정보를 적지 않는다. 쓰는 법과 무엇을 접을지는 같은 폴더의 `README.md` 를 따른다. 다음 회차를 미리 설명하지 않는다.
- Storage 를 부르는 서버 코드는 기능마다 한 파일에만 둔다. AI Log 의 이미지는 `src/features/ai-log/image-store.ts`, Club 로고는 `src/features/club/logo-store.ts` 다.
- 화면, 데이터 접근, 외부 서비스 연결이 한 파일에 섞이지 않게 한다.
- 아직 필요하지 않은 기능과 추상화는 미리 구현하지 않는다.
- 중요한 기술 선택은 `docs/adr/`에 기록한다.

## 문서 관리

- 제품 목표와 범위는 `docs/PRD.md`에서 관리한다.
- 검증 가능한 요구 사항은 `docs/REQUIREMENTS.md`에서 관리한다.
- 기능 단계는 `docs/FEATURES.md`에서 관리한다.
- 기술 선택은 `TECH.md`에서 관리한다.
- 전체 구조는 `ARCHITECTURE.md`에서 관리한다.
- 화면과 경험 원칙, 디자인 토큰은 `DESIGN.md`에서 관리한다. Google 의 DESIGN.md 형식을 따른다.
- 데이터 구조는 `docs/DATABASE.md`에서 관리한다.
- `CLAUDE.md`에는 별도 지침을 추가하지 않고 이 파일만 불러오게 유지한다.

## 작업 규칙

- 변경 전 현재 깃 상태를 확인한다.
- 작은 단위로 변경하고 변경 이유를 문서에 남긴다.
- 검증하지 않은 상태를 완료로 표현하지 않는다.
- 비밀 값과 개인 정보는 저장소에 넣지 않는다.
- 데이터베이스 변경은 `supabase/migrations/` 의 SQL 파일로 남긴다. 파일은 `npx supabase migration new <이름>` 으로 만든다.
- 사용자는 마이그레이션을 SQL Editor 에 손으로 붙여 적용하고, 그때 앱이 켜져 있다. 그래서 기존 테이블을 잠그는 일은 테이블마다 파일을 나누고, 다시 실행해도 결과가 같게 쓰고, 잠금을 오래 기다리지 않게 `set local lock_timeout` 을 둔다. 외래 키는 가리키는 테이블도 잠그므로, 두 테이블을 잠가야 하면 앱이 지울 때 잠그는 순서(members 다음에 그 아래 테이블)를 따른다.
- trigger 가 다른 테이블에 적는 경우도 두 테이블로 센다. `deletion_logs` 를 잠그는 파일에서 지운 기록을 남기는 테이블의 trigger 까지 만들면 앱의 삭제와 서로를 기다린다. 새 테이블의 trigger 는 그 테이블을 만드는 파일에서 건다.
- 로그인하지 않은 요청이 읽을 수 있는 것은 `get_presentation` 함수가 돌려주는 값뿐이다. 이 함수를 고치면 무엇이 나가는지를 `tests/db/98_presentations.test.sql` 에서 함께 확인한다.
- AI Log 에 붙은 이미지는 파일을 먼저 지우고 목록의 줄을 지운다. AI Log, Club, 계정을 지우는 코드를 고칠 때 이 순서를 지킨다. 파일이 남은 줄은 데이터베이스가 지우지 못하게 막으므로, 순서를 어기면 지우는 일이 실패한다. Club 로고도 같다. Club 을 지우거나 계정을 지우면서 Club 이 함께 지워질 때 그 Club 의 로고 파일을 먼저 지운다.
- AI Provider 를 더하거나 무료와 유료 등급을 바꾸면 그 Provider 의 `dataNotice` 를 함께 고친다. 개인 정보 안내와 쓰기 화면이 이 글을 보여 준다.
- 개인 정보 안내(`src/app/privacy/page.tsx`)는 앱이 실제로 하는 일을 적은 글이다. 모으는 것, 보내는 곳, 보는 사람, 보관 기간이 바뀌는 변경을 하면 이 글을 함께 고친다.
- 시험용 Docker 컨테이너는 `docker rm -fv` 로 볼륨까지 지운다. 볼륨을 남기면 Docker 의 디스크가 찬다.
- `src/app/globals.css` 의 디자인 토큰을 고치면 `DESIGN.md` 의 토큰과 표를 함께 고친다. 둘이 어긋나면 `npm test` 가 실패한다. 형식은 `npm run design:lint` 로 검사한다.
- 마이그레이션이나 규칙 파일을 고치면 `npm test` 를 돌린다. 접근 규칙을 더하거나 바꾸면 `tests/db/` 에, 입력 규칙을 더하거나 바꾸면 대상 파일 옆의 `*.test.ts` 에 시험을 함께 고친다.
- 사용자 승인 없이 원격 저장소 생성, 푸시, 배포를 하지 않는다.

## 커밋 규칙

- 작업 브랜치를 따로 만들지 않고 `main` 에 직접 커밋한다. 브랜치는 사용자가 요청할 때만 만든다.
- 커밋 메시지는 한국어로 쓰고 Conventional Commits 를 따른다. type 은 `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style` 등을 쓴다.
- 제목은 `<type>: <한글 요약>` 형식의 한 줄로 쓴다. 72자 이내의 명령형으로 쓰고 마침표를 붙이지 않는다.
- 제목 다음 한 줄을 비우고, 본문은 3~5줄의 목록으로 핵심만 적는다. 긴 설명과 구현 코드는 넣지 않는다.
- 고유명과 기술명(API, Controller, Repository 등)은 영문 그대로 둔다.
- 브레이킹 체인지가 있으면 마지막 줄에 `BREAKING CHANGE: <내용>` 을, 관련 이슈가 있으면 `Refs: <번호 또는 URL>` 을 붙인다.
- 변경이 너무 작거나 뜻이 불분명하면 그대로 커밋하지 말고 더 알맞은 커밋 단위를 제안한다.

```text
feat: 안테나 로그 API에 createdFrom, createdTo 필터 추가

- API 계층 및 Repository 쿼리에 날짜 필터 로직 추가
- Service/Controller에 createdFrom, createdTo 파라미터 반영
- OpenAPI 스펙에 신규 쿼리 파라미터 문서화
- JPA 쿼리 predicate로 날짜 조건 처리 보완
```

