# Estado do projeto

Este documento registra o que foi entregue em cada milestone e o que permanece fora de escopo. Ele complementa o [`README.md`](../README.md) com detalhes verificáveis contra o repositório.

**Última revisão:** 2026-09-10

## Milestone 1 — Fundação (concluída)

### Objetivo

Estabelecer a base técnica, de qualidade, de agentes e de integração contínua para que funcionalidades de produto possam ser implementadas de forma incremental, sem abstrações prematuras e com regras claras de privacidade.

### Entregue

| Área                  | Itens principais                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Aplicação             | Next.js (App Router), layout raiz, metadados, estilos globais (Tailwind CSS), utilitário `cn`, validação tipada de ambiente (Zod) |
| Qualidade e Git       | TypeScript (strict), ESLint, Prettier, Husky, lint-staged, Commitlint                                                             |
| UI                    | Tailwind CSS, shadcn/ui inicializado, Lucide React                                                                                |
| Arquitetura e agentes | Documentação modular, `AGENTS.md` (raiz e contextuais), Agent Skills, estratégia MCP                                              |
| CI                    | Workflow GitHub Actions, documentação de CI                                                                                       |
| Documentação          | README, índice de docs, variáveis de ambiente, placeholder de testes                                                              |

## Milestone 2 — Câmera e prova de conceito visual (em andamento)

### Objetivo

Introduzir a experiência pública do jogador e preparar o caminho para configuração da câmera, mantendo processamento visual local e sem transmitir dados faciais brutos.

### Entregue nesta fase

| Item                             | Estado       | Referência                                                    |
| -------------------------------- | ------------ | ------------------------------------------------------------- |
| Tela inicial pública             | Implementado | `src/app/page.tsx`, `src/features/landing/`                   |
| Navegação para preparação        | Implementado | Ação principal em `/` → `/play/setup`                         |
| Fluxo de consentimento           | Implementado | `src/app/play/setup/page.tsx`, `src/features/camera-consent/` |
| Rota de câmera com prévia local  | Implementado | `src/app/play/camera/page.tsx`, `src/features/camera/`        |
| Seleção de dispositivo de câmera | Implementado | `src/features/camera/components/CameraDeviceSelect.tsx`       |
| Controles de ciclo de vida       | Implementado | `src/features/camera/components/CameraControls.tsx`           |
| Tratamento de erros da câmera    | Implementado | `src/features/camera/errors/camera-error.ts`                  |
| Componente Button (shadcn/ui)    | Implementado | `src/shared/components/ui/button.tsx`                         |
| Componentes Checkbox e Label     | Implementado | `src/shared/components/ui/checkbox.tsx`, `label.tsx`          |

O consentimento exige uma ação explícita (checkbox) antes de avançar para `/play/camera`. **Não é persistido** — recarregar `/play/setup` reinicia o estado.

O acesso inicial à câmera em `/play/camera` utiliza `getUserMedia` **somente após** o participante selecionar **Iniciar câmera**. A solicitação pede **apenas vídeo** (`audio: false`); a prévia é exibida localmente via `HTMLVideoElement`. Os controles de ciclo de vida permitem **pausar** (`track.enabled = false`), **retomar** (reutilizando o stream existente), **reiniciar** (novo `getUserMedia` preservando dispositivo quando possível) e **encerrar** (`track.stop()`). Pausar não equivale a encerrar — o stream permanece em memória até retomar ou encerrar. Todas as tracks recebem `stop()` no encerramento manual e no cleanup ao sair da rota (incluindo streams pausados). A câmera **não** é ativada automaticamente ao carregar a página. O seletor de dispositivo fica **desabilitado** durante pausa.

Após a permissão, o participante pode **enumerar câmeras disponíveis** (`videoinput` apenas), **identificar a câmera ativa** via `MediaStreamTrack.getSettings().deviceId`, **selecionar outro dispositivo** e **trocar o stream** sem recarregar a página. A troca solicita o novo stream antes de encerrar o anterior; falhas preservam a prévia anterior quando possível. O evento `devicechange` atualiza a lista quando suportado. **Nenhum** `deviceId`, label ou preferência de câmera é persistido.

O **tratamento de erros** consolida falhas em códigos internos estáveis com mensagens em português, orientação de recuperação e retry explícito quando adequado. Contexto inseguro e API indisponível são detectados antes de solicitar a câmera. Permissão negada e bloqueada são distinguidas quando a Permissions API permite. Falhas de enumeração exibem aviso sem interromper a prévia. Falhas de troca preservam o stream anterior quando a track permanece `live`. Desconexão inesperada de dispositivo é detectada via evento `ended` da track. Detalhes técnicos sensíveis não são exibidos nem enviados externamente. Ver [`development/camera-errors.md`](development/camera-errors.md).

Os **controles de ciclo de vida** estão documentados em [`development/camera-controls.md`](development/camera-controls.md). MediaPipe ainda não foi integrado; nenhuma detecção visual foi implementada.

### Ainda não implementado na Milestone 2

- Integração com MediaPipe
- Rastreamento facial ou ocular
- Detecção de piscadas e calibração do jogador

## Fora de escopo (visão de produto)

Os itens abaixo fazem parte da visão do produto, mas **não existem no código** nesta fase:

- Salas e sincronização em tempo real
- Painel do mestre
- Rotas `master`, `room` e `api` (além de `play/setup` e `play/camera`)
- Persistência em banco de dados
- Autenticação
- Framework de testes (Vitest, Testing Library, Playwright ou equivalentes)
- Servidores MCP configurados no repositório
- Identidade visual final de horror
- Motor configurável de criaturas

## O que a aplicação faz hoje

Ao executar `npm run dev` e acessar [http://localhost:3000](http://localhost:3000):

1. A **página inicial** apresenta a proposta do Blinkwatch, um resumo de privacidade e a ação **Iniciar experiência**.
2. A ação leva para **`/play/setup`**, uma etapa de consentimento com explicações sobre uso futuro da câmera, checkbox explícito e botão **Continuar** (desabilitado até o aceite).
3. Após marcar o consentimento e continuar, o participante chega a **`/play/camera`**, onde pode iniciar a câmera explicitamente, pausar, retomar, reiniciar, encerrar, visualizar a prévia local e escolher entre câmeras disponíveis.
4. **Não há** processamento de visão computacional, detecção visual, análise facial, transmissão de vídeo ou multiplayer.

## Próximas fases (planejamento)

Issues futuras introduzirão funcionalidades de produto conforme a arquitetura documentada. A ordem exata depende do backlog do projeto; consulte issues e milestones no GitHub quando disponíveis.

Para contribuir sem antecipar escopo, siga as regras em [`AGENTS.md`](../AGENTS.md) (seção de controle de escopo) e implemente apenas o que a issue atual solicitar.

## Verificação local

Antes de considerar alterações prontas para revisão, execute:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Esses comandos reproduzem a validação do CI descrita em [`development/continuous-integration.md`](development/continuous-integration.md).
