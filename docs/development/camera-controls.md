# Controles de ciclo de vida da câmera

Este documento descreve os controles de iniciar, pausar, retomar, reiniciar e encerrar a câmera no Blinkwatch.

**Última revisão:** 2026-09-10

## Purpose

Permitir que o participante controle com clareza o ciclo de vida da câmera em `/play/camera`, mantendo estados consistentes, liberando recursos corretamente e preparando o caminho para processamento visual futuro — que deverá respeitar o estado pausado.

Implementação principal:

- `src/features/camera/components/CameraPreview.tsx` — controlador (stream, vídeo, operações assíncronas)
- `src/features/camera/components/CameraControls.tsx` — apresentação das ações
- `src/features/camera/services/camera-stream.ts` — helpers de track (`enabled`) e `releaseMediaStream`
- `src/features/camera/types/camera-state.ts` — estados da câmera

## Camera lifecycle

Estados principais:

| Estado        | Descrição                                               |
| ------------- | ------------------------------------------------------- |
| `idle`        | Nenhum stream ativo                                     |
| `requesting`  | Aguardando resposta do navegador a `getUserMedia`       |
| `active`      | Stream ativo com track `live` e `enabled === true`      |
| `paused`      | Stream existente com track `live` e `enabled === false` |
| `restarting`  | Stream anterior encerrado; novo stream sendo solicitado |
| `switching`   | Troca de dispositivo em andamento                       |
| `denied`      | Permissão negada ou bloqueada                           |
| `unavailable` | Contexto inseguro, API indisponível ou sem dispositivo  |
| `error`       | Falha recuperável ou desconhecida                       |

Pausar e retomar são operações **síncronas** — não há estados transitórios `pausing` ou `resuming`.

## Start behavior

- Ação: **Iniciar câmera**
- Disponível somente em `idle` (sem stream ativo)
- Verifica contexto seguro e suporte à API antes de solicitar
- Invalida operações anteriores via contador de geração
- Solicita **somente vídeo** (`audio: false`)
- Usa câmera selecionada quando houver; caso contrário, câmera padrão
- Durante a solicitação: estado `requesting`, ações incompatíveis desabilitadas

## Pause semantics

- Ação: **Pausar** (somente em `active`)
- Define `track.enabled = false` na track de vídeo principal
- **Não** chama `track.stop()` nem `getUserMedia`
- Track permanece com `readyState === "live"`
- Stream e referências são preservados
- Prévia ocultada e substituída por placeholder neutro **Câmera pausada**
- Nenhum frame congelado, canvas ou captura de imagem
- Seletor de dispositivo **desabilitado** — é necessário retomar antes de trocar
- Pausa **não** é automática (sem pausa por inatividade, perda de foco ou mudança de aba)

### Limitação importante

Pausar interrompe a prévia e o uso da imagem pela aplicação, mas **não equivale a encerrar**. O stream continua em memória. Em alguns navegadores ou dispositivos, o indicador físico da câmera pode permanecer aceso mesmo com `enabled = false`; isso não é garantido nem prometido pela interface.

## Resume semantics

- Ação: **Retomar** (somente em `paused`)
- Define `track.enabled = true` na track existente
- **Não** chama `getUserMedia`
- Prévia restaurada quando a track continua `live`
- Se a track tiver `readyState === "ended"` (desconexão durante pausa): limpa stream, informa indisponibilidade, retorna a `idle`

## Restart semantics

- Ação: **Reiniciar** (em `active` ou `paused`)
- Encerra completamente o stream atual (`track.stop()`, `video.srcObject = null`)
- Marca encerramento como intencional (`isManualStopRef`) para não classificar `ended` como desconexão
- Solicita novo stream para o dispositivo selecionado em memória
- Fallback: se o dispositivo não estiver disponível, **uma única** tentativa com câmera padrão e aviso ao participante
- Termina em `active` (mesmo quando iniciado a partir de `paused`)
- Mantém `audio: false`
- Falha durante reinício: limpa referências, apresenta erro classificado, sai de `restarting`

## Stop semantics

- Ação: **Encerrar câmera** (em `active` ou `paused`)
- Invalida operações pendentes
- `releaseAllCameraMedia`: `track.stop()` em todas as tracks conhecidas (ativo, pendente e `srcObject`)
- Limpa `video.srcObject` e referências ao stream
- Limpa dispositivo ativo e estados transitórios
- Retorna a `idle` — o indicador mostra **Câmera desligada**
- Não inicia nova solicitação automaticamente
- Idempotente — executar sem stream ou repetir o cleanup não lança erro nem emite desconexão

## Difference between `enabled`, `muted`, `readyState` and `stop`

| Propriedade / método | Papel no Blinkwatch                                                             |
| -------------------- | ------------------------------------------------------------------------------- |
| `track.enabled`      | Controle da aplicação para pausar/retomar temporariamente                       |
| `track.muted`        | Somente leitura; indica interrupção técnica externa — **não** usado como pausa  |
| `track.readyState`   | `"live"` = track utilizável; `"ended"` = encerrada, não retomável por `enabled` |
| `track.stop()`       | Encerramento definitivo; exige novo `getUserMedia` para reativar                |

O atributo `muted` do elemento `<video>` permanece correto e **não** deve ser confundido com `MediaStreamTrack.muted`.

Fontes consultadas:

