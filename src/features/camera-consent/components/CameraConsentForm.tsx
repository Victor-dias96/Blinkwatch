'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';

const CONSENT_CHECKBOX_ID = 'camera-consent';

export function CameraConsentForm() {
  const router = useRouter();
  const [hasConsented, setHasConsented] = useState(false);

  function handleContinue() {
    if (!hasConsented) {
      return;
    }

    router.push('/play/camera');
  }

  return (
    <form
      className="mt-10 space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleContinue();
      }}
    >
      <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <Checkbox
          id={CONSENT_CHECKBOX_ID}
          checked={hasConsented}
          onCheckedChange={(checked) => setHasConsented(checked === true)}
          aria-describedby="camera-consent-description"
        />
        <div className="space-y-1">
          <Label
            htmlFor={CONSENT_CHECKBOX_ID}
            className="cursor-pointer leading-relaxed font-normal text-zinc-200"
          >
            Li as informações acima e quero continuar para a etapa de ativação
            da câmera.
          </Label>
          <p
            id="camera-consent-description"
            className="text-sm leading-relaxed text-zinc-400"
          >
            Marcar esta opção indica que você compreendeu as informações e
            deseja avançar. A câmera ainda não será ativada nesta etapa.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={!hasConsented}
          size="lg"
          className="min-h-11 w-full sm:w-auto"
        >
          Continuar
        </Button>

        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:ring-3 focus-visible:ring-zinc-400/50 focus-visible:outline-none sm:w-auto"
        >
          Cancelar e voltar
        </Link>
      </div>
    </form>
  );
}
