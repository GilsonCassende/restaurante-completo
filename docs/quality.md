# Quality

## Testes

- Smoke tests: caminhos críticos e pure functions
- Integration tests: fluxos de domínio e repositório
- Performance tests: loops e hot paths
- Stress tests: limites de buffers e stores em memória

## Cobertura

- A base já está preparada para gerar relatórios de cobertura em pipeline.
- Use o alvo `pnpm test:coverage` para validar a suíte com cobertura do Node.

## Revisão Final

Checklist de revisão antes do deploy:

- Imports mortos
- Duplicações
- Warnings de TypeScript
- Tipos inconsistentes
- Fluxos sem tenant
- Regras de autorização ausentes
- Paths sem revalidação
- Rotas públicas sem proteção

## Otimizações

- Server Components por padrão
- Server Actions para mutações
- Cache com tags por tenant
- Dynamic imports apenas onde já há benefício
- Tree shaking habilitado pelo bundle do Next

