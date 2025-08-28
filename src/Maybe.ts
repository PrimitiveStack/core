import type { Nil } from "./Nil";

export type Maybe<T> = T | Nil
export type AsyncMaybe<T> = Promise<Maybe<T>>