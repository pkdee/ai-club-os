"use client"

import { useActionState } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { updateClub, type ClubSettingsState } from "../actions"
import {
  CLUB_DESCRIPTION_MAX,
  CLUB_NAME_MAX,
  type ClubInput,
} from "../rules"

const initialState: ClubSettingsState = { status: "idle" }

export function ClubSettingsForm({
  clubId,
  defaults,
}: {
  clubId: string
  defaults: ClubInput
}) {
  const [state, formAction, pending] = useActionState(
    (previous: ClubSettingsState, formData: FormData) =>
      updateClub(clubId, previous, formData),
    initialState
  )
  const errors = state.errors ?? {}
  const values = state.values ?? defaults

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>Club 정보를 저장하지 못했습니다</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && (
        <Alert tone="success">
          <CircleCheck aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>저장했습니다</AlertTitle>
          <AlertDescription>
            바뀐 이름과 소개가 모든 Member 에게 보입니다.
          </AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="settings-club-name">Club 이름</FieldLabel>
        <Input
          // 저장한 뒤나 입력 오류로 처음 값이 바뀌면 칸을 새로 그린다.
          // Base UI 의 Input 은 처음 그린 뒤에 바뀐 처음 값을 받지 않는다.
          key={values.name}
          id="settings-club-name"
          name="name"
          required
          maxLength={CLUB_NAME_MAX}
          autoComplete="off"
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "settings-club-name-error" : undefined}
        />
        {errors.name && (
          <FieldError id="settings-club-name-error">{errors.name}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="settings-club-description">소개</FieldLabel>
        <Textarea
          id="settings-club-description"
          name="description"
          maxLength={CLUB_DESCRIPTION_MAX}
          defaultValue={values.description}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby="settings-club-description-help"
        />
        {errors.description ? (
          <FieldError id="settings-club-description-help">
            {errors.description}
          </FieldError>
        ) : (
          <FieldDescription id="settings-club-description-help">
            Member 가 Club 을 고를 때와 초대 링크를 열었을 때 보는 설명입니다.
          </FieldDescription>
        )}
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "저장하는 중" : "변경 내용 저장"}
        </Button>
      </div>
    </form>
  )
}
