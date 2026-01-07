export default function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-primary px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-black italic tracking-tighter text-primary uppercase">{title}</h1>
    </header>
  );
}
