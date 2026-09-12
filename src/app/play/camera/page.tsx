import type { Metadata } from 'next';

import { CameraPreview } from '@/features/camera/components/CameraPreview';

export const metadata: Metadata = {
  title: 'Câmera | Blinkwatch',
  description:
    'Ative a câmera localmente para a prévia do Blinkwatch. Nenhum vídeo é transmitido ou gravado.',
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
          A câmera será solicitada somente quando você selecionar a ação abaixo.
          A prévia permanece no seu dispositivo — nenhum vídeo é enviado ou
          gravado nesta etapa.
        </p>

        <p className="mt-4 leading-relaxed text-zinc-400">
          Visão computacional e detecção de eventos ainda não estão ativas. Após
          iniciar a câmera, você pode carregar o modelo local para validar a
          infraestrutura — nenhum frame é analisado nesta etapa.
        </p>

        <CameraPreview />
      </div>
    </main>
  );
}
