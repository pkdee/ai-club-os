import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { isMonthKey, monthLabel } from "@/features/ai-insight/period";
import { loadClubPage } from "@/features/club/page-data";
import { MonthActivityCard } from "@/features/retrospective/components/month-activity";
import { RetrospectiveSection } from "@/features/retrospective/components/retrospective-section";
import {
  getMonthActivity,
  listMonthRetrospectives,
} from "@/features/retrospective/queries";
import { isPastOrCurrentMonth } from "@/features/retrospective/rules";

type Props = PageProps<"/clubs/[clubId]/retros/[month]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { month } = await props.params;

  return {
    title: `${isMonthKey(month) ? `${monthLabel(month)} 회고` : "회고"} | AI Club OS`,
  };
}

// 한 달 회고. 그 달에 내가 한 것을 옆에 두고 돌아보는 글을 쓴다. 다른 Member 의 회고도 함께 보인다.
export default async function MonthRetrospectivePage(props: Props) {
  const { clubId, month } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const now = new Date();
  const hubHref = `/clubs/${clubId}/retros`;
  if (!isPastOrCurrentMonth(month, now)) {
    return (
      <div className="rounded-xl border bg-card">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <CircleAlert strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>돌아볼 수 없는 달입니다</EmptyTitle>
            <EmptyDescription>
              주소가 틀렸거나 아직 오지 않은 달입니다. 회고 화면에서 달을 다시
              골라 주세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              href={hubHref}
              className={buttonVariants({ variant: "outline" })}
            >
              회고로
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const label = monthLabel(month);
  const [retrospectives, activity] = await Promise.all([
    listMonthRetrospectives(clubId, month),
    getMonthActivity(clubId, data.user.id, data.club.memberId, month),
  ]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: data.club.name, href: `/clubs/${clubId}` },
            { label: "회고", href: hubHref },
            { label },
          ]}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">{label} 회고</h1>
          <p className="text-muted-foreground">
            한 달 동안 한 것을 보며 돌아봅니다. 사람마다 하나씩 쓰고, 같은
            Club 의 Member 가 모두 봅니다.
          </p>
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-start-1">
          <MonthActivityCard clubId={clubId} activity={activity} now={now} />
        </aside>
        <div className="flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-start-1">
          {retrospectives.status === "unavailable" ? (
            <p className="rounded-xl border bg-card p-5 text-muted-foreground">
              데이터베이스에 회고의 구조가 아직 없습니다. 최신 마이그레이션을
              적용하면 쓸 수 있습니다.
            </p>
          ) : (
            <RetrospectiveSection
              clubId={clubId}
              target={{ scope: "month", month }}
              subject={label}
              title="이 달의 회고"
              result={retrospectives}
              currentUserId={data.user.id}
              isAdmin={data.club.role === "admin"}
              canWrite
              now={now}
            />
          )}
        </div>
      </div>
    </>
  );
}
