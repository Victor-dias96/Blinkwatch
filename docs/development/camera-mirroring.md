# Espelhamento visual da prévia da câmera

Este documento descreve o espelhamento horizontal **somente visual** da prévia em `/play/camera`.

**Última revisão:** 2026-09-10

## Purpose

Oferecer uma visualização mais natural para câmeras frontais (semelhante a um espelho), sem alterar o `MediaStream`, a track de vídeo, constraints, dispositivo selecionado, frames originais ou futuras coordenadas de visão computacional.

**Mirroring affects only the preview presentation. It does not transform the source frames or the MediaStream.**

Implementação principal:

- `src/features/camera/components/CameraPreview.tsx` — estado `isMirrored` e classe no `<video>`
- `src/features/camera/components/CameraMirrorControl.tsx` — controle **Espelhar prévia**

## Visual-only behavior

O espelhamento é uma preferência visual local e temporária:

- Aplica-se **somente** ao elemento `<video>` da prévia.
- Não modifica `MediaStream`, tracks, `getUserMedia`, constraints ou `deviceId`.
- Não captura, transforma ou persiste frames.
- Não envia preferência ao servidor.
- Não utiliza canvas, WebGL, filtros ou duplicação de stream.

## Default state

- `isMirrored` inicia como `true` na montagem do componente.
- Justificativa: a ativação inicial da câmera utiliza `facingMode: { ideal: "user" }`, alinhada à experiência típica de câmera frontal espelhada.
- O participante pode desativar imediatamente via **Espelhar prévia**.
- Não há inferência automática por label de dispositivo, user agent ou heurística de câmera frontal/traseira.

## User control

- Controle: checkbox **Espelhar prévia** com label associada (`id` + `htmlFor`).
- Texto auxiliar: inverte horizontalmente somente a imagem exibida na tela; não altera câmera nem processamento original.
- Indicação discreta: **Ativado** / **Desativado** abaixo do controle.
- Visível somente quando a prévia está em reprodução (`active` ou `switching`).
- Oculto durante pausa, idle e encerramento — a preferência permanece em memória local.
- Alteração é imediata; não há animação de transição.

## CSS transformation

- Equivalente a `transform: scaleX(-1)`.
- Classe Tailwind arbitrária: `[transform:scaleX(-1)]`, aplicada somente quando `isMirrored` é `true`.
- A classe `-scale-x-100` não é utilizada: no Tailwind CSS v4 ela define a propriedade `scale`, não `transform: scaleX(-1)`, e não desfazia o espelhamento de forma confiável no elemento `<video>`.
- Quando `isMirrored` é `false`, nenhuma classe de transformação permanece no vídeo.
- Origem padrão do navegador (`transform-origin: 50% 50%`) — centro do elemento.
- `object-cover` da prévia é preservado; recorte preexistente do enquadramento não é alterado nesta issue.

Fontes consultadas:

- [MDN: transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [MDN: scaleX()](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/scaleX)
- [MDN: HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) — transformações CSS afetam apenas a apresentação do elemento, não o conteúdo do stream subjacente

## Preview coordinates versus source coordinates

| Conceito                | Significado                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Source coordinates**  | Frames originais fornecidos pelo stream e pelo elemento `<video>` sem espelhamento CSS    |
| **Preview coordinates** | Coordenadas percebidas na tela após aplicar (ou não) `transform: scaleX(-1)` no `<video>` |

O espelhamento da prévia **não altera** as source coordinates. MediaPipe e overlays futuros devem:

- processar frames originais (source);
- converter explicitamente entre source e preview quando desenhar sobre a prévia espelhada;
- não assumir que os frames foram invertidos pelo navegador;
- tratar esquerda/direita de forma explícita na camada de apresentação.

Nenhuma conversão de coordenadas é implementada nesta issue.

## Behavior during camera switching

- A preferência `isMirrored` é **preservada** ao trocar de dispositivo.
- Não há automatismo baseado em label ou `facingMode`.
- O novo stream é associado ao mesmo `<video>`; apenas a classe CSS reflete a preferência atual.

## Behavior during restart

- Reinício solicita novo stream, mas **preserva** `isMirrored` (não redefine ao padrão).
- O stream resultante não é transformado internamente — somente a apresentação CSS continua espelhada ou não conforme a preferência.

## Behavior during pause

- `isMirrored` permanece no estado React local.
- O controle **Espelhar prévia** fica oculto (prévia não visível).
- O placeholder **Câmera pausada** não é espelhado.
- Nenhum frame congelado é capturado para representar a pausa.

## Behavior during resume

- Ao retomar, a prévia reaparece com a mesma preferência de espelhamento.
- Nenhuma nova permissão ou `getUserMedia` é necessária para restaurar o efeito visual.

## Behavior after stopping

- Encerrar libera stream e tracks conforme [`camera-lifecycle.md`](camera-lifecycle.md).
- `isMirrored` permanece em memória enquanto o participante permanece em `/play/camera`.
- Iniciar novamente reutiliza a preferência atual (sem reset ao padrão).
- Ao sair da rota, o componente desmonta e `isMirrored` volta a `true` na próxima visita.

## Absence of persistence

A preferência **não** é armazenada em:

- URL ou query string;
- cookies;
- `localStorage`;
- `sessionStorage`;
- servidor ou analytics.

## Accessibility

- Checkbox com label visível **Espelhar prévia**.
- Estado refletido em `checked` e texto **Ativado** / **Desativado**.
- Foco visível herdado dos estilos do Checkbox (shadcn/base-ui).
- Operação por teclado (Space / Enter no checkbox).
- Foco não é movido após alteração.
- Texto não depende de ícone.

## Privacy

O espelhamento não captura frames, não grava imagem, não utiliza canvas, não transmite preferência nem stream, e não analisa rosto. Nenhum dado sai do navegador por causa desta funcionalidade.

## Future MediaPipe integration

Quando MediaPipe for integrado:

- o modelo deve receber frames originais (source coordinates);
- pausa e encerramento continuam interrompendo processamento;
- overlays visuais devem aplicar conversão preview ↔ source quando a prévia estiver espelhada;
- a preferência visual não deve alterar a lógica de detecção.

## Future overlay coordinate considerations

Overlays desenhados sobre a prévia espelhada precisarão inverter horizontalmente posições X relativas ao centro da prévia, ou desenhar sobre uma camada não espelhada alinhada ao vídeo. Essa conversão é responsabilidade de uma issue futura.

## Limitations

- Espelhamento não é inferido automaticamente para câmeras traseiras — o participante ajusta manualmente.
- Indicador de estado da câmera (`CameraStatus`) continua representando o ciclo técnico, não a preferência de espelhamento.
- Durante pausa, o controle fica indisponível (oculto), embora a preferência seja preservada.
- `object-cover` pode recortar bordas da imagem; isso é comportamento preexistente da prévia, independente do espelhamento.
