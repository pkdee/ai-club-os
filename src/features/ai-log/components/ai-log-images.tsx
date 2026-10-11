"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CircleAlert, ImageOff, ImagePlus, Images } from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { createUploadClient } from "@/lib/supabase/upload-client"

import {
  cancelAiLogImageUpload,
  removeAiLogImage,
  startAiLogImageUpload,
} from "../image-actions"
import {
  AI_LOG_IMAGE_ACCEPT,
  AI_LOG_IMAGE_BUCKET,
  AI_LOG_IMAGE_LIMIT,
  AI_LOG_IMAGE_MAX_BYTES,
  AI_LOG_IMAGE_TYPE_NAMES,
  formatImageSize,
  pickImageFiles,
} from "../image-rules"
import type { AiLogImage } from "../images"

const UPLOAD_FAILED_MESSAGE =
  "올리지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요."

// 파일 한 장을 올린다. 올리지 못했으면 그 이유를 돌려준다.
async function upload(clubId: string, logId: string, file: File) {
  const started = await startAiLogImageUpload(clubId, logId, {
    type: file.type,
    size: file.size,
  })
  if (!started.ok) {
    return started.message
  }

  const client = createUploadClient()
  const result = client
    ? await client.storage
        .from(AI_LOG_IMAGE_BUCKET)
        .uploadToSignedUrl(started.path, started.token, file, {
          contentType: file.type,
        })
        .catch(() => ({ error: true }))
    : { error: true }

  if (result.error) {
    // 적어 둔 줄이 자리를 차지하지 않게 거둔다.
    await cancelAiLogImageUpload(started.path).catch(() => undefined)
    return UPLOAD_FAILED_MESSAGE
  }
  return null
}

// 기록에 붙은 이미지. canAttach 는 작성자 본인, canRemove 는 작성자 본인이거나 운영자라는 뜻이다.
// 실제 판단은 데이터베이스와 Storage 가 한다.
export function AiLogImages({
  clubId,
  logId,
  logTitle,
  images,
  loadFailed,
  canAttach,
  canRemove,
}: {
  clubId: string
  logId: string
  logTitle: string
  images: AiLogImage[]
  loadFailed: boolean
  canAttach: boolean
  canRemove: boolean
}) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  )
  const [problems, setProblems] = useState<{ name: string; message: string }[]>(
    []
  )
  // 올리다 만 것처럼 파일이 없는 줄은 지울 수 있는 사람에게만 보인다. 다른 사람에게는 볼 것이 없다.
  const visible = images.filter((image) => image.url || canRemove)
  const remaining = AI_LOG_IMAGE_LIMIT - images.length

  if (visible.length === 0 && !canAttach) {
    return null
  }

  async function attach(files: File[]) {
    const pick = pickImageFiles(files, remaining)
    const failed = [...pick.rejected]
    setProblems(failed)
    if (pick.accepted.length === 0) {
      return
    }

    setProgress({ done: 0, total: pick.accepted.length })
    for (const [index, file] of pick.accepted.entries()) {
      const message = await upload(clubId, logId, file).catch(
        () => UPLOAD_FAILED_MESSAGE
      )
      if (message) {
        failed.push({ name: file.name, message })
        setProblems([...failed])
      }
      setProgress({ done: index + 1, total: pick.accepted.length })
    }
    setProgress(null)
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex items-center gap-2 text-h4">
            <Images
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5 shrink-0 text-icon-brand"
            />
            이미지
            {canAttach && (
              <span className="text-body-s text-muted-foreground">
                {images.length} / {AI_LOG_IMAGE_LIMIT}
              </span>
            )}
          </h2>
          {canAttach && (
            <p className="text-body-s text-muted-foreground">
              {AI_LOG_IMAGE_TYPE_NAMES} 를 한 장에{" "}
              {formatImageSize(AI_LOG_IMAGE_MAX_BYTES)} 까지 붙일 수 있습니다.
              Club 의 Member 만 보고, AI Insight 와 발표에는 쓰이지 않습니다.
            </p>
          )}
        </div>
        {canAttach && (
          <>
            <input
              ref={input}
              type="file"
              accept={AI_LOG_IMAGE_ACCEPT}
              multiple
              hidden
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                // 같은 파일을 다시 골라도 반응하게 비운다.
                event.target.value = ""
                void attach(files)
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={progress !== null || remaining <= 0}
              onClick={() => input.current?.click()}
            >
              <ImagePlus aria-hidden="true" strokeWidth={1.5} />
              {progress ? "올리는 중" : "이미지 붙이기"}
            </Button>
          </>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {progress &&
          `${progress.total}장 가운데 ${Math.min(progress.done + 1, progress.total)}장째를 올리고 있습니다.`}
      </p>
      {progress && (
        <p aria-hidden="true" className="text-body-s text-muted-foreground">
          {progress.total}장 가운데{" "}
          {Math.min(progress.done + 1, progress.total)}장째를 올리고 있습니다.
          끝날 때까지 이 화면을 닫지 말아 주세요.
        </p>
      )}
      {problems.length > 0 && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>붙이지 못한 파일이 있습니다</AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {problems.map((problem, index) => (
                <li key={`${problem.name}-${index}`} className="break-words">
                  {problem.name}: {problem.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {loadFailed && (
        <p role="status" className="text-body-s text-muted-foreground">
          이미지를 불러오지 못했습니다. 잠시 뒤 화면을 새로 고쳐 주세요.
        </p>
      )}
      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visible.map((image, index) => (
            <li
              key={image.id}
              className="flex flex-col overflow-hidden rounded-lg border bg-muted"
            >
              {image.url ? (
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  {/* 잠깐 쓰는 바깥 주소라 next/image 의 변환을 거치지 않고 그대로 불러온다. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`${logTitle} 에 붙인 이미지 ${index + 1}. 누르면 새 창에서 크게 봅니다.`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </a>
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 p-3 text-center text-caption text-muted-foreground">
                  <ImageOff
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="size-5 text-icon-subtle"
                  />
                  {loadFailed
                    ? "불러오지 못한 이미지"
                    : "파일이 없는 이미지입니다. 지우면 자리가 납니다."}
                </div>
              )}
              {canRemove && (
                <div className="flex items-center justify-between gap-2 border-t bg-card p-2">
                  <span className="text-caption text-muted-foreground">
                    {formatImageSize(image.sizeBytes)}
                  </span>
                  <DeleteDialog
                    label="삭제"
                    size="sm"
                    title="이 이미지를 지울까요?"
                    description={
                      <p>
                        {`"${logTitle}" 기록에 붙인 이미지 한 장이 지워집니다. 지우면 되돌릴 수 없습니다.`}
                      </p>
                    }
                    onDelete={removeAiLogImage.bind(null, clubId, image.id)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-s text-muted-foreground">
          아직 붙인 이미지가 없습니다. 화면을 찍은 것이나 결과 그림을 붙여 두면
          다른 Member 가 이해하기 쉽습니다.
        </p>
      )}
    </section>
  )
}
