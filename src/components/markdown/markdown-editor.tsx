"use client"

import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Tabs } from "@base-ui/react/tabs"
import { Toolbar } from "@base-ui/react/toolbar"
import {
  Bold,
  Code,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  type LucideIcon,
} from "lucide-react"

import {
  applyEdit,
  continueList,
  insertLink,
  toggleCode,
  toggleList,
  toggleWrap,
  type MarkdownEdit,
  type TextSelection,
} from "@/lib/markdown-edit"

import { MarkdownBody } from "./markdown"

type Format = {
  label: string
  // Cmd 나 Ctrl 과 함께 누르는 글쇠.
  key?: string
  icon: LucideIcon
  edit: (selection: TextSelection) => MarkdownEdit
}

const FORMATS: Format[] = [
  {
    label: "굵게",
    key: "b",
    icon: Bold,
    edit: (selection) => toggleWrap(selection, "**", "굵은 글"),
  },
  {
    label: "기울임",
    key: "i",
    icon: Italic,
    edit: (selection) => toggleWrap(selection, "*", "기울인 글"),
  },
  { label: "코드", key: "e", icon: Code, edit: toggleCode },
  { label: "링크", key: "k", icon: LinkIcon, edit: insertLink },
  {
    label: "목록",
    icon: List,
    edit: (selection) => toggleList(selection, "bullet"),
  },
  {
    label: "번호 목록",
    icon: ListOrdered,
    edit: (selection) => toggleList(selection, "ordered"),
  },
]

const TAB_CLASS =
  "-mb-px flex h-10 shrink-0 items-center border-b-2 border-transparent px-1 text-label-m whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-active:border-ring data-active:text-foreground"

// 한글 자판처럼 글쇠가 다른 글자를 내면 놓인 자리로 본다. 영문 자판에서는 낸 글자로 본다.
function pressed(event: React.KeyboardEvent, letter: string) {
  const key = event.key.toLowerCase()
  return /^[a-z]$/.test(key)
    ? key === letter
    : event.code === `Key${letter.toUpperCase()}`
}

// 칸의 글을 바꾼다. execCommand 로 바꿔야 브라우저의 되돌리기에 남는다.
// 브라우저가 막으면 값을 직접 바꾸고 input 이벤트를 보낸다. 폼의 임시 저장이 이 이벤트를 듣는다.
function apply(textarea: HTMLTextAreaElement, edit: MarkdownEdit) {
  textarea.focus()
  textarea.setSelectionRange(edit.from, edit.to)
  if (!document.execCommand("insertText", false, edit.insert)) {
    textarea.value = applyEdit(textarea.value, edit)
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
  }
  textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd)
}

type MarkdownEditorProps = {
  id: string
  name: string
  // 처음 그릴 때의 글. 이 칸은 값을 들고 있지 않고, 폼이 보낼 때 textarea 에서 읽는다.
  defaultValue: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  // 미리 보기의 # 제목이 될 태그의 단계. 저장한 뒤 본문을 보여 줄 화면과 맞춘다.
  headingLevel?: number
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

// Markdown 으로 적는 칸. 쓰기와 미리 보기 탭, 서식 버튼, 단축키(Cmd 나 Ctrl 과 B, I, E, K)를 둔다.
// 목록 줄에서 Enter 를 누르면 다음 줄에 표시를 잇는다.
export function MarkdownEditor({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  maxLength,
  headingLevel = 3,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<"write" | "preview">("write")
  // 미리 보기를 연 때의 글.
  const [preview, setPreview] = useState("")

  function format(item: Format) {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }
    apply(
      textarea,
      item.edit({
        value: textarea.value,
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      })
    )
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 한글을 조합하는 중에 누른 글쇠는 글자를 마무리하는 것이다.
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return
    }
    const textarea = event.currentTarget
    const selection = {
      value: textarea.value,
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    }

    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
      const item = FORMATS.find((entry) => entry.key && pressed(event, entry.key))
      if (item) {
        event.preventDefault()
        apply(textarea, item.edit(selection))
      }
      return
    }

    if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
      const edit = continueList(selection)
      if (edit) {
        event.preventDefault()
        apply(textarea, edit)
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Tabs.Root
        value={tab}
        onValueChange={(value) => {
          if (value === "preview") {
            setPreview(textareaRef.current?.value ?? "")
          }
          setTab(value === "preview" ? "preview" : "write")
        }}
        className="rounded-md border border-input bg-card transition-colors has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:inset-ring-1 has-[textarea:focus-visible]:inset-ring-ring has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-ring/40 has-[textarea[aria-invalid=true]]:border-danger-border-strong"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-2 border-b pr-1 pl-3">
          <Tabs.List className="flex gap-4">
            <Tabs.Tab value="write" className={TAB_CLASS}>
              쓰기
            </Tabs.Tab>
            <Tabs.Tab value="preview" className={TAB_CLASS}>
              미리 보기
            </Tabs.Tab>
          </Tabs.List>
          {tab === "write" && (
            <Toolbar.Root
              aria-label="서식"
              aria-controls={id}
              className="flex items-center gap-0.5 py-1"
            >
              {FORMATS.map((item) => (
                <Toolbar.Button
                  key={item.label}
                  aria-label={item.label}
                  aria-keyshortcuts={
                    item.key
                      ? `Meta+${item.key.toUpperCase()} Control+${item.key.toUpperCase()}`
                      : undefined
                  }
                  title={
                    item.key
                      ? `${item.label} (⌘${item.key.toUpperCase()} 또는 Ctrl+${item.key.toUpperCase()})`
                      : item.label
                  }
                  onClick={() => format(item)}
                  className="flex size-8 items-center justify-center rounded-md text-icon-subtle transition-colors hover:bg-secondary-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <item.icon
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="size-4"
                  />
                </Toolbar.Button>
              ))}
            </Toolbar.Root>
          )}
        </div>
        {/* 미리 보기 중에도 폼이 값을 보내도록 쓰는 칸은 늘 남겨 둔다. */}
        <Tabs.Panel value="write" keepMounted tabIndex={-1}>
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            required={required}
            maxLength={maxLength}
            placeholder={placeholder}
            defaultValue={defaultValue}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            onKeyDown={onKeyDown}
            // 미리 보기 중에 저장을 누르면 브라우저가 감춰진 칸을 가리키지 못한다. 쓰기 탭을 먼저 연다.
            onInvalid={() => flushSync(() => setTab("write"))}
            className="block field-sizing-content min-h-32 w-full resize-none rounded-b-md bg-transparent px-3 py-2.5 text-base text-foreground outline-none placeholder:text-tertiary md:text-body-m"
          />
        </Tabs.Panel>
        <Tabs.Panel
          value="preview"
          className="min-h-32 rounded-b-md px-3 py-2.5 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {preview.trim() ? (
            <MarkdownBody
              headingLevel={headingLevel}
              idPrefix={`${id}-preview-`}
              className="text-body-l"
            >
              {preview}
            </MarkdownBody>
          ) : (
            <p className="text-body-m text-muted-foreground">
              미리 볼 내용이 없습니다.
            </p>
          )}
        </Tabs.Panel>
      </Tabs.Root>
      <p className="text-caption text-muted-foreground">
        Markdown 을 쓸 수 있습니다.
      </p>
    </div>
  )
}
