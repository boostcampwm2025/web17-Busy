export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">Offline</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Connection lost</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          VIBR could not reach the network. Reconnect and refresh to continue browsing feeds, playlists, and music.
        </p>
      </div>
    </main>
  );
}
