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
import { generatePeriodInsight } from "@/features/ai-insight/actions";
import { InsightSection } from "@/features/ai-insight/components/insight-section";
import {
  isMonthKey,
  monthKeyOf,
  monthLabel,
  monthRange,
} from "@/features/ai-insight/period";
import {
  countPeriodLogs,
  getPeriodInsight,
} from "@/features/ai-insight/queries";
import { loadClubPage } from "@/features/club/page-data";

type Props = PageProps<"/clubs/[clubId]/insights/[month]">;

// AI 가 정리하는 동안 기다릴 수 있는 시간(초). 이 화면에서 부르는 서버 동작에 적용된다.
export const maxDuration = 60;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { month } = await props.params;

  return {
    title: `${isMonthKey(month) ? `${monthLabel(month)} AI Insight` : "AI Insight"} | AI Club OS`,
  };
}

export default async function PeriodInsightPage(props: Props) {
  const { clubId, month } = await props.params;
  const data = await loadClubPage(clubId);
  // 볼 수 없는 Club 은 layout 이 안내 화면을 대신 그린다.
  if (!data) {
    return null;
  }

  const base = `/clubs/${clubId}/insights`;
  const now = new Date();
  // 주소의 달이 틀렸거나 아직 오지 않은 달이면 정리할 것이 없다.
  if (!isMonthKey(month) || month > monthKeyOf(now)) {
    return (
      <div className="rounded-xl border bg-card">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <CircleAlert strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>정리할 수 없는 기간입니다</EmptyTitle>
            <EmptyDescription>
              주소의 달이 맞는지 확인하거나 AI Insight 목록에서 다시 골라
              주세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={base} className={buttonVariants({ variant: "outline" })}>
              AI Insight 목록으로
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const { start, end } = monthRange(month);
  const label = monthLabel(month);
  const [result, logCount] = await Promise.all([
    getPeriodInsight(clubId, start, end),
    countPeriodLogs(clubId, start, end),
  ]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: data.club.name, href: `/clubs/${clubId}` },
            { label: "AI Insight", href: base },
            { label },
          ]}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">{label}의 AI Insight</h1>
          <p className="text-muted-foreground">
            이 달에 남긴 Club 의 AI Log
            {logCount === null ? "" : ` ${logCount}개`}를 정리한 내용입니다.
          </p>
        </div>
      </div>
      <InsightSection
        clubId={clubId}
        canManage={data.club.role === "admin"}
        result={result}
        targetLabel={label}
        logCount={logCount}
        retryHref={`${base}/${month}`}
        onGenerate={generatePeriodInsight.bind(null, clubId, month)}
        now={now}
      />
    </>
  );
}
