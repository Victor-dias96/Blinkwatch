'use client';

import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';

const MIRROR_CHECKBOX_ID = 'camera-mirror-preview';

type CameraMirrorControlProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function CameraMirrorControl({
  checked,
  onCheckedChange,
}: CameraMirrorControlProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id={MIRROR_CHECKBOX_ID}
          checked={checked}
          aria-describedby="camera-mirror-description"
          onCheckedChange={(value) => {
            onCheckedChange(value === true);
          }}
        />
        <div className="min-w-0 space-y-1">
          <Label
            htmlFor={MIRROR_CHECKBOX_ID}
            className="cursor-pointer leading-relaxed font-normal text-zinc-200"
          >
            Espelhar prévia
          </Label>
          <p
            id="camera-mirror-description"
            className="text-sm leading-relaxed text-zinc-400"
          >
            Inverte horizontalmente somente a imagem exibida na tela. Isso não
            altera a câmera nem o processamento original.
          </p>
          <p className="text-sm text-zinc-500">
            {checked ? 'Ativado' : 'Desativado'}
          </p>
        </div>
      </div>
    </div>
  );
}
