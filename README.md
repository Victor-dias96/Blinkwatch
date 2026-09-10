# Blinkwatch

Aplicação web experimental para complementar sessões de RPG de terror com mecânicas interativas baseadas em visão computacional executada no navegador. O projeto está em **desenvolvimento inicial**: a mecânica principal (câmera, detecção de piscadas e sincronização com o mestre) **ainda não foi implementada**.

## Visão geral

O Blinkwatch se inspira na ideia de criaturas ou ameaças que se movem ou reagem quando deixam de ser observadas — um tropo comum em narrativas de terror. A proposta é detectar eventos visuais do participante, como **piscadas** e **ausência de rosto**, e permitir que o **mestre** use esses sinais para conduzir consequências narrativas na mesa.

O Blinkwatch **complementa** a sessão de RPG; **não substitui** o sistema de jogo escolhido pelo grupo. As regras mecânicas e as consequências na ficção permanecem sob controle do mestre.

## Estado atual

> **Aviso:** a Milestone 1 (fundação) foi concluída; a **Milestone 2** (câmera e prova de conceito visual) está em andamento. A tela inicial pública e a rota de preparação `/play/setup` já existem.
>
> - Acesso à câmera: **não implementado**
> - Detecção de piscadas: **não implementado**
> - Multiplayer / salas em tempo real: **não implementado**
> - Painel do mestre: **não implementado**

Detalhes verificáveis item a item: [`docs/project-status.md`](docs/project-status.md).

## Funcionalidades planejadas

_Planejamento de alto nível — nenhum item abaixo está concluído nesta fase._

- Consentimento e acesso à câmera
- Processamento visual local no navegador
- Detecção calibrada de piscadas
- Eventos de ausência de rosto
- Experiência do jogador
- Salas em tempo real
- Painel do mestre
- Motor configurável de criaturas

## Privacidade por design

O Blinkwatch estabelece as seguintes regras para qualquer implementação futura envolvendo câmera ou visão computacional:

- O acesso à câmera **deverá exigir** consentimento explícito do participante.
- O processamento visual **deverá ocorrer localmente** no navegador, por padrão.
- Quadros de vídeo **não deverão ser enviados** ao mestre nem ao servidor.
- Vídeo **não deverá ser gravado** automaticamente.
- Reconhecimento de identidade **não faz parte** do projeto.
- Quando existir comunicação em tempo real, **somente eventos mínimos de jogo** (por exemplo, uma piscada detectada) poderão ser transmitidos — nunca dados faciais brutos.
- Afirmações de privacidade na documentação e na interface **deverão permanecer compatíveis** com a implementação real.

Essas garantias estão detalhadas em [`AGENTS.md`](AGENTS.md) (seção de privacidade e câmera).

## Tecnologias

Tecnologias **presentes** no repositório (versões em [`package.json`](package.json)):

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui (inicializado; componentes adicionados sob demanda)
- Lucide React
- Zod
- ESLint
- Prettier
- Husky
- lint-staged
- Commitlint
- GitHub Actions

**Não instalados** nesta fase (mencionados apenas como possibilidades futuras): MediaPipe, Socket.IO, Prisma, PostgreSQL, frameworks de teste (Vitest, Testing Library, Playwright), servidores MCP.

## Requisitos

- **Git**
- **Node.js 20 ou superior** — versão utilizada pelo CI em [`.github/workflows/ci.yml`](.github/workflows/ci.yml). O repositório não define `.nvmrc`, `.node-version` nem campo `engines` em `package.json`.
- **npm** — gerenciador adotado (`package-lock.json` presente)

## Instalação

```bash
git clone <repository-url>
cd blinkwatch
npm ci
```

O projeto **não exige credenciais externas** neste estágio. Valores locais opcionais ficam em `.env.local` (não versionado). Consulte [`.env.example`](.env.example) e [`docs/development/environment-variables.md`](docs/development/environment-variables.md).

## Desenvolvimento

Inicie o servidor local:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Validação

Execute antes de abrir um pull request ou reportar uma tarefa como concluída:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Correções automáticas quando necessário:

```bash
npm run format
npm run lint:fix
```

O CI executa a mesma sequência de verificação (com `npm ci` na instalação). Detalhes: [`docs/development/continuous-integration.md`](docs/development/continuous-integration.md).

## Commits e hooks

O repositório usa [Husky](https://typicode.github.io/husky/), [lint-staged](https://github.com/lint-staged/lint-staged) e [Commitlint](https://commitlint.js.org/) com [Conventional Commits](https://www.conventionalcommits.org/).

- **`pre-commit`** — ESLint (com `--fix`) e Prettier nos arquivos preparados
- **`commit-msg`** — validação da mensagem de commit

Exemplo de mensagem válida: `docs: update project documentation`

Testar uma mensagem manualmente:

```bash
echo "chore: test commit message" | npm run commitlint
```

## Instruções para agentes

Programação assistida por agentes deve seguir [`AGENTS.md`](AGENTS.md) na raiz e o `AGENTS.md` contextual mais próximo do diretório editado (por exemplo, `src/app/AGENTS.md`).

**Agent Skills** reutilizáveis ficam em [`.agents/skills/`](.agents/skills/). Cada Skill possui um `SKILL.md` com procedimento especializado. Skills complementam, mas não substituem, as regras dos arquivos `AGENTS.md`.

**MCP** (Model Context Protocol) é ferramenta **opcional** de desenvolvimento para agentes; não faz parte do runtime da aplicação. Política: [`docs/development/mcp-strategy.md`](docs/development/mcp-strategy.md).

## Documentação

Índice completo: [`docs/README.md`](docs/README.md).

| Tópico                | Documento                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Estrutura do projeto  | [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md)         |
| Estado da Milestone 1 | [`docs/project-status.md`](docs/project-status.md)                                         |
| Variáveis de ambiente | [`docs/development/environment-variables.md`](docs/development/environment-variables.md)   |
| Integração contínua   | [`docs/development/continuous-integration.md`](docs/development/continuous-integration.md) |
| Estratégia MCP        | [`docs/development/mcp-strategy.md`](docs/development/mcp-strategy.md)                     |

## Como contribuir

1. Escolha ou receba uma **issue** com escopo definido.
2. Implemente **somente** o solicitado — não antecipe funcionalidades futuras (câmera, MediaPipe, salas, banco de dados, etc.).
3. Leia [`AGENTS.md`](AGENTS.md) e o `AGENTS.md` contextual da área afetada.
4. Ative a Skill correspondente em [`.agents/skills/`](.agents/skills/) quando aplicável.
5. Execute a validação local (`format:check`, `lint`, `typecheck`, `build`).
6. Abra um pull request; o workflow CI validará automaticamente.

Diretrizes de arquitetura incremental: [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md).

## Scripts disponíveis

| Comando                | Descrição                       |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento     |
| `npm run build`        | Build de produção               |
| `npm run start`        | Executa a build de produção     |
| `npm run format`       | Formata com Prettier            |
| `npm run format:check` | Verifica formatação             |
| `npm run lint`         | Executa ESLint                  |
| `npm run lint:fix`     | Correções seguras do ESLint     |
| `npm run typecheck`    | Verificação de tipos TypeScript |
| `npm run commitlint`   | Valida mensagem de commit       |
