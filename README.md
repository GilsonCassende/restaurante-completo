# RestaurantPro

RestaurantPro é uma base Enterprise em Next.js App Router para restaurantes multi-tenant, white label e preparada para evolução por fases.

## Stack

- Next.js 15 com App Router
- TypeScript strict
- Prisma com MongoDB
- Server Actions
- Zod para schemas
- NextAuth v5 para autenticação
- Tailwind CSS + design system próprio
- React Server Components e cache por tenant

## Arquitetura

O projeto está organizado por camadas, sem misturar responsabilidade de UI, domínio e persistência.

- `src/app`: rotas, páginas, metadata, handlers e layouts do App Router
- `src/actions`: Server Actions por domínio
- `src/schemas`: validação de entrada e contratos
- `src/services`: regras de negócio e agregação por domínio
- `src/prisma`: client, seed e repositório de acesso aos dados
- `src/lib`: utilitários, infraestrutura enterprise, segurança, observabilidade e produção
- `src/components`: UI, design system e composições de domínio
- `src/permissions`: roles, prioridades e autorização
- `src/context` e `src/hooks`: providers e estados locais

## Estrutura

- Landing pública em `(site)`
- Área autenticada em `/dashboard`
- Área operacional em `/app`, `/menu`, `/cart`, `/checkout`, `/reservas`
- APIs em `/api/health`, `/api/monitoring` e `/api/auth/[...nextauth]`

## Fluxos Principais

1. O tenant é resolvido a partir da sessão, slug público ou contexto de restaurante.
2. A autorização é aplicada por role no middleware e nas Server Actions.
3. As páginas consultam services e Prisma através de wrappers do domínio.
4. As mutações revalidam cache e paths por tenant.
5. O layout raiz injeta tema, locale e providers globais.

## Regras de Negócio

- Cada registro operacional pertence a um `restaurantId`.
- Slugs de categorias e produtos são únicos por restaurante.
- Mesas têm QR Code gerado com `restaurantId:number`.
- Reservas registram histórico de ações.
- Login exige usuário ativo e restaurante ativo, exceto super admin.
- Permissões são reforçadas em middleware e em `requireRole`.

## Autenticação

- Baseada em credentials com NextAuth.
- Sessão em strategy `jwt`.
- Login usa `src/actions/auth/login.ts`.
- O usuário autenticado recebe `id`, `restaurantId`, `role`, `active`, nome, email e imagem.

## Autorização

- `SUPER_ADMIN`, `OWNER`, `MANAGER`, `STAFF`, `DRIVER`
- Hierarquia definida em `src/permissions/roles.ts`
- Middleware protege rotas sensíveis
- `requireAuthenticatedUser` e `requireRole` protegem Server Components e Actions

## Multi Tenant

- O tenant principal é o restaurante.
- O cache usa tags por escopo e tenant.
- O tema, landing e dashboards são resolvidos por restaurante.
- Os índices Prisma priorizam `restaurantId`, `status`, `createdAt` e chaves únicas por tenant.

## White Label

- Branding do restaurante via cores, imagens, tipografia, estilos e metadados SEO.
- Tema dinâmico carregado no `RootLayout`.
- Landing pública e dashboard compartilham a mesma base visual.

## Domínios

- CRM
- Analytics
- Delivery
- Financeiro
- Reservas
- Payments
- Subscriptions
- Landing
- Dashboard
- White Label
- SEO
- Storage
- Jobs
- API
- Observability

## Documentação Complementar

- [API](docs/api/README.md)
- [OpenAPI](docs/api/openapi.yaml)
- [Banco de Dados](docs/database.md)
- [CI/CD](docs/ci-cd.md)
- [Deploy](docs/deployment.md)
- [Quality](docs/quality.md)
- [Troubleshooting](docs/troubleshooting.md)

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm prisma:generate`
- `pnpm test:integration`
- `pnpm test:smoke`
- `pnpm test:performance`
- `pnpm test:stress`
- `pnpm test:coverage`

## Ambientes

- Development
- Validation
- Preview
- Staging
- Production

## Deploy

- Vercel via `vercel.json`
- Docker via `Dockerfile`
- Docker Compose via `docker-compose.yml`
- Railway via `railway.json`
- Render via `render.yaml`
- Fly.io via `fly.toml`
- Coolify via Dockerfile ou Compose
- Node server via `pnpm start`

## Observabilidade

- Health check em `/api/health`
- Monitoring em `/api/monitoring`
- Eventos de login, permissão, auditoria e métricas em memória para integração com provedores externos

## Troubleshooting

- Se o login falhar, verifique `AUTH_SECRET`, `AUTH_URL` e o seed de desenvolvimento.
- Se o build falhar, rode `pnpm prisma:generate` antes de `pnpm build`.
- Se a sessão cair no ambiente local, confirme `NEXT_PUBLIC_APP_URL` e o domínio da aplicação.
- Se um tenant não carregar o tema, verifique slug, restaurante ativo e dados de branding.

