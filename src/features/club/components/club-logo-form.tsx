"use client"

import { useRef, useState, useTransition } from "react"
import { CircleAlert, ImagePlus, Trash2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { removeClubLogo, saveClubLogo } from "../actions"
import { resizeLogo } from "../logo-image"
import {
  CLUB_LOGO_SOURCE_ACCEPT,
  CLUB_LOGO_SOURCE_TYPE_NAMES,
  clubLogoUrl,
  logoSourceError,
} from "../logo-rules"
import { ClubLogo } from "./club-logo"

// Club 설정의 로고 영역. 운영자에게만 보인다.
// 고른 이미지는 브라우저에서 가운데를 정사각형으로 잘라 줄인 뒤 바로 저장한다.
// 저장하면 서버 동작이 화면을 새로 그려서 logoPath 가 바뀐다.
export function ClubLogoForm({
  clubId,
  name,
  logoPath,
}: {
  clubId: string
  name: string
  logoPath: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [pending, startTransition] = useTransition()
  const src = clubLogoUrl(clubId, logoPath)

  function upload(file: File) {
    const reason = logoSourceError(file)
    if (reason) {
      setError(reason)
      return
    }
    setError(null)
    setNotice("")
    startTransition(async () => {
      let resized
      try {
        resized = await resizeLogo(file)
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "이미지를 줄이지 못했습니다. 다른 이미지를 골라 주세요."
        )
        return
      }
      const formData = new FormData()
      formData.set("file", resized.blob)
      const result = await saveClubLogo(clubId, formData)
      if (result.ok) {
        setNotice("로고를 바꿨습니다.")
      } else {
        setError(result.message)
      }
    })
  }

  function remove() {
    setError(null)
    setNotice("")
    startTransition(async () => {
      const result = await removeClubLogo(clubId)
      if (result.ok) {
        setNotice("로고를 지웠습니다. 이름의 첫 글자가 보입니다.")
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <section className="flex max-w-[720px] flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">로고</h2>
        <p className="text-body-s text-muted-foreground">
          Club 목록과 왼쪽 메뉴에 보이는 사진입니다. 가운데를 기준으로
          정사각형으로 잘라 줄여서 저장합니다. 로그인한 사용자는 Member 가
          아니어도 Club 목록에서 이 사진을 봅니다.
        </p>
      </div>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>로고를 바꾸지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <ClubLogo
          name={name}
          src={src}
          className="size-20 rounded-xl bg-primary-subtle text-h1 text-brand"
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" strokeWidth={1.5} />
              {pending ? "저장하는 중" : src ? "사진 바꾸기" : "사진 올리기"}
            </Button>
            {src && (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={remove}
              >
                <Trash2 aria-hidden="true" strokeWidth={1.5} />
                로고 지우기
              </Button>
            )}
          </div>
          <p className="text-caption text-muted-foreground">
            {CLUB_LOGO_SOURCE_TYPE_NAMES} 를 10MB 까지 고를 수 있습니다.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={CLUB_LOGO_SOURCE_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            // 같은 파일을 다시 골라도 바뀐 것으로 알아차리게 비운다.
            event.target.value = ""
            if (file) {
              upload(file)
            }
          }}
        />
      </div>
      <span role="status" className="sr-only">
        {notice}
      </span>
    </section>
  )
}
