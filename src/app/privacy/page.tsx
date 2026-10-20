import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { insightProviderInfo } from "@/features/ai-insight/provider";
import { AI_LOG_DRAFT_DAYS } from "@/features/ai-log/draft";
import {
  AI_LOG_IMAGE_LIMIT,
  AI_LOG_IMAGE_MAX_BYTES,
  formatImageSize,
} from "@/features/ai-log/image-rules";
import {
  AI_LOG_REVISION_DAYS,
  AI_LOG_REVISION_LIMIT,
} from "@/features/ai-log/revisions";
import { DELETION_LOG_DAYS } from "@/features/club/deletions";

export const metadata: Metadata = {
  title: "개인 정보 안내 | AI Club OS",
  description: "AI Club OS 가 무엇을 모으고, 누가 보고, 얼마나 두는지 적은 안내",
};

// AI Insight 를 만들 때 어디로 무엇을 보내는지. 서버에 설정한 AI Provider 에 따라 글이 바뀐다.
// 이 화면은 빌드할 때 만들어지므로 Provider 를 바꾸면 다시 빌드해야 반영된다.
function insightSentence() {
  const provider = insightProviderInfo();
  if (!provider) {
    return "AI Insight 를 만드는 AI 서비스가 설정되어 있지 않아, 기록을 AI 서비스로 보내지 않습니다.";
  }
  return [
    `운영자가 AI Insight 를 만들 때 그 Session 이나 그 달의 AI Log 내용을 ${provider.label} 로 보냅니다. 작성자가 정리에 쓰지 말라고 한 기록은 보내지 않고, 회고는 작성자가 써도 된다고 한 것만 보냅니다. 이름, 이메일, 이미지는 보내지 않습니다.`,
    provider.dataNotice,
  ]
    .filter(Boolean)
    .join(" ");
}

// 문의를 받는 주소. 서버의 환경 변수 CONTACT_EMAIL 에 적는다. 비어 있거나 이메일 모양이 아니면 보여 주지 않는다.
function contactEmail() {
  const value = process.env.CONTACT_EMAIL?.trim() ?? "";
  return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(value) ? value : null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

// 로그인하지 않아도 볼 수 있는 화면이다. 이 앱이 실제로 하는 일을 그대로 적는다.
// 기능을 바꿔서 여기 적힌 것과 달라지면 이 글도 함께 고친다.
export default function PrivacyPage() {
  const contact = contactEmail();

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 sm:px-8">
        <Link
          href="/"
          aria-label="AI Club OS 처음 화면으로"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1">개인 정보 안내</h1>
          <p className="text-body-l text-muted-foreground">
            AI Club OS 가 무엇을 모으고, 어디에 두고, 누가 보고, 얼마나 두는지
            적었습니다. 앱이 실제로 하는 일을 그대로 옮긴 것입니다.
          </p>
        </div>
        <Section title="모으는 것">
          <List
            items={[
              "Google 로 로그인할 때 받는 이름, 이메일, 프로필 사진의 주소. 비밀번호는 받지 않습니다.",
              "내가 적는 것. Club, Session, 출석, AI Log, 댓글, 회고, Project 와 할 일, 발표의 소개 글.",
              `AI Log 에 붙인 이미지. 한 기록에 ${AI_LOG_IMAGE_LIMIT}장, 한 장에 ${formatImageSize(AI_LOG_IMAGE_MAX_BYTES)} 까지입니다.`,
              "쓰면서 생기는 것. AI Log 를 고치기 전의 내용, 무엇을 누가 지웠는지의 기록, 알림을 마지막으로 확인한 시각.",
            ]}
          />
        </Section>
        <Section title="두는 곳과 보내는 곳">
          <List
            items={[
              "기록, 로그인 정보, 이미지는 Supabase 에 둡니다.",
              "로그인은 Google 이 확인합니다. 프로필 사진은 Google 의 서버에서 바로 불러옵니다.",
              insightSentence(),
              "화면은 이 앱을 올려 둔 서버에서 만들어집니다. 그 서버에 요청 기록이 남을 수 있습니다.",
              "광고나 방문 분석을 위한 도구는 쓰지 않습니다.",
            ]}
          />
        </Section>
        <Section title="보는 사람">
          <List
            items={[
              "내가 적은 것은 같은 Club 의 Member 만 봅니다. 다른 Club 의 사람은 볼 수 없습니다.",
              "Member 목록에는 이름, 이메일, 사진이 보입니다. Club 안에서 보이는 이름은 내가 고칠 수 있습니다.",
              "AI Log 를 고치기 전의 내용은 작성자와 운영자가 봅니다. 무엇이 지워졌는지의 기록은 운영자가 봅니다.",
              "발표는 링크를 아는 사람이면 로그인하지 않아도 봅니다. 발표에는 작성자가 넣어도 된다고 한 AI Log 와 회고만 들어가고, 이름은 발표를 공개하는 사람이 보이기로 했을 때만 나옵니다. 이메일과 이미지는 나오지 않습니다.",
            ]}
          />
        </Section>
        <Section title="두는 기간">
          <List
            items={[
              "내가 적은 것은 내가 지우거나 Club 이 지워질 때까지 둡니다.",
              `AI Log 를 고치기 전의 내용은 한 기록에 최근 ${AI_LOG_REVISION_LIMIT}번까지, ${AI_LOG_REVISION_DAYS}일 동안 둡니다.`,
              `무엇을 누가 지웠는지의 기록은 제목과 이름만 ${DELETION_LOG_DAYS}일 동안 둡니다. 지운 내용은 남기지 않습니다.`,
              "초대 링크는 만든 때부터 7일 뒤에 쓸 수 없게 됩니다.",
            ]}
          />
        </Section>
        <Section title="이 브라우저에 두는 것">
          <List
            items={[
              "로그인을 유지하는 쿠키.",
              `쓰다 만 AI Log 의 임시 저장. ${AI_LOG_DRAFT_DAYS}일이 지나면 쓰지 않고, 서버로 보내지 않습니다.`,
              "고른 화면 모드.",
            ]}
          />
        </Section>
        <Section title="지우는 방법">
          <List
            items={[
              "AI Log, 댓글, 회고, 이미지는 쓴 사람이 하나씩 지울 수 있습니다.",
              "Club 에서 나가면 소속과 출석 기록이 지워지고, 내가 쓴 AI Log, 회고, 댓글은 작성자 이름 없이 Club 에 남습니다.",
              "내 계정 화면에서 계정을 지울 수 있습니다. 그때 내가 쓴 AI Log, 회고, 댓글을 함께 지울지 고릅니다. 붙인 이미지는 언제나 지워집니다.",
              "계정을 지워도 Google 계정에 남은 이 앱과의 연결은 그대로입니다. Google 계정의 설정에서 끊을 수 있습니다.",
            ]}
          />
        </Section>
        <Section title="문의">
          <p className="text-muted-foreground">
            {contact ? (
              <>
                이 안내나 내 정보에 대해 물을 것이 있으면{" "}
                <a
                  href={`mailto:${contact}`}
                  className="rounded-sm text-brand hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {contact}
                </a>{" "}
                로 알려 주세요.
              </>
            ) : (
              "이 안내나 내 정보에 대해 물을 것이 있으면 내가 속한 Club 의 운영자에게 알려 주세요."
            )}
          </p>
        </Section>
      </main>
    </div>
  );
}
