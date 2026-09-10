import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Câmera | Blinkwatch',
  description: 'Prepare-se para ativar a câmera na experiência do Blinkwatch.',
};

export default function PlayCameraPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center overflow-x-hidden bg-zinc-950 px-6 py-16">
      <div className="w-full max-w-lg">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-400 uppercase">
          Blinkwatch
        </p>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Câmera
        </h1>

        <p className="mt-6 leading-relaxed text-zinc-300">
          A etapa de consentimento foi concluída. A câmera ainda não foi
          ativada.
        </p>

        <p className="mt-4 leading-relaxed text-zinc-400">
          Nenhuma permissão do navegador foi solicitada nesta tela. A ativação
          da câmera será implementada na próxima etapa.
        </p>

        <p className="mt-8">
          <Link
            href="/play/setup"
            className="text-sm text-zinc-300 underline-offset-4 hover:text-zinc-50 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none"
          >
            Voltar para a preparação
          </Link>
        </p>
      </div>
    </main>
  );
}
