# Testes do Blinkwatch

Este diretório abrigará testes globais e recursos compartilhados de teste conforme o projeto evoluir. Nenhum framework de testes foi instalado nesta etapa.

## Organização planejada

```
tests/
├── unit/          # Testes unitários globais ou de utilitários transversais
├── integration/   # Testes que cruzam múltiplos módulos ou camadas
├── e2e/           # Testes de jornadas completas do usuário
├── fixtures/      # Dados e arquivos reutilizáveis entre testes
└── mocks/         # Mocks compartilhados (ex.: APIs, WebSocket, MediaPipe)
```

Os subdiretórios acima serão criados fisicamente quando houver arquivos reais a armazenar.

## Onde colocar cada tipo de teste

### Próximo da feature

Testes diretamente relacionados a uma funcionalidade vertical podem ficar dentro ou ao lado da feature correspondente, por exemplo:

```
src/features/camera/tests/camera-preview.test.tsx
src/features/blink-detection/hooks/useBlinkDetection.test.ts
```

### Próximo do código testado

Testes unitários de regras puras (domain, utilitários) podem ficar ao lado do arquivo testado:

```
src/domain/rules/threat-policy.test.ts
src/shared/utils/formatSessionDuration.test.ts
```

### Em `tests/integration/`

Testes que verificam a interação entre vários módulos ou camadas — por exemplo, uma feature consumindo um adaptador de infraestrutura com mocks controlados.

### Em `tests/e2e/`

Testes de jornadas completas simulando fluxos reais do usuário, como entrar em uma sala, calibrar a câmera e participar de uma sessão.

### Em `tests/fixtures/`

Dados estáticos, snapshots ou arquivos reutilizados por múltiplos testes (ex.: frames de vídeo sintéticos, payloads de eventos).

### Em `tests/mocks/`

Implementações falsas ou stubs compartilhados entre suites de teste (ex.: mock de MediaPipe, mock de cliente WebSocket).

## Convenções de nomenclatura

| Tipo       | Sufixo sugerido | Exemplo                   |
| ---------- | --------------- | ------------------------- |
| Unitário   | `.test.ts(x)`   | `blink-detector.test.ts`  |
| Componente | `.test.tsx`     | `camera-preview.test.tsx` |
| E2E        | `.spec.ts`      | `player-flow.spec.ts`     |

## Próximos passos

A escolha e instalação de frameworks (Vitest, Testing Library, Playwright ou equivalentes) será tratada em issue futura, junto com scripts npm e integração com CI.
