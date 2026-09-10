# Tratamento de erros da câmera

Este documento descreve a camada de classificação, apresentação e recuperação de falhas relacionadas à câmera no Blinkwatch.

**Última revisão:** 2026-09-10

## Purpose

Garantir que problemas de câmera não deixem a interface travada, inconsistente ou sem orientação ao participante. Erros são classificados localmente, apresentados em português brasileiro e nunca enviados a serviços externos.

Implementação principal:

- `src/features/camera/errors/camera-error.ts` — classificação e mensagens
- `src/features/camera/components/CameraErrorMessage.tsx` — apresentação acessível
- `src/features/camera/components/CameraPreview.tsx` — integração com o fluxo da câmera

## Internal error codes

| Código                      | Descrição                                     |
| --------------------------- | --------------------------------------------- |
| `unsupported`               | API `getUserMedia` indisponível               |
| `insecure-context`          | Contexto não seguro (sem HTTPS/localhost)     |
| `permission-denied`         | Permissão recusada ou indisponível            |
| `permission-blocked`        | Permissão bloqueada nas configurações         |
| `device-not-found`          | Nenhuma câmera compatível                     |
| `device-busy`               | Câmera ocupada ou ilegível                    |
| `constraints-not-supported` | Configuração incompatível                     |
| `request-aborted`           | Operação interrompida                         |
| `inactive-document`         | Documento/aba inativa                         |
| `device-disconnected`       | Dispositivo removido inesperadamente          |
| `enumeration-failed`        | Falha ao listar dispositivos                  |
| `switch-failed`             | Falha na troca com stream anterior preservado |
| `playback-failed`           | Stream obtido, mas prévia não reproduziu      |
| `unknown`                   | Erro não classificado                         |

## Mapped browser errors

A classificação prioriza `error.name` de `DOMException` quando disponível. Mensagens brutas do navegador **não** são exibidas ao participante.

| `DOMException.name`    | Código interno                                 | Observações                                                    |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `NotAllowedError`      | `permission-denied` ou `permission-blocked`    | Depende de `isSecureContext`, API disponível e Permissions API |
| `NotFoundError`        | `device-not-found`                             |                                                                |
| `NotReadableError`     | `device-busy`                                  | Linguagem cautelosa (“pode estar”)                             |
| `OverconstrainedError` | `constraints-not-supported`                    | Constraint e `deviceId` não são expostos                       |
| `AbortError`           | `request-aborted`                              |                                                                |
| `InvalidStateError`    | `inactive-document`                            |                                                                |
| `SecurityError`        | `insecure-context` ou `permission-denied`      | Conforme causa detectável                                      |
| `TypeError`            | `unknown`, `insecure-context` ou `unsupported` | Conforme contexto; registrado apenas em desenvolvimento        |
| Outros / não-DOM       | `unknown`                                      | Valores `unknown` tratados com type guards                     |

## Recovery behavior

| Situação                 | Comportamento                                                                  |
| ------------------------ | ------------------------------------------------------------------------------ |
| Ativação inicial falha   | Sai de `requesting`; exibe erro; permite retry quando aplicável                |
| Contexto inseguro        | Não chama `getUserMedia`; orienta HTTPS/localhost                              |
| API indisponível         | Não chama `getUserMedia`; sem retry automático                                 |
| Permissão bloqueada      | Orienta configurações do site; retry manual desabilitado até alteração externa |
| Falha de enumeração      | Prévia permanece; aviso `warning`; botão “Atualizar câmeras”                   |
| Falha de troca           | Stream anterior preservado quando `readyState === 'live'`; seleção restaurada  |
| Dispositivo desconectado | Limpa stream, prévia e dispositivo ativo; permite nova ativação                |
| Falha de reprodução      | Encerra stream parcial; permite nova tentativa                                 |
| Solicitação pendente     | Permanece em `requesting`; mensagem “Aguardando sua decisão no navegador”      |

## Retry policy

- Retry **somente** por ação explícita do participante.
- Sem temporizadores, loops ou recarga de página.
- `canRetry: true` para falhas recuperáveis (ocupada, abortada, desconexão, enumeração, troca, reprodução, desconhecido).
- `canRetry: false` para contexto inseguro, API indisponível e permissão comprovadamente bloqueada.
- Nova tentativa invalida operações obsoletas via contador de geração.

