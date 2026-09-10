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

| Item                          | Estado       | Referência                                  |
| ----------------------------- | ------------ | ------------------------------------------- |
| Tela inicial pública          | Implementado | `src/app/page.tsx`, `src/features/landing/` |
| Navegação para preparação     | Implementado | Ação principal em `/` → `/play/setup`       |
| Rota de preparação da câmera  | Implementado | `src/app/play/setup/page.tsx`               |
| Componente Button (shadcn/ui) | Implementado | `src/shared/components/ui/button.tsx`       |

### Ainda não implementado na Milestone 2

- Acesso à câmera e fluxo de consentimento completo
- Integração com MediaPipe
- Rastreamento facial ou ocular
- Detecção de piscadas e calibração do jogador
- Prévia real de vídeo
- Seleção de dispositivo de câmera

## Fora de escopo (visão de produto)

Os itens abaixo fazem parte da visão do produto, mas **não existem no código** nesta fase:

- Salas e sincronização em tempo real
- Painel do mestre
- Rotas `master`, `room` e `api` (além de `play/setup`)
- Persistência em banco de dados
- Autenticação
- Framework de testes (Vitest, Testing Library, Playwright ou equivalentes)
- Servidores MCP configurados no repositório
- Identidade visual final de horror
- Motor configurável de criaturas

## O que a aplicação faz hoje

Ao executar `npm run dev` e acessar [http://localhost:3000](http://localhost:3000):

1. A **página inicial** apresenta a proposta do Blinkwatch, um resumo de privacidade e a ação **Iniciar experiência**.
2. A ação leva para **`/play/setup`**, uma tela de preparação que informa que nenhuma permissão de câmera foi solicitada ainda.
3. **Não há** interação com câmera, detecção visual ou multiplayer.

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
