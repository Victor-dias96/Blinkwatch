# Blinkwatch

Plataforma web complementar para sessões de RPG de terror. O Blinkwatch utilizará a câmera do jogador e visão computacional executada localmente no navegador para detectar piscadas, ausência de rosto e, futuramente, desvios de atenção.

## Status

Projeto em desenvolvimento inicial. A base técnica (Next.js, TypeScript, Tailwind CSS) está configurada; as funcionalidades de câmera e visão computacional ainda **não** foram implementadas.

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
npm run lint
npm run typecheck
npm run build
```

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera a aplicação para produção |
| `npm run start` | Executa a build de produção |
| `npm run lint` | Verifica a qualidade do código com ESLint |
| `npm run typecheck` | Executa a verificação de tipos do TypeScript |
