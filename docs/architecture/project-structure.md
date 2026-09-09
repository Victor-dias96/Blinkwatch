# Estrutura do projeto Blinkwatch

## 1. Objetivo da arquitetura

O Blinkwatch adota uma organização modular e incremental para suportar o crescimento da plataforma sem acumular abstrações prematuras. A arquitetura separa rotas do App Router, funcionalidades verticais (features), regras de negócio independentes de framework (domain), integrações externas (infrastructure), código exclusivo do servidor (server) e utilitários verdadeiramente transversais (shared).

O objetivo é permitir que cada área evolua de forma autônoma, com dependências explícitas e locais previsíveis para código novo, sem exigir que toda a árvore planejada exista fisicamente desde o início.

## 2. Árvore completa planejada

```
blinkwatch/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── development/
│   │   └── continuous-integration.md
│   ├── privacy/
│   ├── protocols/
│   └── testing/
├── public/
│   ├── audio/
│   ├── icons/
│   └── models/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── master/
│   │   ├── play/
│   │   ├── room/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/
│   │   ├── blink-detection/
│   │   ├── calibration/
│   │   ├── camera/
│   │   ├── creatures/
│   │   ├── face-tracking/
│   │   ├── gameplay/
│   │   ├── realtime/
│   │   ├── rooms/
│   │   └── session-history/
│   ├── domain/
│   │   ├── entities/
│   │   ├── events/
│   │   ├── rules/
│   │   └── value-objects/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── mediapipe/
│   │   ├── realtime/
│   │   └── repositories/
│   ├── server/
│   │   ├── authentication/
│   │   ├── services/
│   │   └── validation/
│   └── shared/
│       ├── components/
│       │   └── ui/
│       ├── hooks/
│       ├── lib/
│       ├── schemas/
│       ├── types/
│       └── utils/
└── tests/
    ├── e2e/
    ├── fixtures/
    ├── integration/
    ├── mocks/
    └── unit/
```

Esta árvore representa a **direção arquitetural** do projeto. Diretórios serão criados fisicamente somente quando houver arquivos reais a armazenar.

## 3. Estrutura física atual

```
blinkwatch/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── architecture/
│   │   └── project-structure.md
│   └── development/
│       ├── continuous-integration.md
│       ├── environment-variables.md
│       └── mcp-strategy.md
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── shared/
│       └── lib/
│           └── utils.ts
├── tests/
│   └── README.md
├── components.json
├── package.json
├── README.md
└── demais arquivos de configuração existentes
```

## 4. Responsabilidade de cada diretório

### `docs/`

Documentação técnica do projeto. Subdiretórios planejados:

- `architecture/` — visão estrutural e decisões de organização;
- `development/` — políticas e orientações para desenvolvimento (integração contínua, variáveis de ambiente, estratégia opcional de MCP); configurações MCP **não** fazem parte do runtime da aplicação e **nenhuma** configuração MCP existe no repositório nesta etapa;

### `.github/`

Automações do repositório no GitHub. O diretório `workflows/` contém definições de GitHub Actions.

- `workflows/ci.yml` — workflow **CI** que valida formatação, lint, typecheck e build em pull requests e pushes para `main`.
- Deploy, publicação de artifacts e integrações de produção **não** fazem parte do workflow atual.
- GitHub Actions **não** faz parte do runtime entregue aos jogadores; é infraestrutura de desenvolvimento do repositório.
- `decisions/` — ADRs (Architecture Decision Records);
- `privacy/` — políticas e considerações de privacidade;
- `protocols/` — contratos de comunicação entre cliente e servidor;
- `testing/` — estratégias e convenções de teste complementares.

### `public/`

Arquivos estáticos servidos diretamente pelo Next.js. Subdiretórios planejados:

- `audio/` — efeitos sonoros e trilhas;
- `icons/` — ícones e assets visuais estáticos;
- `models/` — modelos de ML (ex.: MediaPipe) quando forem adicionados.

