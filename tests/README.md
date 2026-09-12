# Testes do Blinkwatch

Os testes automatizados usam **Vitest** e **React Testing Library**. Eles não acessam câmera física, permissão real do navegador, vídeo real, internet nem serviços externos.

## Como executar

```bash
npm test          # uma execução (usado no CI)
npm run test:watch
```

A configuração está em [`vitest.config.mts`](../vitest.config.mts). O ambiente é `jsdom`. O setup em [`vitest.setup.ts`](../vitest.setup.ts) registra os matchers do jest-dom, faz o polyfill de `srcObject`/`MediaStream` e chama `cleanup()` da React Testing Library após cada teste.

## Onde colocar cada tipo de teste

### Próximo da feature

Testes de uma funcionalidade vertical ficam junto do módulo, por exemplo:

```
src/features/camera/components/CameraPreview.test.tsx
src/features/camera/errors/camera-error.test.ts
```

### Próximo do código testado

Regras puras podem ficar ao lado do arquivo:

```
src/features/camera/status/camera-status.test.ts
```

### Em `tests/mocks/`

Factories compartilhadas das APIs de mídia do navegador. Representam apenas o contrato usado pelo Blinkwatch (`getUserMedia`, `enumerateDevices`, tracks, `play()`, contexto seguro).

### Em `tests/integration/` ou `tests/e2e/`

Ainda não há suítes nesses diretórios. Jornadas E2E (Playwright ou equivalente) permanecem fora desta etapa.

## Convenções de nomenclatura

| Tipo       | Sufixo      | Exemplo                  |
| ---------- | ----------- | ------------------------ |
| Unitário   | `.test.ts`  | `camera-error.test.ts`   |
| Componente | `.test.tsx` | `CameraPreview.test.tsx` |
| E2E        | `.spec.ts`  | _(não instalado)_        |

O Vitest inclui somente `**/*.test.ts` e `**/*.test.tsx`.

O módulo de câmera e o adaptador MediaPipe usam Vitest e React Testing Library. Os testes de visão mockam `FilesetResolver` e `FaceLandmarker.createFromOptions`; eles não carregam o modelo real nem executam WASM.

## Módulo de câmera

Os testes atuais cobrem o estado inicial, ativação explícita, constraints sem áudio, permissão aceita ou negada, API ausente, contexto inseguro, prévia local, pausa, retomada, reinício, encerramento, cleanup na desmontagem, respostas tardias, troca de câmera, falha de troca, enumeração, desconexão da track, indicador de estado, espelhamento e estado inicial determinístico (sem hidratação dependente de `navigator`).

Páginas App Router assíncronas (Server Components) não são renderizadas pelo Vitest. A página `/play/camera` é um Server Component de composição; o comportamento testado é o de `CameraPreview` e dos módulos puros da feature.

## Limitações do ambiente

- jsdom não implementa `HTMLMediaElement.srcObject` nem `MediaStream`; os testes usam polyfills locais.
- `HTMLMediaElement.play()` é simulado.
- Mocks representam o contrato usado pelo Blinkwatch, não o navegador completo.
- Workers do Vitest usam o pool `threads` (o pool `forks` pode falhar ao iniciar no Windows).
