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
