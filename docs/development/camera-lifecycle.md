# Encerramento seguro da câmera

Este documento descreve a propriedade do `MediaStream`, a função central de liberação e as proteções contra operações assíncronas obsoletas em `/play/camera`.

**Última revisão:** 2026-09-10

## Purpose

Garantir que nenhum recurso da câmera permaneça ativo depois de encerramento manual, desmontagem, navegação, troca, reinício, falha ou resposta tardia de `getUserMedia` / `enumerateDevices`.

Implementação principal:

- `src/features/camera/components/CameraPreview.tsx` — único controlador do stream
- `src/features/camera/services/camera-stream.ts` — `releaseMediaStream` (utilitário puro)

Componentes de apresentação (`CameraStatus`, `CameraControls`, `CameraDeviceSelect`, `CameraMirrorControl`) **não** possuem nem encerram o stream.

## Stream ownership

| Papel                       | Onde vive                                      |
| --------------------------- | ---------------------------------------------- |
| Criação                     | `getUserMedia` via `requestVideoStream*`       |
| Referência mutável do ativo | `streamRef` no controlador                     |
| Stream ainda não adotado    | `pendingStreamRef`                             |
| Associação à prévia         | `video.srcObject` (somente o stream adotado)   |
| Encerramento                | `releaseMediaStream` / `releaseAllCameraMedia` |
| Estado técnico React        | `cameraState.status` — não guarda o stream     |

Há uma única autoridade: `CameraPreview`. O objeto `MediaStream` permanece em refs; o estado React descreve o ciclo (`idle`, `requesting`, `active`, `paused`, …) e não é a referência responsável pelo recurso externo.

## Central release function

`releaseMediaStream(stream, options)`:

1. Aceita `stream === null` (no-op).
2. Obtém todas as tracks com `getTracks()`.
3. Remove o listener `ended` informado, quando houver.
4. Executa `track.stop()` em cada track conhecida.
5. **Não** espera o evento `ended` — `stop()` define `readyState === "ended"` e, pela especificação, **não** dispara `ended`.
6. Limpa `video.srcObject` **somente** quando ainda aponta para o stream encerrado.
7. Não atualiza estado React.
8. Não inicia outro stream.
9. Não classifica desconexão.

`releaseStream` (controlador) ainda limpa `streamRef` / `pendingStreamRef` **somente** quando apontam para o stream encerrado.

`releaseAllCameraMedia` é o encerramento definitivo: reúne stream ativo, pendente e o de `srcObject`, chama `releaseMediaStream` em cada um, força `srcObject = null` e zera as refs. É idempotente — uma segunda chamada não lança erro, não emite alerta e não inicia câmera.

`stopActiveStream` combina a liberação definitiva com a limpeza dos flags de track **se o componente ainda estiver montado**.

## Difference between explicit stop and unexpected `ended`

| Causa                                     | Evento `ended` | Tratamento                                     |
| ----------------------------------------- | -------------- | ---------------------------------------------- |
| `track.stop()` (encerrar, unmount, troca) | Não dispara    | `isManualStopRef`; listeners já removidos      |
| Dispositivo removido / permissão revogada | Dispara        | `device-disconnected`; libera e volta a `idle` |
| Pausa (`enabled = false`)                 | Não dispara    | Stream permanece `live`                        |

Listeners `mute` / `unmute` **não** são registrados. `MediaStreamTrack.muted` indica interrupção técnica temporária e não é tratado como desconexão nem como pausa da aplicação.

## Invalidation of async work

- `operationGenerationRef` incrementa em iniciar, trocar, reiniciar, encerrar, desconexão e desmontagem.
- `canApplyOperationResult(generation)` exige componente montado **e** geração atual.
- Após cada `await` relevante (`getUserMedia`, `play()`, `enumerateDevices`, classificação de erro), o resultado é descartado se estiver obsoleto.
- Stream tardio recebe `releaseMediaStream` e **não** é associado ao vídeo se outro stream já estiver lá.
- Enumeração tardia não restaura lista, não marca desconexão e não altera estado após `idle`.

