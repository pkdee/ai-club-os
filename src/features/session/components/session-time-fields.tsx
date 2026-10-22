"use client"

import { useState } from "react"

import { CheckboxField } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TimePicker } from "@/components/ui/time-picker"
import { followEnd } from "@/lib/time-of-day"

import type { SessionInput, SessionInputErrors } from "../rules"

// 동아리 모임은 저녁에 많이 열린다. 시작 시각이 비어 있을 때 목록을 열면 오후 7시 언저리를 먼저 보여 준다.
const START_ANCHOR = "19:00"

// Session 만들기와 수정 창의 날짜, 시작, 종료 칸과 날짜 미정.
// 날짜 미정을 켜면 세 칸을 막고 서버는 시작과 종료를 함께 비워 저장한다.
// 보이는 칸에는 이름을 두지 않고 hidden input 으로 보낸다. 막은 칸의 값도 보내서 저장하지 못해 다시 그릴 때 남는다.
export function SessionTimeFields({
  defaults,
  errors,
}: {
  defaults: Pick<
    SessionInput,
    "dateUndecided" | "date" | "startTime" | "endTime"
  >
  errors: SessionInputErrors
}) {
  const [undecided, setUndecided] = useState(defaults.dateUndecided)
  const [date, setDate] = useState(defaults.date)
  const [start, setStart] = useState(defaults.startTime)
  const [end, setEnd] = useState(defaults.endTime)
  // 날짜 미정일 때는 날짜와 시각의 오류를 보이지 않는다. 서버도 그 칸을 보지 않는다.
  const error = (name: "date" | "startTime" | "endTime") =>
    undecided ? undefined : errors[name]
  const errorId = (name: "date" | "startTime" | "endTime") =>
    error(name) ? `session-${name}-error` : undefined

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startTime" value={start} />
      <input type="hidden" name="endTime" value={end} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field className="col-span-2 sm:col-span-1">
          <FieldLabel htmlFor="session-date">날짜</FieldLabel>
          <Input
            id="session-date"
            type="date"
            required={!undecided}
            disabled={undecided}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={error("date") ? true : undefined}
            aria-describedby={errorId("date")}
          />
          {error("date") && (
            <FieldError id="session-date-error">{error("date")}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="session-start">시작</FieldLabel>
          <TimePicker
            id="session-start"
            value={start}
            onValueChange={(next) => {
              // 종료는 같은 길이를 지키며 따라간다. 그날을 넘으면 그대로 두고 입력 규칙이 알려 준다.
              setEnd(followEnd(start, end, next))
              setStart(next)
            }}
            anchor={START_ANCHOR}
            disabled={undecided}
            aria-invalid={error("startTime") ? true : undefined}
            aria-describedby={errorId("startTime")}
          />
          {error("startTime") && (
            <FieldError id="session-startTime-error">
              {error("startTime")}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="session-end">종료</FieldLabel>
          <TimePicker
            id="session-end"
            value={end}
            onValueChange={setEnd}
            after={start}
            disabled={undecided}
            aria-invalid={error("endTime") ? true : undefined}
            aria-describedby={errorId("endTime")}
          />
          {error("endTime") && (
            <FieldError id="session-endTime-error">
              {error("endTime")}
            </FieldError>
          )}
        </Field>
      </div>
      <CheckboxField
        name="dateUndecided"
        value="1"
        checked={undecided}
        onChange={(event) => setUndecided(event.target.checked)}
        label="날짜 미정"
        description="켜면 날짜와 시각 없이 저장합니다. 정해지면 수정에서 적습니다."
      />
    </div>
  )
}
