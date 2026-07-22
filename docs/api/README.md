# API

RestaurantPro expõe uma superfície pequena na camada HTTP e concentra a maior parte das regras em Server Actions e services.

## Endpoints REST

- `GET /api/health`
- `GET /api/monitoring`
- `GET|POST /api/auth/[...nextauth]`

## Autenticação

- Autenticação com NextAuth credentials.
- Rotas protegidas dependem de sessão autenticada e role autorizada.
- Em integrações externas, use headers e tokens da camada enterprise API descrita em `src/lib/enterprise/api`.

## Respostas

- `200` para leitura de saúde, monitoring e fluxos autenticados bem-sucedidos
- `401` para ausência de sessão
- `403` para role insuficiente
- `404` para rotas ausentes
- `500` para falha inesperada

## Erros

- O payload de erro segue o padrão de `message` quando a camada de domínio retorna falha.
- A API de saúde inclui estado do banco, métricas do processo e snapshot de observabilidade.

## Webhooks

- O modelo de webhook é documentado no OpenAPI.
- Eventos de pagamento, chargeback, refund e cancellation são os principais gatilhos do domínio financeiro.