### `src/app/`

Pontos de composição do App Router: páginas, layouts, loading states, error boundaries, route handlers e metadados. As rotas **não** concentram regras de detecção, integração com MediaPipe, cálculos de piscada, regras de criaturas, acesso direto ao banco, lógica de WebSocket ou regras complexas de negócio.

Rotas planejadas (ainda não implementadas):

- `play/` — experiência do jogador;
- `master/` — painel do mestre;
- `room/` — sala de sessão;
- `api/` — route handlers do servidor.

### `src/features/`

Funcionalidades verticais e autocontidas, organizadas por domínio funcional. Cada feature cria apenas os subdiretórios que realmente utilizar (ex.: `components`, `hooks`, `services`, `types`, `schemas`, `tests`).

Features planejadas:

| Feature           | Responsabilidade prevista                       |
| ----------------- | ----------------------------------------------- |
| `camera`          | Captura e permissões de câmera                  |
| `face-tracking`   | Rastreamento facial via visão computacional     |
| `blink-detection` | Detecção de piscadas e ausência de rosto        |
| `calibration`     | Calibração individual do jogador                |
| `gameplay`        | Mecânicas de jogo e fluxo da sessão             |
| `creatures`       | Comportamento e apresentação de criaturas       |
| `rooms`           | Criação e entrada em salas                      |
| `realtime`        | Sincronização em tempo real entre participantes |
| `session-history` | Histórico e registro de sessões                 |

### `src/domain/`

Regras centrais independentes de framework: entidades, eventos de domínio, value objects, máquinas de estado, políticas de ameaça e regras de calibração desacopladas de MediaPipe.

O domínio **não** deve importar diretamente React, Next.js, MediaPipe, Prisma, Socket.IO, APIs do navegador ou componentes visuais.

### `src/infrastructure/`

Adaptadores e integrações externas: MediaPipe, banco de dados, repositórios concretos, cliente de tempo real, persistência, observabilidade e APIs externas. A infraestrutura pode depender do domínio; o domínio não depende da infraestrutura.

### `src/server/`

Código que não pode ser importado pelo cliente: autenticação, validações exclusivas do servidor, coordenação de casos de uso, serviços internos, acesso a variáveis de ambiente protegidas e operações administrativas.

Quando implementados, módulos exclusivos do servidor deverão utilizar mecanismos apropriados (ex.: `"server-only"`, convenções de importação) para impedir importação acidental no cliente.

### `src/shared/`

Código **realmente reutilizado** por diferentes áreas do projeto:

| Subdiretório  | Conteúdo esperado                                              |
| ------------- | -------------------------------------------------------------- |
| `components/` | Componentes visuais compartilhados (incluindo `ui/` do shadcn) |
| `hooks/`      | Hooks utilizados por mais de uma feature                       |
| `lib/`        | Configuração ou integração utilitária de bibliotecas internas  |
| `schemas/`    | Schemas Zod (ou similares) usados por múltiplas features       |
| `types/`      | Tipos verdadeiramente compartilhados                           |
| `utils/`      | Funções puras, pequenas e genéricas                            |

Evite transformar `shared` em um depósito genérico sem responsabilidade definida.

### `tests/`

Testes globais e recursos compartilhados de teste. Ver `tests/README.md` para a estratégia detalhada.

## 5. Direção permitida das dependências

```
app ──────────────► features, shared
features ─────────► domain, infrastructure, shared
infrastructure ───► domain (implementa contratos)
server ───────────► domain, infrastructure, shared
domain ───────────► (sem dependências de framework ou integração)
shared ───────────► (sem dependência de feature específica)
```

Regras adicionais:

- Uma feature **não** deve importar detalhes internos de outra feature;
- Código cliente **não** deve importar módulos exclusivos de `server`;
- `domain` permanece independente de frameworks e integrações;
- `shared` não depende de uma feature específica.

Regras automáticas de fronteiras arquiteturais no ESLint **não** foram implementadas nesta etapa.

