# Índice de documentação

Documentação técnica do Blinkwatch. Use este índice para localizar o material adequado ao seu objetivo.

**Idioma:** documentos marcados com _(PT)_ estão em português brasileiro; _(EN)_ em inglês. Comandos, caminhos e nomes de arquivos permanecem na forma original em todos os documentos.

## Entrada do repositório

| Documento                                     | Idioma | Descrição                                                                            |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| [`README.md`](../README.md)                   | PT     | Página de entrada: propósito, estado atual, instalação, validação e links principais |
| [`docs/project-status.md`](project-status.md) | PT     | Estado detalhado da Milestone 1 (fundação)                                           |

## Arquitetura

| Documento                                                                | Idioma | Descrição                                                                 |
| ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| [`architecture/project-structure.md`](architecture/project-structure.md) | PT     | Estrutura física atual, árvore planejada, camadas e regras de dependência |
| [`tests/README.md`](../tests/README.md)                                  | PT     | Organização dos testes, Vitest e mocks de mídia                           |

## Desenvolvimento

| Documento                                                                        | Idioma | Descrição                                                        |
| -------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| [`development/environment-variables.md`](development/environment-variables.md)   | EN     | Módulos tipados de ambiente, `.env.local`, regras `NEXT_PUBLIC_` |
| [`development/continuous-integration.md`](development/continuous-integration.md) | EN     | Workflow GitHub Actions, triggers, comandos e reprodução local   |
| [`development/mcp-strategy.md`](development/mcp-strategy.md)                     | EN     | Política opcional de MCP para agentes de programação             |
| [`development/camera-controls.md`](development/camera-controls.md)               | PT     | Iniciar, pausar, retomar, reiniciar e encerrar                   |
| [`development/camera-lifecycle.md`](development/camera-lifecycle.md)             | PT     | Propriedade do stream e encerramento seguro                      |
| [`development/camera-errors.md`](development/camera-errors.md)                   | PT     | Classificação e recuperação de falhas da câmera                  |
| [`development/camera-status.md`](development/camera-status.md)                   | PT     | Indicador de estado técnico vs apresentação                      |
| [`development/camera-mirroring.md`](development/camera-mirroring.md)             | PT     | Espelhamento visual da prévia                                    |
| [`.env.example`](../.env.example)                                                | EN     | Formato comentado de variáveis (sem credenciais reais)           |

## Instruções para agentes de programação

| Documento                                                         | Idioma | Descrição                                                      |
| ----------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| [`AGENTS.md`](../AGENTS.md)                                       | EN     | Regras globais: escopo, arquitetura, privacidade, comandos, CI |
| [`src/app/AGENTS.md`](../src/app/AGENTS.md)                       | EN     | App Router, Server/Client Components, route handlers           |
| [`src/features/AGENTS.md`](../src/features/AGENTS.md)             | EN     | Módulos funcionais verticais e fronteiras entre features       |
| [`src/infrastructure/AGENTS.md`](../src/infrastructure/AGENTS.md) | EN     | Adaptadores externos (MediaPipe, banco, tempo real)            |
| [`src/server/AGENTS.md`](../src/server/AGENTS.md)                 | EN     | Código exclusivo do servidor                                   |
| [`src/shared/AGENTS.md`](../src/shared/AGENTS.md)                 | EN     | Código reutilizável e shadcn/ui                                |
| [`tests/AGENTS.md`](../tests/AGENTS.md)                           | EN     | Colocação de testes e regras de teste de visão                 |

Leia sempre o `AGENTS.md` da raiz e o contextual mais próximo do diretório em que você trabalha.

## Agent Skills

Procedimentos reutilizáveis para tarefas recorrentes. Local canônico: [`.agents/skills/`](../.agents/skills/).

| Skill                                                                     | Descrição resumida                                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`implement-feature`](../.agents/skills/implement-feature/SKILL.md)       | Implementar ou modificar funcionalidade respeitando escopo e privacidade |
| [`write-tests`](../.agents/skills/write-tests/SKILL.md)                   | Criar ou atualizar testes determinísticos                                |
| [`update-documentation`](../.agents/skills/update-documentation/SKILL.md) | Criar ou revisar documentação alinhada ao código real                    |
| [`review-code`](../.agents/skills/review-code/SKILL.md)                   | Revisar diffs com foco em privacidade, arquitetura e evidências          |

Skills **complementam** os arquivos `AGENTS.md`; não substituem regras de privacidade ou escopo.

## Configuração de referência (sem documento dedicado)

Estes arquivos complementam a documentação acima:

| Arquivo                                                   | Função                                                |
| --------------------------------------------------------- | ----------------------------------------------------- |
| [`package.json`](../package.json)                         | Scripts npm e dependências (fonte oficial de versões) |
| [`components.json`](../components.json)                   | Configuração shadcn/ui                                |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Definição do workflow CI                              |

## Documentos intencionalmente ausentes

Os itens abaixo **não existem** nesta fase e serão introduzidos por issues futuras, se aplicável:

- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`
- Arquivo de licença (`LICENSE`)
- Documentação de API, deploy ou MediaPipe
- ADRs em `docs/decisions/` (diretório ainda não criado)
