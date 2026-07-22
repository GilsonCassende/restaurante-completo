# CI/CD

## Fluxo de validação

O pipeline mínimo do projeto deve executar:

1. `pnpm prisma:generate`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm build`
5. `pnpm test:integration`
6. `pnpm test:smoke`
7. `pnpm test:performance`
8. `pnpm test:stress`

## GitHub Actions

- `ci.yml`: validação de PR e push
- `deploy-preview.yml`: build e preparação de preview
- `deploy-production.yml`: build e liberação de produção

## Regras

- O Prisma Client deve ser gerado antes do build.
- O build deve falhar se tipos ou lint falharem.
- Deploy só deve ocorrer após validação verde.
- Preview e production devem usar ambientes separados.

## Artefatos

- Relatórios de cobertura e testes ficam em `coverage/` ou em artefatos de CI.
- O build final deve preservar o cache por tenant e os assets públicos.

