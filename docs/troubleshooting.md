# Troubleshooting

## Build

- Rode `pnpm prisma:generate` antes de `pnpm build`.
- Confirme `DATABASE_URL` e `AUTH_SECRET`.

## Login

- Verifique se o usuário está ativo.
- Verifique se o restaurante está ativo.
- Confirme `AUTH_URL` no ambiente local.

## Tenant

- Confirme o slug público em `NEXT_PUBLIC_RESTAURANT_SLUG`.
- Verifique se o restaurante possui tema e dados de branding.

## API

- `GET /api/health` para validar banco e observabilidade.
- `GET /api/monitoring` para ver o snapshot resumido.

## Deploy

- Em Vercel, confirme o root da aplicação.
- Em Docker, confirme a porta `3000`.
- Em Railway, Render e Fly, valide a variável `PORT`.

