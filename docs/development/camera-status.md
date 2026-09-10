# Indicador de estado da câmera

Este documento descreve a separação entre estado técnico e apresentação visual do ciclo de vida da câmera no Blinkwatch.

**Última revisão:** 2026-09-10

## Purpose

Permitir que o participante compreenda imediatamente o estado da câmera em `/play/camera` sem depender do indicador nativo do navegador, da presença da prévia, de mensagens técnicas, somente de cores ou de ícones isolados.

Implementação principal:

- `src/features/camera/status/camera-status.ts` — mapeamento tipado (função pura)
- `src/features/camera/components/CameraStatus.tsx` — apresentação acessível
- `src/features/camera/components/CameraPreview.tsx` — fonte da verdade do estado técnico
- `src/features/camera/services/camera-stream.ts` — validação defensiva da track

## Technical state versus presentation state

O **estado técnico** (`CameraStatus` em `camera-state.ts`) descreve o ciclo real da câmera:

| Estado        | Significado                                       |
| ------------- | ------------------------------------------------- |
| `idle`        | Sem stream ativo                                  |
| `requesting`  | `getUserMedia` pendente                           |
| `active`      | Stream com track `live` e `enabled === true`      |
| `paused`      | Stream com track `live` e `enabled === false`     |
| `switching`   | Troca de dispositivo em andamento                 |
| `restarting`  | Reinício com novo stream em andamento             |
| `denied`      | Permissão negada ou bloqueada                     |
| `unavailable` | Contexto inseguro, API ausente ou sem dispositivo |
| `error`       | Falha recuperável ou não classificada             |

O **estado apresentado** (`CameraStatusPresentation`) contém apenas dados de interface:

- `title` — título principal em português
- `description` — descrição curta orientativa
- `tone` — tom visual (`neutral`, `info`, `success`, `warning`, `danger`)
- `icon` — ícone Lucide decorativo
- `animateIcon` — rotação discreta para estados transitórios
- `shouldAnnounce` — se a mudança deve ser anunciada a leitores de tela

Textos da interface **não** são usados como estado interno. A conversão ocorre em `resolveCameraStatusPresentation()`.

## State mapping

Entradas da função pura:

- `status` — estado técnico atual
- `error` — erro classificado (`CameraPresentationError | null`)
- `hasValidActiveTrack` — stream com track `live` e `enabled === true`
- `hasValidPausedTrack` — stream com track `live` e `enabled === false`
- `isRefreshingDevices` — enumeração de dispositivos em andamento

Regras principais:

| Condição                                          | Apresentação                            |
| ------------------------------------------------- | --------------------------------------- |
| `idle` sem erro                                   | Câmera desligada                        |
| `requesting`                                      | Aguardando permissão                    |
| `active` + track válida                           | Câmera ativa                            |
| `paused` + track pausada válida                   | Câmera pausada                          |
| `switching`                                       | Trocando câmera                         |
| `restarting`                                      | Reiniciando câmera                      |
| `active`/`paused` sem track válida                | Deriva para erro ou desligada           |
| `idle` + `device-disconnected`                    | Câmera desconectada                     |
| `denied` ou erro de permissão                     | Permissão necessária                    |
| `unavailable` + `insecure-context`                | Conexão segura necessária               |
| `unavailable` + `unsupported`                     | Câmera não suportada                    |
| `unavailable` / `error` com indisponibilidade     | Câmera indisponível (ou título do erro) |
| Falha recuperável                                 | Título e descrição do erro classificado |
| `isRefreshingDevices` sem stream ativo ou pausado | Atualizando câmeras                     |

**Atualizando câmeras** não substitui `Câmera ativa` quando a prévia continua válida.

## Title and description strategy

- Títulos descrevem o **estado do ciclo**, não ações do participante.
- Descrições são curtas, em linguagem simples e sem códigos técnicos.
- O status **não** afirma detecção facial, piscadas ou análise de dados.
- Erros impeditivos usam categorias gerais no indicador; detalhes e recuperação ficam em `CameraErrorMessage`.
- Falhas recuperáveis reutilizam `title` e `message` do erro classificado no indicador, enquanto `recovery` permanece no componente de erro.

## Status tones

| Tom       | Uso típico                                      |
| --------- | ----------------------------------------------- |
| `neutral` | Desligada                                       |
| `info`    | Aguardando permissão, transitórios, atualização |
| `success` | Câmera ativa                                    |
| `warning` | Pausada, avisos leves                           |
| `danger`  | Permissão, indisponibilidade, desconexão        |

Cor reforça o significado textual; nunca substitui título ou descrição.

## Behavior with active stream warnings

Quando ocorre falha de enumeração, troca ou reinício, mas o stream anterior permanece válido:

- o indicador principal continua **Câmera ativa** (ou **Câmera pausada** quando aplicável);
- o aviso aparece em `CameraErrorMessage` como mensagem secundária;
- controles permanecem coerentes com o estado técnico, não com o texto do indicador.

## Interaction with camera errors

| Responsabilidade       | Componente           |
| ---------------------- | -------------------- |
| Ciclo atual            | `CameraStatus`       |
| Causa, recuperação     | `CameraErrorMessage` |
| Ações de retry/refresh | Controles / erro     |

Não há duplicação de `role="alert"` entre os dois: falhas interruptivas usam alerta somente no componente de erro.

## Interaction with controls

Botões e habilitação continuam derivados do estado técnico (`CameraStatus`) e flags (`canPause`, `canResume`, etc.). Nenhuma lógica compara strings traduzidas do indicador.

## Accessibility behavior

- Título (`h2`) e descrição sempre visíveis.
- Ícones com `aria-hidden="true"`.
- Anúncios via região `aria-live="polite"` oculta (`sr-only`) apenas quando o título muda e `shouldAnnounce` é verdadeiro.
- Estado inicial desligado não dispara anúncio repetido (`shouldAnnounce: false`).
- Foco não é movido a cada transição.
- Animação de ícone respeita `motion-safe:` (desativada com `prefers-reduced-motion`).

## Announcement policy

- Anunciar: permissão pendente, ativa, pausada, troca, reinício, falhas que alteram o título principal.
- Não anunciar: re-renderizações sem mudança de título; estado desligado inicial.
- Não combinar `role="alert"` no indicador com alerta do componente de erro para a mesma mensagem.

## Privacy restrictions

O indicador não exibe:

- `deviceId`, `groupId` ou label completa do dispositivo;
- resolução, frame rate ou dados biométricos;
- erros brutos, `DOMException.name` ou stack traces.

Nenhum estado é persistido ou enviado ao servidor.

## Responsive presentation

O indicador utiliza layout flexível (`flex`, `min-w-0`, ícone `shrink-0`) para telas de 320 px até 1440 px e zoom de 200%. Coexiste com prévia, seletor e controles na coluna principal de `/play/camera`.

## Future test requirements

Quando um runner existir:

- testes unitários para `resolveCameraStatusPresentation` cobrindo cada combinação status/erro/track;
- verificação de que `active` nunca é retornado sem track válida;
- verificação de que avisos com stream ativo não alteram o título principal;
- testes de componente para `aria-live` e ausência de anúncios duplicados.

## Future integration with vision processing

**Visual processing must run only while the camera state is active.**

Quando MediaPipe ou outro pipeline visual for integrado:

- processamento só deve ocorrer com `status === 'active'` e track válida;
- pausa, desligada, transitórios e erros impeditivos interrompem qualquer análise;
- o indicador continuará refletindo apenas o ciclo da câmera, não resultados de detecção.
