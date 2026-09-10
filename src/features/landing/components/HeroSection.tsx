import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center text-center">
      <p className="text-sm font-medium tracking-[0.2em] text-zinc-400 uppercase">
        Blinkwatch
      </p>

      <p className="mt-4 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium tracking-wide text-zinc-300">
        Experiência de RPG de terror
      </p>

      <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-balance text-zinc-50 sm:text-5xl lg:text-6xl">
        Não desvie o olhar.
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
        Uma experiência interativa para sessões de RPG de terror que transforma
        atenção e piscadas em eventos narrativos.
      </p>

      <p className="mt-4 max-w-lg text-sm text-zinc-400">
        Prepare-se para a experiência. A câmera será configurada na próxima
        etapa — nenhuma permissão será solicitada nesta tela.
      </p>

      <div className="mt-10">
        <Button
          nativeButton={false}
          render={<Link href="/play/setup" />}
          size="lg"
          className="min-h-11 px-8 text-base"
        >
          Iniciar experiência
        </Button>
      </div>
    </section>
  );
}