## 6. Diferença entre feature, domain, infrastructure, shared e server

| Camada             | Pergunta orientadora                                | Exemplo futuro                          |
| ------------------ | --------------------------------------------------- | --------------------------------------- |
| **Feature**        | O que o usuário percebe como funcionalidade?        | `CameraPreview`, `useBlinkDetection`    |
| **Domain**         | Qual é a regra de negócio pura, sem UI ou I/O?      | `BlinkEvent`, regras de criaturas       |
| **Infrastructure** | Como conectamos com o mundo externo?                | adaptador MediaPipe, repositório Prisma |
| **Shared**         | Várias áreas usam isso sem pertencer a uma feature? | `cn`, botão genérico do shadcn          |
| **Server**         | Isso só pode rodar no servidor com segredos ou I/O? | validação de sessão, serviço de sala    |

## 7. Regras para criação de novos diretórios

1. Crie diretórios somente quando houver arquivos reais a colocar neles.
2. Não utilize `.gitkeep` ou arquivos vazios apenas para representar planos futuros.
3. Não crie `index.ts` vazios ou barrel exports antecipados.
4. Dentro de features, crie subdiretórios conforme a necessidade real — não imponha a mesma estrutura interna a todas.
5. Prefira adicionar código próximo ao uso antes de extrair para `shared`.
6. Documente decisões significativas em `docs/decisions/` quando apropriado.

## 8. Regras para localização dos testes

- Testes diretamente relacionados a uma feature podem ficar próximos da feature (ex.: `src/features/camera/tests/`).
- Testes unitários de regras puras podem ficar ao lado do arquivo testado (ex.: `blink-detector.test.ts` junto de `blink-detector.ts`).
- Testes de integração entre vários módulos ficam em `tests/integration/`.
- Testes de jornadas completas ficam em `tests/e2e/`.
- Fixtures compartilhadas ficam em `tests/fixtures/`.
- Mocks compartilhados ficam em `tests/mocks/`.

Consulte `tests/README.md` para detalhes.

### Instruções contextuais para agentes

Além do [`AGENTS.md`](../../AGENTS.md) na raiz, áreas arquiteturais possuem regras locais que complementam as instruções globais:

| Arquivo                        | Escopo                                                                      |
| ------------------------------ | --------------------------------------------------------------------------- |
| `src/app/AGENTS.md`            | App Router, rotas, Server/Client Components, route handlers                 |
| `src/features/AGENTS.md`       | Módulos funcionais verticais, fronteiras entre features, regras de detecção |
| `src/infrastructure/AGENTS.md` | Adaptadores externos, MediaPipe, banco, tempo real                          |
| `src/server/AGENTS.md`         | Código exclusivo do servidor, privacidade no servidor                       |
| `src/shared/AGENTS.md`         | Código reutilizável, shadcn/ui, elegibilidade para `shared`                 |
| `tests/AGENTS.md`              | Colocação de testes, mocks, fixtures, regras de teste de visão              |

Agentes devem ler o arquivo da raiz e o contextual mais próximo do diretório em que trabalham. Regras locais adicionam restrições específicas; não enfraquecem privacidade, segurança ou qualidade definidas globalmente.

## 9. Convenções de nomes

### Diretórios

Utilizar **kebab-case**: `blink-detection`, `face-tracking`, `session-history`.

### Componentes React

Utilizar **PascalCase**: `CameraPreview.tsx`, `BlinkAlert.tsx`.

### Hooks

Utilizar **camelCase** com prefixo `use`: `useCamera.ts`, `useBlinkDetection.ts`.

### Funções e utilitários

Utilizar **camelCase**: `calculateEyeOpenness.ts`, `formatSessionDuration.ts`.

### Tipos, interfaces e classes

Utilizar **PascalCase**: `BlinkEvent`, `CameraPermissionState`.

### Testes

Nome do arquivo associado com sufixo adequado:

