export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Blinkwatch
        </h1>
        <p className="mt-4 text-lg text-foreground/70">
          Uma experiência interativa para RPGs de terror
        </p>
        <p className="mt-8 rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/60">
          Projeto em desenvolvimento. As funcionalidades de câmera e visão
          computacional serão implementadas em issues futuras.
        </p>
      </div>
    </main>
  );
}
