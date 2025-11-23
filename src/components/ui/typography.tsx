import { PropsWithChildren } from "react"

export function H1(props: PropsWithChildren) {
  return (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
      {props.children}
    </h1>
  )
}

export function H2(props: PropsWithChildren) {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {props.children}
    </h2>
  )
}

export function H3(props: PropsWithChildren) {
  return (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {props.children}
    </h3>
  )
}

export function H4(props: PropsWithChildren) {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {props.children}
    </h4>
  )
}

export function P(props: PropsWithChildren) {
  return (
    <p className="leading-7 [&:not(:first-child)]:mt-6">
      {props.children}
    </p>
  )
}

export function Blockquote(props: PropsWithChildren) {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic">
      {props.children}
    </blockquote>
  )
}

export function InlineCode(props: PropsWithChildren) {
  return (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {props.children}
    </code>
  )
}

export function Lead(props: PropsWithChildren) {
  return (
    <p className="text-muted-foreground text-xl">
      {props.children}
    </p>
  )
}

export function Large(props: PropsWithChildren) {
  return <div className="text-lg font-semibold">{props.children}</div>
}

export function Small(props: PropsWithChildren) {
  return (
    <small className="text-sm leading-none font-medium">{props.children}</small>
  )
}

export function Muted(props: PropsWithChildren) {
  return (
    <p className="text-muted-foreground text-sm">{props.children}</p>
  )
}