## Secure context behavior

Antes de `getUserMedia`, verifica-se `window.isSecureContext`. Se falso:

- classifica como `insecure-context`;
- não solicita câmera;
- não oferece retry enquanto a origem permanecer insegura;
- permite voltar ao fluxo de consentimento.

## Permissions API limitations

A Permissions API é usada apenas como melhoria progressiva:

- consulta `navigator.permissions.query({ name: 'camera' })` quando suportada;
- falhas ou ausência de suporte não interrompem o fluxo;
- `denied` pode elevar `NotAllowedError` para `permission-blocked`;
- não solicita permissão, não faz polling e não persiste estado.

Suporte a `camera` como `PermissionName` varia entre navegadores; falhas são ignoradas silenciosamente.

## Stream preservation rules

- **Troca de câmera:** novo stream é solicitado antes de encerrar o anterior; falha preserva o stream anterior se a track principal ainda estiver `live`.
- **Enumeração:** falha não interrompe tracks ativas.
- **Streams parciais:** encerrados com `track.stop()` quando a operação não é concluída.
- **Respostas obsoletas:** descartadas por geração de operação e flag `isMounted`.

## Cleanup rules

- `track.stop()` em desligamento manual, desmontagem e streams obsoletos.
- `video.srcObject = null` ao encerrar.
- Listener `ended` removido no cleanup e antes de substituir tracks.
- Flag `isManualStopRef` evita tratar stop deliberado como desconexão.

## Device disconnection behavior

Quando a track principal emite `ended` sem stop manual:

1. classifica como `device-disconnected`;
2. encerra referências e limpa prévia;
3. invalida dispositivo ativo;
4. atualiza lista quando possível;
5. retorna ao estado seguro (`idle` com erro);
6. **não** troca automaticamente para outra câmera.

## Accessibility behavior

- Mensagens em texto com título, descrição e orientação.
- `role="alert"` para falhas que interrompem a experiência (`severity: error` sem stream ativo).
- `aria-live="polite"` para avisos recuperáveis (`warning` e erros com stream ativo).
- Ações nomeadas e operáveis por teclado com foco visível.
- Informação não depende apenas de cor (bordas e títulos diferenciados por severidade).

## Privacy restrictions

- Nenhum erro, código, permissão ou dado de dispositivo é enviado ao servidor.
- Nenhuma telemetria, analytics ou persistência local.
- Logs de desenvolvimento registram apenas código interno e `error.name`, nunca `deviceId`, labels ou streams.

## Browser compatibility limitations

- Nomes e classes de exceção podem variar; a classificação não assume uniformidade total.
- Permissions API para `camera` não é universal (ex.: Safari tem suporte limitado).
- `devicechange` pode estar ausente; botão manual de atualização complementa.
- Labels de dispositivo podem permanecer genéricas até permissão concedida.

## Troubleshooting

| Sintoma                                   | Verificação                                                           |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Botão “Iniciar câmera” ausente            | Pode ser contexto inseguro ou API indisponível — ver mensagem exibida |
| Permissão negada sem retry                | Pode ser `permission-blocked` — revisar configurações do site         |
| Prévia some após desconectar USB          | Comportamento esperado (`device-disconnected`)                        |
| Lista de câmeras vazia com prévia ativa   | Falha de enumeração — usar “Atualizar câmeras”                        |
| Interface presa em “Aguardando permissão” | Responder ao prompt do navegador ou sair da rota                      |

## Future testing requirements

Quando um runner de testes for instalado:

- testes unitários para `classifyUnknownError`, `classifyDomExceptionName` e `createCameraPresentationError`;
- mocks de `DOMException` com diferentes `name`;
- mocks de Permissions API (`granted`, `denied`, rejeição);
- verificação de `canRetry` por código;
- testes de integração para preservação de stream em falha de troca (sem câmera real).

## Fontes consultadas

- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: DOMException](https://developer.mozilla.org/en-US/docs/Web/API/DOMException)
- [MDN: MediaStreamTrack](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack)
- [MDN: MediaStreamTrack.ended event](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/ended_event)
- [MDN: MediaDevices.enumerateDevices()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices)
- [MDN: devicechange event](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/devicechange_event)
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
- [Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
