import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preparação da câmera | Blinkwatch',
  description:
    'Prepare o dispositivo antes de iniciar a experiência do Blinkwatch.',
};

export default function PlaySetupPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-950 px-6 py-16">
      <div className="w-full max-w-lg">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-400 uppercase">
          Blinkwatch
        </p>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Preparação da câmera
        </h1>

        <p className="mt-6 leading-relaxed text-zinc-300">
          Você ainda não concedeu nenhuma permissão. Esta etapa apenas prepara o
          dispositivo para a experiência.
        </p>

        <p className="mt-4 leading-relaxed text-zinc-400">
          Na próxima fase, apresentaremos os detalhes de privacidade antes de
          solicitar acesso à câmera.
        </p>

        <p className="mt-8">
          <Link
            href="/"
            className="text-sm text-zinc-300 underline-offset-4 hover:text-zinc-50 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none"
          >
            Voltar ao início
          </Link>
        </p>
      </div>
    </main>
  );
}
