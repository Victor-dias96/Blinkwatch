import { Camera, ShieldCheck, VideoOff } from 'lucide-react';

const privacyItems = [
  {
    icon: Camera,
    title: 'Consentimento antes do acesso',
    description:
      'A câmera será utilizada somente após sua autorização explícita.',
  },
  {
    icon: ShieldCheck,
    title: 'Processamento no dispositivo',
    description:
      'O processamento visual está planejado para ocorrer localmente no seu navegador.',
  },
  {
    icon: VideoOff,
    title: 'Nenhuma gravação de vídeo',
    description: 'Nenhum vídeo será gravado ou armazenado pelo Blinkwatch.',
  },
] as const;

export function PrivacySummary() {
  return (
    <section aria-labelledby="privacy-heading" className="w-full max-w-3xl">
      <h2
        id="privacy-heading"
        className="text-center text-sm font-medium tracking-wide text-zinc-400 uppercase"
      >
        Privacidade
      </h2>

      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {privacyItems.map(({ icon: Icon, title, description }) => (
          <li
            key={title}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center sm:text-left"
          >
            <Icon
              aria-hidden="true"
              className="mx-auto mb-3 size-5 text-zinc-400 sm:mx-0"
            />
            <p className="text-sm font-medium text-zinc-200">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