`pendingStreamRef` guarda o `MediaStream` assim que `getUserMedia` resolve, para que o cleanup de desmontagem possa encerrar um stream que ainda não foi adotado em `streamRef`.

## Lifecycle map

```
idle ──(Iniciar)──► requesting ──► active
                      │                ├── pausar ──► paused ──► retomar ──► active
                      │                ├── reiniciar ──► restarting ──► active
                      │                ├── trocar ──► switching ──► active
                      │                └── encerrar / unmount / navegação ──► idle
                      └── falha ──► denied | unavailable | error
                                    (stream parcial encerrado)

Qualquer estado com mídia ──(desmontar rota)──► tracks stopped, srcObject null
```

O efeito de montagem **não** chama `getUserMedia`. Encerrar ou sair da rota **não** reagenda uma nova solicitação.

## Cleanup by scenario

| Cenário                                    | Comportamento                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| Encerrar câmera                            | Invalida geração; `releaseAllCameraMedia`; `idle`; status **Câmera desligada** |
| Desmontagem / navegação                    | Mesma liberação; sem `setState`; sem falso `device-disconnected`               |
| Strict Mode (setup → cleanup → setup)      | Cleanup idempotente; remount começa sem stream e **sem** auto-start            |
| Troca bem-sucedida                         | Novo stream associado; anterior `stop()`; `srcObject` do novo preservado       |
| Troca obsoleta / falha de play             | Novo stream encerrado por identidade; anterior restaurado se ainda `live`      |
| Reinício                                   | Stream anterior encerrado de fato; novo `getUserMedia`; fallback uma vez       |
| Falha de `getUserMedia` / áudio inesperado | Stream obtido é encerrado; estado de erro classificado                         |
| Falha de `play()`                          | Stream encerrado; `srcObject` limpo se ainda for esse stream                   |
| `enumerateDevices` tardio                  | Ignorado se a geração mudou                                                    |
| Dispositivo removido                       | Somente se `ended` não for stop manual                                         |

## Pause is not release

Pausar define `track.enabled = false` e **não** chama `stop()`. O stream permanece em memória até **Retomar**, **Encerrar**, **Reiniciar** ou sair da rota. Sair da rota encerra também o stream pausado.

## Idempotence

Encerrar duas vezes (botão + cleanup + Strict Mode) é seguro:

- `track.stop()` em track já `ended` é no-op (especificação);
- refs já nulas não são reutilizadas;
- um stream novo não é apagado ao liberar um stream antigo (comparação por identidade);
- nenhum erro de desconexão é emitido para stop intencional.

## Privacy

A liberação apenas chama `stop()` e desassocia o elemento de vídeo. Nenhum frame é capturado, gravado ou enviado. Não há persistência de `deviceId`, labels ou streams.

## Future visual processing

Quando MediaPipe for usado para análise, o encerramento definitivo também deverá cancelar animation frames, workers e loops de análise. Pausa deverá interromper o pipeline sem necessariamente chamar `close()` na task. Nesta issue o Face Landmarker **é descartado** ao encerrar a câmera ou desmontar o controlador, e **permanece carregado** durante pausa, troca de dispositivo e reinício. Nenhum frame é processado.

## Fontes consultadas

- [MDN: MediaStreamTrack.stop()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop)
- [MDN: MediaStreamTrack.readyState](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/readyState)
- [MDN: MediaStreamTrack ended event](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/ended_event)
- [MDN: MediaStream.getTracks()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/getTracks)
- [MDN: HTMLMediaElement.srcObject](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject)
- [W3C Media Capture and Streams](https://w3c.github.io/mediacapture-main/) — `stop()` aborta se já `ended`; `ended` não dispara após `stop()`
- [React: useEffect](https://react.dev/reference/react/useEffect) — cleanup na desmontagem; ciclo extra setup+cleanup no Strict Mode em desenvolvimento
- [React: Strict Mode](https://react.dev/reference/react/StrictMode)
