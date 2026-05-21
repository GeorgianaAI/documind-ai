export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-1 mix-blend-screen">
      <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />
    </div>
  );
}
