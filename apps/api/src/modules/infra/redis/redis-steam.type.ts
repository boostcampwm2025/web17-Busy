export type StreamEntry = [id: string, kv: string[]];
export type XReadGroupReply = Array<
  [streamKey: string, entries: StreamEntry[]]
> | null;

export type XAutoClaimReply = [nextStartId: string, entries: StreamEntry[]];
