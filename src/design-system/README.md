# RestaurantPro Design System

O design system do RestaurantPro foi criado para manter consistência visual, acessibilidade e velocidade de composição em interfaces SaaS premium.

## Princípios

- Reutilizar componentes antes de criar variações novas.
- Preferir combinações de `Card`, `Button`, `Badge`, `Input` e `motion` em vez de estilos isolados.
- Manter foco visível, contraste alto e estados claros para `loading`, `error`, `success`, `empty` e `offline`.

## Como usar

Importe a partir de `src/components/design-system`:

```tsx
import { HeroSection, StatisticCard, EmptyState } from "@/components/design-system";
```

## Componentes principais

- `HeroSection`: abertura de páginas e landing areas.
- `PageHeader`: cabeçalhos de páginas e painéis.
- `SectionContainer`, `SectionTitle`, `SectionSubtitle`: estrutura de seções.
- `ResponsiveGrid`: layouts responsivos sem duplicação.
- `FeatureCard`, `RestaurantCard`, `StatisticCard`, `MetricCard`, `InfoCard`, `HighlightCard`, `TestimonialCard`, `PricingCard`, `HoverCard`, `GlassCard`: blocos de informação.
- `AnimatedButton`, `GradientButton`, `FloatingActionButton`: ações premium.
- `SearchBar`, `FilterBar`: filtros e busca.
- `AnimatedBadge`: pequenos destaques com movimento.
- `EmptyState`, `LoadingSkeleton`, `FeedbackState`: estados de interface.
- `ProfileAvatar`: avatar com fallback de iniciais.
- `Breadcrumb`, `Timeline`, `TableShell`, `ActionMenu`, `DialogSurface`, `DrawerSurface`: navegação e superfícies auxiliares.

## Boas práticas

- Use `GradientButton` para a ação primária e `Button` para ações secundárias.
- Use `GlassCard` e `HoverCard` com parcimônia para evitar excesso visual.
- Prefira `SectionContainer` para manter alinhamento e largura consistentes.
- Escolha `LoadingSkeleton` específico do contexto, como `menu` ou `dashboard`.
- Em feedbacks, escolha uma única mensagem principal por vez.

## Tokens

Os tokens globais ficam em `src/app/globals.css` e cobrem:

- cores
- fontes
- espaçamentos
- radius
- sombras
- gradientes
- transições

## Exemplos

### Hero

```tsx
<HeroSection
  eyebrow="RestaurantPro"
  title="Uma experiência premium para operar restaurantes"
  subtitle="Componentes reutilizáveis, consistência visual e foco em escalabilidade."
  primaryAction={{ label: "Explorar" }}
  secondaryAction={{ label: "Ver demonstração" }}
/>
```

### Cards

```tsx
<ResponsiveGrid>
  <FeatureCard title="Menu" description="Catálogo elegante e rápido." />
  <StatisticCard label="Pedidos" value="128" delta="+12%" />
</ResponsiveGrid>
```

### Estados

```tsx
<FeedbackState
  variant="offline"
  title="Sem conexão"
  description="Verifique sua internet e tente novamente."
/>
```
