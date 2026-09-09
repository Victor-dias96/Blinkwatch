# Estado do projeto — Milestone 1

Este documento registra o que a **Milestone 1 (Fundação)** entregou até o momento e o que permanece fora de escopo nesta fase. Ele complementa o [`README.md`](../README.md) com detalhes verificáveis contra o repositório.

**Última revisão:** 2026-09-09

## Objetivo da Milestone 1

Estabelecer a base técnica, de qualidade, de agentes e de integração contínua para que funcionalidades de produto possam ser implementadas de forma incremental, sem abstrações prematuras e com regras claras de privacidade.

## Entregue nesta fase

### Aplicação

| Item                               | Estado       | Referência                |
| ---------------------------------- | ------------ | ------------------------- |
| Next.js (App Router)               | Implementado | `src/app/`                |
| Página inicial mínima              | Implementado | `src/app/page.tsx`        |
| Layout raiz e metadados            | Implementado | `src/app/layout.tsx`      |
| Estilos globais (Tailwind CSS)     | Implementado | `src/app/globals.css`     |
| Utilitário `cn` compartilhado      | Implementado | `src/shared/lib/utils.ts` |
| Validação tipada de ambiente (Zod) | Implementado | `src/shared/config/env/`  |
| Exemplo de variáveis de ambiente   | Implementado | `.env.example`            |

### Qualidade e Git

| Item                              | Estado       | Referência              |
| --------------------------------- | ------------ | ----------------------- |
| TypeScript (strict mode)          | Implementado | `tsconfig.json`         |
| ESLint                            | Implementado | `eslint.config.mjs`     |
| Prettier (+ ordenação Tailwind)   | Implementado | `.prettierrc`           |
| Husky                             | Implementado | `.husky/`               |
| lint-staged                       | Implementado | `package.json`          |
| Commitlint (Conventional Commits) | Implementado | `commitlint.config.mjs` |

### UI e dependências de interface

| Item                              | Estado               | Referência              |
| --------------------------------- | -------------------- | ----------------------- |
| Tailwind CSS                      | Implementado         | `package.json`, PostCSS |
| shadcn/ui (inicializado)          | Implementado         | `components.json`       |
| Lucide React                      | Instalado            | `package.json`          |
| Componentes shadcn/ui adicionados | **Não implementado** | —                       |

### Arquitetura e agentes

| Item                                                                   | Estado               | Referência                                                                                 |
| ---------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| Documentação de estrutura modular                                      | Implementado         | [`architecture/project-structure.md`](architecture/project-structure.md)                   |
| `AGENTS.md` principal                                                  | Implementado         | [`AGENTS.md`](../AGENTS.md)                                                                |
| `AGENTS.md` contextuais                                                | Implementado         | `src/app/`, `src/features/`, `src/infrastructure/`, `src/server/`, `src/shared/`, `tests/` |
| Agent Skills                                                           | Implementado         | [`.agents/skills/`](../.agents/skills/)                                                    |
| Estratégia de MCP (documentada)                                        | Implementado         | [`development/mcp-strategy.md`](development/mcp-strategy.md)                               |
| Diretórios `features`, `domain`, `infrastructure`, `server` com código | **Não implementado** | Apenas `AGENTS.md` contextuais em alguns caminhos                                          |

### Integração contínua

| Item                         | Estado       | Referência                                                                       |
| ---------------------------- | ------------ | -------------------------------------------------------------------------------- |
| Workflow GitHub Actions (CI) | Implementado | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)                        |
| Documentação de CI           | Implementado | [`development/continuous-integration.md`](development/continuous-integration.md) |

### Documentação

| Item                     | Estado       | Referência                                                                     |
| ------------------------ | ------------ | ------------------------------------------------------------------------------ |
| README principal (PT-BR) | Implementado | [`README.md`](../README.md)                                                    |
| Índice de documentação   | Implementado | [`docs/README.md`](README.md)                                                  |
| Variáveis de ambiente    | Implementado | [`development/environment-variables.md`](development/environment-variables.md) |
| Placeholder de testes    | Implementado | [`tests/README.md`](../tests/README.md)                                        |

## Fora de escopo da Milestone 1

Os itens abaixo fazem parte da visão do produto, mas **não existem no código** nesta fase:

- Acesso à câmera e fluxo de consentimento
- Integração com MediaPipe
- Rastreamento facial ou ocular
- Detecção de piscadas e calibração do jogador
- Salas e sincronização em tempo real
- Painel do mestre
- Rotas `play`, `master`, `room` e `api`
- Persistência em banco de dados
- Autenticação
- Framework de testes (Vitest, Testing Library, Playwright ou equivalentes)
- Servidores MCP configurados no repositório
- Identidade visual final de horror
- Motor configurável de criaturas

## O que a aplicação faz hoje

Ao executar `npm run dev` e acessar [http://localhost:3000](http://localhost:3000), o usuário vê uma página inicial estática que informa que o projeto está em desenvolvimento. Não há interação com câmera, detecção visual ou multiplayer.

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
