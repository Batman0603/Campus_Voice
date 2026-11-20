export default function HomePage() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm font-semibold tracking-[0.25em] uppercase">
            The Nest School
          </p>

          <h1 className="text-5xl font-bold tracking-tight">CampusVoice</h1>

          <p className="text-muted-foreground text-lg">
            Pedagogy and Performance Feedback System
          </p>
        </div>

        <div className="bg-card rounded-xl border p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Welcome to CampusVoice</h2>

          <p className="text-muted-foreground mt-3 text-sm leading-6">
            A unified platform for collecting feedback, evaluating teaching
            practices and understanding academic performance.
          </p>

          <p className="text-muted-foreground mt-6 text-xs font-medium tracking-wider uppercase">
            Development environment
          </p>
        </div>

        <p className="text-muted-foreground text-xs">
          CampusVoice · Academic Year 2026–27
        </p>
      </section>
    </main>
  );
}
