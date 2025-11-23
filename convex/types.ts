import { ArgsArray, GenericQueryCtx } from "convex/server";
import type { query } from "./_generated/server";

type Query = typeof query;
type GenericHandler = (ctx: GenericQueryCtx<any>, ...args: ArgsArray) => any
type Handler = Parameters<Query>[0] extends (GenericHandler|{handler: infer H})
  ? H
  : never
export type QueryCtx = Parameters<Handler>[0]