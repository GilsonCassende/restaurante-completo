# Deploy

## Vercel

- Usar `vercel.json` para comandos e headers.
- Build command: `pnpm build`.
- Install command: `pnpm install`.

## Docker

- `Dockerfile` multi-stage para produção.
- `docker-compose.yml` para desenvolvimento local e validação.

## Railway

- `railway.json` aponta o comando de start e a porta.

## Render

- `render.yaml` descreve web service com health check.

## Fly.io

- `fly.toml` define app, health check e porta HTTP.

## Coolify

- Usar o `Dockerfile` ou `docker-compose.yml` como base.
- Configurar variáveis de ambiente por ambiente.

## Node Server

- `pnpm start` executa o servidor em produção.
- Use um process manager externo se necessário.

## Ambientes

- Development
- Validation
- Preview
- Staging
- Production

