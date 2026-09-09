# Blinkwatch

Plataforma web complementar para sessões de RPG de terror. O Blinkwatch utilizará a câmera do jogador e visão computacional executada localmente no navegador para detectar piscadas, ausência de rosto e, futuramente, desvios de atenção.

## Status

Projeto em desenvolvimento inicial. A base técnica (Next.js, TypeScript, Tailwind CSS, shadcn/ui, Lucide React) está configurada; as funcionalidades de câmera e visão computacional ainda **não** foram implementadas.

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
