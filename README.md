# AI Club OS

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, 기록, 공유, 프로젝트, 발표, 회고를 한 공간에서 이어 가도록 돕는 작업 공간입니다.

제품 메시지는 **Record. Understand. Build.** 입니다.

핵심 흐름은 다음과 같습니다.

**Activity -> Knowledge -> Intelligence -> Action**

## 현재 단계

v0.1 구현 중입니다. Next.js 뼈대, 디자인 토큰, Google Login, Club 만들기, 내 Club 목록, Club 개요, Session 목록과 만들기, 수정, 상세, Session 별 Attendance 기록, AI Log 쓰기와 목록, 상세, 수정, Member 목록과 초대 링크, 역할 바꾸기와 내보내기, Club 설정이 들어 있습니다. AI Log 는 찾는 글자와 Session, 도구로 걸러 볼 수 있고, 쓰다 만 내용은 브라우저에 임시로 저장됩니다. Club 개요와 Session 개요, AI Log 목록에는 출석과 기록의 요약이 보입니다. AI Log, Session, Club 은 확인을 거쳐 지울 수 있습니다. v0.1 에 넣기로 한 기능은 모두 들어갔습니다.

v0.2 의 AI Insight 는 첫 단계가 들어 있습니다. 운영자가 한 회차나 한 달의 AI Log 를 AI 로 정리해 초안을 만들고, 확인한 뒤 공개합니다.

v0.3 의 Project 도 첫 단계가 들어 있습니다. Member 가 Project 를 만들어 참여자, 할 일, 결과물 링크를 관리하고 자기 AI Log 를 묶습니다. 참여를 요청할 수 있고 할 일에는 담당자와 기한이 있습니다.

v0.4 의 Web Presentation 도 첫 단계가 들어 있습니다. Project 와 Club 의 활동을 링크를 아는 사람만 로그인 없이 보는 발표로 공개합니다. AI Log 는 작성자가 허락한 것만 들어갑니다. 발표에만 보이는 소개 글을 적을 수 있고, 한 장씩 넘겨 보는 발표 모드가 있습니다.

앱 안의 알림도 들어 있습니다. 들어온 참여 요청, 내가 맡은 할 일, 참여자가 된 Project, 새로 공개된 AI Insight 를 모아 보여 줍니다. Member 는 Club 안에서 쓰는 자기 이름을 고칠 수 있고, AI Log 를 고치면 수정 기록이 남습니다.

회고도 들어 있습니다. Project, Session, 한 달을 좋았던 것, 아쉬운 것, 다음에 해 볼 것의 세 칸으로 사람마다 하나씩 돌아봅니다. 작성자가 켜면 AI Insight 의 자료나 Project 의 발표에 쓰입니다.

AI Log 에는 댓글을 달고 도움이 됐다고 표시할 수 있습니다. 작성자는 이미지를 4장까지 붙입니다. Session 과 Project 는 직접 이을 수 있습니다.

화면 오른쪽 위에서 화면 모드를 고르고, 프로필을 누르면 계정 설정과 로그아웃이 나옵니다. 계정 설정 화면에서 계정을 지울 수 있습니다. 무엇을 모으고 누가 보는지는 로그인 없이 읽는 개인 정보 안내에 적혀 있습니다.

운영에 필요한 규칙도 들어 있습니다. 내보낸 사람의 재참여 막기, 지운 기록, AI Insight 의 하루 횟수 한도입니다.

앱을 쓰는 법은 Club 안의 Docs 에서 읽습니다. 모든 Club 에 같은 문서이고, 저장소의 MDX 파일로 써서 배포할 때 올라갑니다. 쓰는 법은 아래의 "Docs 쓰기" 에 있습니다.

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

AI Log 에 이미지를 붙이는 기능은 Supabase Storage 를 씁니다. 저장 공간과 접근 규칙은 마이그레이션이 만들므로 대시보드에서 따로 만들 것은 없습니다.

개인 정보 안내에 문의 주소를 보이려면 `CONTACT_EMAIL` 을 채웁니다. 이 화면은 빌드할 때 만들어지므로 값을 바꾸면 다시 빌드해야 반영됩니다.

AI Insight 를 만들려면 `.env.local` 에 AI 서비스의 키도 채웁니다. 비워 두면 AI Insight 만 만들 수 없고 나머지는 그대로 동작합니다.

- Google 의 Gemini 를 쓰려면 `GEMINI_API_KEY` 를 채웁니다. 기본 모델은 무료 등급이 있는 `gemini-3.8-flash` 입니다. 무료 등급에서는 Google 이 받은 글을 서비스 개선에 쓰고, 하루에 부를 수 있는 횟수가 20번 안팎입니다.
- Anthropic 의 Claude 를 쓰려면 `ANTHROPIC_API_KEY` 를 채웁니다.
- 두 키를 모두 넣었으면 `AI_INSIGHT_PROVIDER` 를 `gemini` 나 `anthropic` 으로 정합니다. 정하지 않으면 Claude 를 씁니다.
- 키 없이 화면만 확인하려면 `AI_INSIGHT_PROVIDER=mock` 으로 둡니다. 쓰는 모델은 `AI_INSIGHT_MODEL` 로 바꿉니다.
- 개인 정보 안내는 빌드할 때 설정한 AI 서비스를 읽어 적습니다. 서비스를 바꾸면 다시 빌드해야 반영됩니다.