- [MDN: MediaStreamTrack.enabled](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/enabled)
- [MDN: MediaStreamTrack.muted](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/muted)
- [MDN: MediaStreamTrack.readyState](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/readyState)
- [MDN: MediaStreamTrack.stop()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop)
- [MDN: MediaStreamTrack ended event](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/ended_event)
- [MDN: MediaStream.getVideoTracks()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/getVideoTracks)
- [W3C Media Capture and Streams](https://w3c.github.io/mediacapture-main/getusermedia.html)

## State transitions

```
idle ──(Iniciar)──► requesting ──(sucesso)──► active
                      │                         │
                      │                         ├──(Pausar)──► paused ──(Retomar)──► active
                      │                         │                │
                      │                         │                └──(Reiniciar)──► restarting ──► active
                      │                         ├──(Reiniciar)──► restarting ──► active
                      │                         └──(Encerrar)──► idle
                      └──(falha)──► denied | unavailable | error

paused ──(Encerrar)──► idle
active ──(Encerrar)──► idle
restarting ──(falha)──► error | unavailable | denied
```

## Allowed controls by state

| Estado       | Controles disponíveis                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| `idle`       | Iniciar câmera, Voltar ao consentimento, Retry (se erro)                        |
| `requesting` | Aguardando permissão (ações principais desabilitadas)                           |
| `active`     | Pausar, Reiniciar, Encerrar câmera, seletor de dispositivo, **Espelhar prévia** |
| `paused`     | Retomar, Reiniciar, Encerrar câmera (seletor e espelhamento ocultos)            |
| `restarting` | Reiniciando câmera (controles incompatíveis desabilitados)                      |
| `switching`  | Trocando câmera (controles incompatíveis desabilitados)                         |

## Concurrency protection

- Contador de geração (`operationGenerationRef`) invalida operações obsoletas
- Refs `isRequestingRef`, `isSwitchingRef`, `isRestartingRef` impedem operações simultâneas incompatíveis
- Streams tardios são liberados por identidade (`releaseMediaStream`) e não substituem um `srcObject` mais novo
- `pendingStreamRef` permite encerrar um `getUserMedia` que resolveu após desmontar
- Encerramento incrementa a geração e limpa flags transitórias
- Detalhes em [`camera-lifecycle.md`](camera-lifecycle.md)

## Stream cleanup

- Encerramento definitivo usa `releaseAllCameraMedia` (ativo + pendente + `srcObject`)
- Desmontagem da rota e navegação encerram streams **ativos e pausados** sem `setState` e sem falso `device-disconnected`
- Pausa **não** preserva stream entre páginas
- `releaseMediaStream` chama `track.stop()` em `getTracks()` e limpa `srcObject` só quando aponta para o stream encerrado
- Listeners `ended` removidos antes de `stop()`; o cleanup é idempotente (botão + unmount + Strict Mode)
- O efeito de montagem **não** inicia a câmera
- Detalhes em [`camera-lifecycle.md`](camera-lifecycle.md)

## Interaction with device selection

- Seletor disponível em `active` e `switching`
- **Desabilitado** em `paused` — mensagem orienta retomar antes de trocar
- Reinício preserva `deviceId` selecionado quando ainda disponível

## Interaction with camera errors

- Erros classificados conforme [`camera-errors.md`](camera-errors.md)
- `ended` intencional (stop manual, reinício, troca) ignorado via `isManualStopRef`
- `ended` durante pausa indica perda do dispositivo, não comportamento normal da pausa
- Falha no reinício não deixa estado preso em `restarting`

## Privacy behavior

- Nenhum frame extraído, congelado ou transmitido
- Nenhum dado persistido (localStorage, sessionStorage, cookies)
- Nenhuma telemetria
- Processamento visual futuro deverá **parar** quando a câmera estiver pausada

## Accessibility behavior

- Botões reais com textos visíveis e ícones decorativos (`aria-hidden="true"`)
- Estado anunciado com `aria-live="polite"`
- Placeholder de pausa com texto visível
- Ações separadas para Pausar e Retomar (sem `aria-pressed` alternável)
- Foco visível e ordem de tabulação lógica

## Browser limitations

- `enabled = false` produz frames pretos na track, mas a interface **oculta** o vídeo em vez de depender disso
- Indicador físico da câmera pode ou não desligar com `enabled = false` (varia por SO/navegador)
- `track.stop()` não dispara evento `ended` (comportamento documentado no MDN)
- Permissões e labels de dispositivo variam entre navegadores

## Mirror preview control

- Controle **Espelhar prévia** (`CameraMirrorControl`) — checkbox acessível que alterna espelhamento horizontal **somente visual** da prévia.
- Disponível em `active` e `switching`; oculto em pausa e quando a câmera está desligada.
- Não chama `getUserMedia`, não reinicia tracks e não persiste preferência.
- Detalhes completos em [`camera-mirroring.md`](camera-mirroring.md).

## Future integration with visual processing

Quando MediaPipe ou outro processamento visual for integrado:

- Loops de análise deverão verificar `cameraState.status === 'active'` antes de processar frames
- Pausa deverá interromper completamente qualquer pipeline visual
- Encerramento deverá liberar workers e cancelar animation frames
- Nenhuma detecção deverá ocorrer em `paused`, `idle` ou durante `restarting`
