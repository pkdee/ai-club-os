"use client"

import { useActionState } from "react"
import Link from "next/link"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"

import { joinClub, type JoinState } from "../actions"

const initialState: JoinState = { status: "idle" }

export function JoinForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    () => joinClub(token),
    initialState
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>참여하지 못했습니다</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          나중에 하기
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "참여하는 중" : "참여하기"}
        </Button>
      </div>
    </form>
  )
}