데이터베이스 구조는 `supabase/migrations/` 의 SQL 파일에 있습니다. 새 Supabase 프로젝트에는 이 파일들을 이름 순서대로 적용해야 합니다. 대시보드의 SQL Editor 에 붙여 넣어 실행하거나 Supabase CLI 의 `supabase db push` 를 씁니다.

앱이 켜져 있는 데이터베이스에 붙여 넣을 때는 파일을 하나씩 실행합니다. 여러 파일을 그냥 이어 붙여 한 번에 실행하면 여러 테이블을 함께 잠그게 되어 앱의 요청과 서로를 기다리다 멈출 수 있습니다. 한 번에 붙여 넣고 싶으면 아래 명령이 만드는 글을 씁니다. 파일 사이에 `commit` 을 넣어 파일마다 따로 잠그고 풉니다.

```bash
npm run --silent db:bundle -- 20261010160037 | pbcopy
```

적는 값은 처음 적용할 파일 이름의 앞부분입니다. 그 파일부터 끝까지를 이어 붙입니다. 중간에 멈추면 앞의 파일들은 이미 적용된 것이므로, 다시 실행해도 되게 쓴 파일에만 씁니다. `20261010160037` 부터의 파일은 모두 그렇게 썼습니다. 이미 적용한 파일을 다시 붙여 넣지 않으려면 아직 적용하지 않은 첫 파일의 앞부분을 적습니다. 예를 들어 회고와 보관 기간의 네 파일만 적용하려면 `20261011073600` 을, 댓글과 이미지, 계정 지우기의 일곱 파일만 적용하려면 `20261011145437` 을 적습니다.

http://localhost:3000 을 열면 로그인 화면으로 이동합니다.

## Docs 쓰기

Club 안의 Docs 에 보이는 문서는 `src/content/docs/` 의 MDX 파일입니다. 앱 안에서는 고치지 않고, 저장소를 고쳐 배포하면 올라갑니다.

1. `src/content/docs/` 에 `<slug>.mdx` 를 만듭니다. slug 는 주소에 쓰이므로 영어 소문자, 숫자, 하이픈만 씁니다.
2. 같은 폴더의 `list.ts` 에 slug, 제목, 한 줄 소개를 한 줄로 더합니다. 이 목록의 순서가 왼쪽 문서 목록과 이전 문서, 다음 문서의 순서입니다. 목록에 없는 파일은 화면에 나오지 않습니다.
3. 본문은 `##` 부터 씁니다. 문서 제목은 목록의 제목이 보이고, `##` 과 `###` 이 오른쪽 목차가 됩니다.

본문에는 Markdown 의 글, 목록, 표, 인용과 아래 세 가지를 씁니다.

````mdx
```ts
const count = 1
```

<Callout tone="warning" title="조심할 것">
발표에 넣은 기록은 링크를 아는 누구나 봅니다.
</Callout>

[AI Log 쓰기](../logs/new), [다른 문서](./getting-started), [바깥 주소](https://nextjs.org/docs)
````

- 코드 블록은 언어를 적으면 색이 칠해지고 위쪽 막대에 언어 이름이 보입니다. 언어를 적지 않으면 색 없이 보입니다. 복사 버튼은 언제나 있습니다.
- `Callout` 은 import 없이 씁니다. `tone` 은 `info`(알아 둘 것), `success`(잘 되는 방법), `warning`(조심할 것), `danger`(되돌릴 수 없는 일) 가운데 하나이고, `title` 은 빼도 됩니다.
- 앱의 다른 화면은 Club 주소 없이 `../logs/new` 처럼 상대 경로로 겁니다. 다른 문서는 `./<slug>`, 바깥 주소는 전체 주소로 적으면 새 탭에서 열립니다.

`npm test` 가 목록과 파일이 서로 맞는지 봅니다. 문서는 Club 소속이 있어야 보이지만 저장소에 그대로 들어가므로, 저장소를 공개하면 함께 공개됩니다. 비밀 값과 개인 정보를 적지 않습니다.

## 검증

```bash
npm run lint
npm run design:lint
npm run build
npm test
```

`npm run design:lint` 는 `DESIGN.md` 가 Google 의 DESIGN.md 형식에 맞는지 검사합니다. 테두리 색처럼 형식이 나타내지 못하는 토큰의 경고는 받아들이기로 했고, 까닭은 `DESIGN.md` 의 Components 절에 있습니다.

`npm test` 는 입력 규칙 시험과 접근 규칙 시험을 차례로 돌립니다. 입력 규칙 시험에는 `DESIGN.md` 의 토큰이 `src/app/globals.css` 와 같은지 보는 시험도 들어 있습니다. 접근 규칙 시험은 Docker 에 빈 Postgres 를 띄워 `supabase/migrations/` 를 적용한 뒤 시험하므로 Docker 가 켜져 있어야 합니다. 시험이 끝나면 띄운 컨테이너와 그 볼륨을 함께 지웁니다. 실제 Supabase 프로젝트에는 아무것도 보내지 않습니다. 하나만 돌리려면 `npm run test:unit` 이나 `npm run test:db` 를 씁니다.

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
- [제품 디자인 원칙과 디자인 토큰](DESIGN.md)
- [데이터 설계](docs/DATABASE.md)
- [설계 결정 기록](docs/adr/README.md)

