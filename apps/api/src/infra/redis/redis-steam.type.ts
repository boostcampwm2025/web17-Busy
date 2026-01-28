export type StreamEntry = [id: string, kv: string[]];
export type XReadGroupReply = Array<
  [streamKey: string, entries: StreamEntry[]]
> | null;
