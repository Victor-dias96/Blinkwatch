# Blinkwatch

Plataforma web complementar para sessões de RPG de terror. O Blinkwatch utilizará a câmera do jogador e visão computacional executada localmente no navegador para detectar piscadas, ausência de rosto e, futuramente, desvios de atenção.

## Status

Projeto em desenvolvimento inicial. A base técnica (Next.js, TypeScript, Tailwind CSS, shadcn/ui, Lucide React) está configurada; as funcionalidades de câmera e visão computacional ainda **não** foram implementadas.

## Instruções para agentes

O repositório inclui um arquivo [`AGENTS.md`](AGENTS.md) na raiz com instruções versionadas para agentes de programação (escopo, arquitetura, privacidade, comandos e fluxo de trabalho).

### Agent Skills

O Blinkwatch também disponibiliza **Skills reutilizáveis** em [`.agents/skills/`](.agents/skills/). Cada Skill é um diretório com um arquivo `SKILL.md` que descreve um procedimento especializado (implementação de features, testes, documentação ou revisão de código).

Agentes devem ler o `SKILL.md` correspondente quando a tarefa se encaixar na descrição da Skill. As Skills **complementam**, mas **não substituem**, os arquivos `AGENTS.md`.

### MCP (opcional)

Integrações MCP são ferramentas **opcionais** de desenvolvimento para agentes de programação. Nenhum MCP é necessário para executar o Blinkwatch. A política de uso está em [`docs/development/mcp-strategy.md`](docs/development/mcp-strategy.md).

## Arquitetura

O projeto utiliza organização modular por **features**, com separação entre interface (`app`), funcionalidades verticais (`features`), regras de negócio (`domain`), integrações externas (`infrastructure`), código exclusivo do servidor (`server`) e utilitários transversais (`shared`).

A documentação completa está em [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md).

A estrutura física do repositório cresce de forma **incremental**: diretórios são criados somente quando há arquivos reais a armazenar. Diretórios vazios não são adicionados apenas para representar planos futuros.

## Tecnologias principais

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React

## Requisitos

- Node.js 20 ou superior
- npm

## Instalação

```bash
npm install
```

O projeto **não exige credenciais externas** neste estágio. Valores locais opcionais devem ficar em `.env.local` (não versionado). O arquivo [`.env.example`](.env.example) documenta o formato das variáveis disponíveis. Instruções detalhadas estão em [`docs/development/environment-variables.md`](docs/development/environment-variables.md).

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Validação

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## Formatação e lint

```bash
npm run format
npm run format:check
npm run lint
npm run lint:fix
```

- `format` — aplica o Prettier e modifica os arquivos.
- `format:check` — verifica a formatação sem alterar arquivos.
- `lint` — identifica problemas de qualidade e ordem de imports com ESLint.
- `lint:fix` — aplica correções seguras do ESLint, incluindo ordenação de imports.

## Validação de commits

O projeto utiliza [Husky](https://typicode.github.io/husky/), [lint-staged](https://github.com/lint-staged/lint-staged) e [Commitlint](https://commitlint.js.org/) para garantir qualidade local antes de cada commit.

- **Husky** — instala e executa hooks Git automaticamente após `npm install` (script `prepare`).
- **lint-staged** — executa ESLint e Prettier somente nos arquivos preparados para commit.
- **Commitlint** — valida se a mensagem de commit segue o padrão [Conventional Commits](https://www.conventionalcommits.org/).

### Padrão de mensagens (Conventional Commits)

Formato: `type(escopo opcional): descrição curta`

Exemplos válidos:

```
feat: add new feature
fix: correct unexpected behavior
docs: update project documentation
chore: update project configuration
```

### Hooks Git

- **`pre-commit`** — executa `lint-staged` nos arquivos preparados (ESLint com `--fix` e Prettier em JS/TS; Prettier em CSS, JSON, Markdown e YAML).
- **`commit-msg`** — executa o Commitlint sobre a mensagem do commit.

### Testar mensagens manualmente

```bash
echo "chore: test commit message" | npm run commitlint
```

## Scripts disponíveis

| Comando                | Descrição                                    |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Inicia o ambiente de desenvolvimento         |
| `npm run build`        | Gera a aplicação para produção               |
| `npm run start`        | Executa a build de produção                  |
| `npm run format`       | Formata o código com Prettier                |
| `npm run format:check` | Verifica a formatação sem modificar arquivos |
| `npm run lint`         | Verifica a qualidade do código com ESLint    |
| `npm run lint:fix`     | Aplica correções automáticas do ESLint       |
| `npm run typecheck`    | Executa a verificação de tipos do TypeScript |
| `npm run commitlint`   | Valida uma mensagem de commit manualmente    |
