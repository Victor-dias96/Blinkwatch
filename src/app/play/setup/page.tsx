import type { Metadata } from 'next';

import { CameraConsentForm } from '@/features/camera-consent/components/CameraConsentForm';

export const metadata: Metadata = {
  title: 'Consentimento da câmera | Blinkwatch',
  description: 'Entenda como a câmera será utilizada antes de continuar.',
};

export default function PlaySetupPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center overflow-x-hidden bg-zinc-950 px-6 py-16">
      <div className="w-full max-w-2xl">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-400 uppercase">
          Blinkwatch
        </p>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Preparação da câmera
        </h1>

        <p className="mt-6 max-w-prose leading-relaxed text-zinc-300">
          A câmera será utilizada em uma etapa futura para analisar eventos
          visuais necessários à experiência do Blinkwatch. Neste momento,
          nenhuma permissão foi solicitada e nenhum vídeo está sendo processado.
        </p>

        <section aria-labelledby="purpose-heading" className="mt-10">
          <h2
            id="purpose-heading"
            className="text-lg font-medium text-zinc-100"
          >
            Finalidade planejada
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-300">
            O objetivo é detectar, quando os recursos forem implementados:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-zinc-300">
            <li>presença do rosto;</li>
            <li>estado geral de observação;</li>
            <li>piscadas, quando o motor apropriado estiver disponível.</li>
          </ul>
        </section>

        <section aria-labelledby="processing-heading" className="mt-10">
          <h2
            id="processing-heading"
            className="text-lg font-medium text-zinc-100"
          >
            Processamento local
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-zinc-300">
            <li>O processamento visual deverá ocorrer no seu dispositivo.</li>
            <li>Os quadros da câmera não deverão ser enviados ao mestre.</li>
            <li>A próxima etapa solicitará a permissão do navegador.</li>
          </ul>
        </section>

        <section aria-labelledby="not-stored-heading" className="mt-10">
          <h2
            id="not-stored-heading"
            className="text-lg font-medium text-zinc-100"
          >
            O que não será armazenado
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-zinc-300">
            <li>vídeo não será gravado;</li>
            <li>capturas de tela não serão realizadas automaticamente;</li>
            <li>quadros da câmera não deverão ser armazenados;</li>
            <li>reconhecimento de identidade não faz parte do projeto;</li>
            <li>
              dados faciais não deverão ser utilizados para identificar pessoas.
            </li>
          </ul>
        </section>

        <section aria-labelledby="future-events-heading" className="mt-10">
          <h2
            id="future-events-heading"
            className="text-lg font-medium text-zinc-100"
          >
            Eventos futuros ao mestre
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-300">
            Em uma fase futura, somente eventos mínimos de jogo poderão ser
            enviados ao mestre, como:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-zinc-300">
            <li>piscada detectada;</li>
            <li>rosto ausente;</li>
            <li>perda de acompanhamento.</li>
          </ul>
          <p className="mt-3 leading-relaxed text-zinc-400">
            Essa transmissão ainda não existe. Não incluirá imagem, vídeo,
            landmarks, medidas faciais ou representação biométrica.
          </p>
        </section>

        <section aria-labelledby="control-heading" className="mt-10">
          <h2
            id="control-heading"
            className="text-lg font-medium text-zinc-100"
          >
            Controle do participante
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-300">
            Nas próximas implementações, você poderá:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-zinc-300">
            <li>negar a permissão de câmera;</li>
            <li>interromper o monitoramento;</li>
            <li>desligar a câmera;</li>
            <li>sair da experiência.</li>
          </ul>
          <p className="mt-3 leading-relaxed text-zinc-400">
            Você pode recusar o consentimento abaixo e voltar ao início a
            qualquer momento.
          </p>
        </section>

        <aside
          aria-labelledby="experimental-heading"
          className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <h2
            id="experimental-heading"
            className="text-base font-medium text-zinc-200"
          >
            Observação experimental
          </h2>
          <p className="mt-2 leading-relaxed text-zinc-400">
            O Blinkwatch é experimental. Iluminação e posicionamento poderão
            afetar a detecção futura. Os eventos detectados servirão apenas como
            apoio à narrativa — o mestre continuará responsável pelas
            consequências no RPG.
          </p>
        </aside>

        <CameraConsentForm />
      </div>
    </main>
  );
}