- `blink-detector.test.ts` — teste unitário;
- `camera-preview.test.tsx` — teste de componente;
- `player-flow.spec.ts` — teste e2e.

## 10. Exemplos de localização de funcionalidades futuras

| Funcionalidade                 | Localização prevista                                      |
| ------------------------------ | --------------------------------------------------------- |
| Preview da câmera              | `src/features/camera/components/CameraPreview.tsx`        |
| Hook de detecção de piscadas   | `src/features/blink-detection/hooks/useBlinkDetection.ts` |
| Evento de piscada (regra pura) | `src/domain/events/BlinkEvent.ts`                         |
| Adaptador MediaPipe            | `src/infrastructure/mediapipe/`                           |
| Repositório de sessões         | `src/infrastructure/repositories/`                        |
| Validação de entrada em sala   | `src/server/validation/`                                  |
| Componente Button do shadcn    | `src/shared/components/ui/button.tsx`                     |
| Utilitário `cn`                | `src/shared/lib/utils.ts`                                 |
| Rota do jogador                | `src/app/play/page.tsx` (composição de features)          |
| API de criação de sala         | `src/app/api/rooms/route.ts`                              |

## 11. Itens ainda não implementados

- Rotas `play`, `master`, `room` e `api`;
- Todas as features listadas em `src/features/`;
- Camadas `domain`, `infrastructure` e `server`;
- Subdiretórios de `shared` além de `lib/` (components, hooks, schemas, types, utils);
- Subdiretórios de `public/` (audio, icons, models);
- Subdiretórios de `docs/` além de `architecture/` e `development/` (decisions, privacy, protocols, testing);
- Subdiretórios de `tests/` além do README;
- Câmera, MediaPipe, detecção de piscadas, multiplayer, persistência;
- Componentes shadcn/ui;
- Framework de testes (Vitest, Testing Library, Playwright);
- Regras ESLint de fronteiras arquiteturais.

## 12. Agent Skills

Procedimentos especializados para agentes de programação ficam em `.agents/skills/`. Este é o **local canônico** das Skills do Blinkwatch; não duplique o conteúdo em `.cursor/skills`, `.claude/skills`, `.github/skills` ou outros caminhos.

| Conceito        | Função                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| **`AGENTS.md`** | Regras permanentes do repositório ou de um diretório (privacidade, arquitetura, escopo, validação)                 |
| **`SKILL.md`**  | Procedimento ativado para um tipo de tarefa (implementar feature, escrever testes, atualizar docs, revisar código) |
| **`docs/`**     | Decisões e explicações arquiteturais de longo prazo                                                                |

Cada Skill é um diretório autocontido com um `SKILL.md` (frontmatter YAML + corpo Markdown). Novas Skills são adicionadas incrementalmente conforme surgem fluxos recorrentes.

Opcionalmente, uma Skill pode crescer com subdiretórios quando houver conteúdo real:

- `scripts/` — utilitários determinísticos de validação;
- `references/` — material técnico extenso;
- `assets/` — fixtures ou templates reutilizáveis.

**Não** crie esses subdiretórios vazios nem arquivos `.gitkeep` apenas para reservar estrutura. Compatibilidade com ferramentas específicas pode ser tratada futuramente por configuração ou referência, sem duplicar os arquivos-fonte em `.agents/skills`.

Skills iniciais: `implement-feature`, `write-tests`, `update-documentation`, `review-code`.

## 13. Orientação contra abstrações prematuras

- Não crie interfaces, repositórios ou serviços antes de haver pelo menos um consumidor real.
- Não extraia código para `shared` até que duas ou mais áreas o utilizem de fato.
- Não imponha a mesma estrutura interna a todas as features.
- Não crie diretórios vazios para "reservar" espaço futuro — a documentação já registra o plano.
- As rotas do App Router devem permanecer finas: compõem features e shared, delegando lógica pesada.
- Prefira evolução incremental: implemente na feature, extraia para domain ou shared quando a duplicação ou o acoplamento justificar.
