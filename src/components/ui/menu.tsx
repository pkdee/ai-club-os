"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

// Figma 의 Menu 를 옮긴 것이다. 버튼을 누르면 그 옆에 할 수 있는 일의 목록이 뜬다.
function Menu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="menu" {...props} />
}

function MenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
}

function MenuContent({
  className,
  align = "end",
  side = "bottom",
  sideOffset = 4,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn(
            "min-w-44 rounded-lg border bg-card p-1 text-card-foreground shadow-lg duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

const itemClassName =
  "flex h-9 cursor-default items-center gap-2 rounded-md px-2.5 text-label-m outline-none select-none data-disabled:pointer-events-none data-disabled:text-disabled-foreground [&_svg]:size-4 [&_svg]:shrink-0"

// tone 이 danger 이면 되돌릴 수 없는 일이나 로그아웃처럼 지금의 흐름을 끝내는 일이라는 뜻으로 붉게 보여 준다.
function MenuItem({
  className,
  tone = "default",
  ...props
}: MenuPrimitive.Item.Props & { tone?: "default" | "danger" }) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(
        itemClassName,
        tone === "danger"
          ? "text-danger data-highlighted:bg-danger-subtle [&_svg]:text-icon-danger"
          : "data-highlighted:bg-accent",
        className
      )}
      {...props}
    />
  )
}

// 다른 화면으로 가는 항목. render 로 next/link 의 Link 를 넘긴다.
function MenuLinkItem({
  className,
  closeOnClick = true,
  ...props
}: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="menu-link-item"
      closeOnClick={closeOnClick}
      className={cn(itemClassName, "data-highlighted:bg-accent", className)}
      {...props}
    />
  )
}

function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// 고를 수 없는 항목이 왜 막혀 있는지 알려 주는 글.
function MenuNote({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="menu-note"
      className={cn(
        "max-w-56 px-2.5 py-1.5 text-caption text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Menu,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuNote,
  MenuSeparator,
  MenuTrigger,
}
