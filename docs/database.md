# Banco de Dados

RestaurantPro usa Prisma com MongoDB e modelagem multi-tenant por `restaurantId`, além de `organizationId` nos fluxos enterprise.

## Enums

### Acesso e operação

- `Role`
- `OrderStatus`
- `DeliveryOrderStatus`
- `DriverStatus`
- `DriverShiftStatus`
- `DispatchMode`
- `RouteStatus`
- `SubscriptionStatus`
- `BillingInterval`
- `LicenseStatus`
- `InvitationStatus`
- `RestaurantMemberStatus`

### Delivery e logística

- `DeliveryZoneType`
- `DeliveryFeeType`
- `MapProvider`
- `TrackingEventType`

### CRM e relacionamento

- `ReservationStatus`
- `ReservationSource`
- `ReservationHistoryAction`
- `CustomerStatus`
- `CustomerSegmentType`
- `LoyaltyRewardType`
- `LoyaltyTransactionType`
- `CouponType`
- `CashbackTransactionType`
- `CampaignChannel`
- `CampaignStatus`
- `CampaignRecipientStatus`

### Pagamentos e financeiro

- `PaymentGatewayProvider`
- `PaymentMethodType`
- `PaymentStatus`
- `RefundStatus`
- `InvoiceStatus`
- `InstallmentStatus`
- `TransactionStatus`
- `PaymentTransactionType`
- `FinancialMovementType`
- `GatewayLogStatus`
- `WebhookEventStatus`
- `WebhookEventType`
- `UsageMetric`
- `BillingHistoryStatus`

## Modelos

| Model | Relações principais | Índices e unicidades |
| --- | --- | --- |
| `Restaurant` | base de todos os domínios | `active` |
| `User` | `restaurant`, `createdReservations`, `reservationHistory` | `restaurantId`, `role`, `active` |
| `Customer` | `restaurant` | `restaurantId`, `restaurantId, createdAt`, `email`, `status`, `active`, `restaurantId, phone` |
| `Category` | `restaurant` | `restaurantId`, `active`, `restaurantId, createdAt`, `sortOrder`, `restaurantId, slug` |
| `Product` | `restaurant`, `category` | `restaurantId`, `categoryId`, `active`, `featured`, `restaurantId, createdAt`, `restaurantId, slug` |
| `Table` | `restaurant` | `restaurantId`, `active`, `restaurantId, number` |
| `Order` | `restaurant`, `table` | `restaurantId`, `tableId`, `status`, `restaurantId, createdAt`, `restaurantId, status, createdAt` |
| `OrderItem` | `order`, `product` | `orderId`, `productId` |
| `Reservation` | `restaurant`, `table`, `customer`, `createdByUser` | `restaurantId`, `restaurantId, tableId`, `restaurantId, reservationDate`, `restaurantId, status`, `restaurantId, confirmationCode` |
| `ReservationHistory` | `reservation`, `restaurant`, `actorUser` | `reservationId`, `restaurantId`, `action`, `restaurantId, createdAt` |
| `CustomerProfile` | `restaurant`, `customer` | `restaurantId` |
| `CustomerAddress` | `restaurant`, `customer` | `restaurantId`, `customerId` |
| `CustomerPreferences` | `restaurant`, `customer` | `restaurantId` |
| `CustomerSegment` | `restaurant` | `restaurantId`, `type` |
| `LoyaltyAccount` | `restaurant`, `customer` | `restaurantId` |
| `LoyaltyTransaction` | `loyaltyAccount`, `restaurant`, `customer` | `loyaltyAccountId`, `restaurantId`, `customerId` |
| `Coupon` | `restaurant`, `segment` | `restaurantId`, `type`, `active`, `restaurantId, code` |
| `CouponUsage` | `coupon`, `restaurant`, `customer` | `couponId`, `restaurantId`, `customerId` |
| `CashbackAccount` | `restaurant`, `customer` | `restaurantId` |
| `CashbackTransaction` | `cashbackAccount`, `restaurant`, `customer` | `cashbackAccountId`, `restaurantId`, `customerId` |
| `Campaign` | `restaurant` | `restaurantId`, `channel`, `status` |
| `CampaignRecipient` | `campaign`, `restaurant`, `customer` | `campaignId`, `restaurantId`, `customerId` |
| `PaymentMethod` | `restaurant` | `restaurantId`, `type`, `active`, `restaurantId, code` |
| `Payment` | `restaurant`, `paymentMethod` | `restaurantId`, `orderId`, `customerId`, `status`, `gatewayProvider` |
| `Transaction` | `restaurant`, `payment` | `restaurantId`, `paymentId`, `gatewayProvider`, `status` |
| `Refund` | `restaurant`, `payment` | `restaurantId`, `restaurantId, createdAt`, `paymentId`, `status` |
| `Invoice` | `restaurant` | `restaurantId`, `orderId`, `paymentId`, `status`, `restaurantId, number` |
| `Installment` | `restaurant`, `payment` | `restaurantId`, `restaurantId, createdAt`, `paymentId`, `status` |
| `FinancialMovement` | `restaurant`, `wallet` | `restaurantId`, `restaurantId, createdAt`, `walletId`, `type` |
| `Wallet` | `restaurant` | `restaurantId`, `active` |
| `GatewayLog` | `restaurant` | `restaurantId`, `restaurantId, createdAt`, `gatewayProvider`, `status` |
| `WebhookEvent` | `restaurant` | `restaurantId`, `restaurantId, createdAt`, `gatewayProvider`, `eventType`, `status` |
| `DeliveryAddress` | `restaurant` | `restaurantId`, `customerId`, `active` |
| `Driver` | `restaurant` | `restaurantId`, `status`, `active` |
| `DriverShift` | `restaurant`, `driver` | `restaurantId`, `driverId`, `status` |
| `DeliveryZone` | `restaurant` | `restaurantId`, `type`, `active` |
| `DeliveryFee` | `restaurant` | `restaurantId`, `zoneId`, `type`, `active` |
| `Dispatch` | `restaurant` | `restaurantId`, `orderId`, `driverId`, `status` |
| `Route` | `restaurant` | `restaurantId`, `orderId`, `dispatchId`, `driverId`, `status` |
| `TrackingEvent` | `restaurant` | `restaurantId`, `orderId`, `dispatchId`, `driverId`, `routeId`, `type` |
| `DeliverySettings` | `restaurant` | sem índices extras |
| `Organization` | `restaurant` | `active`, `slug` unique |
| `Plan` | independente | `active` |
| `Subscription` | `organization`, `restaurant`, `plan` | `restaurantId`, `planId`, `status`, `organizationId` unique |
| `License` | `organization`, `restaurant` | `organizationId`, `restaurantId`, `status` |
| `RestaurantMember` | `organization`, `restaurant` | `restaurantId`, `role`, `status`, `organizationId, email` unique |
| `Invitation` | `organization`, `restaurant` | `restaurantId`, `status`, `organizationId, email` unique |
| `AuditLog` | `organization`, `restaurant` | `organizationId`, `restaurantId`, `action`, `resource`, `restaurantId, createdAt`, `organizationId, createdAt` |
| `ApiKey` | `organization`, `restaurant` | `organizationId`, `restaurantId`, `active` |
| `Usage` | `organization`, `restaurant` | `restaurantId`, `metric`, `organizationId, restaurantId, createdAt`, `organizationId, metric, period` unique |
| `UsageLimit` | `plan` | `metric`, `active`, `planId, metric` unique |
| `BillingHistory` | `organization`, `restaurant`, `subscription` | `organizationId`, `restaurantId`, `subscriptionId`, `status`, `organizationId, restaurantId, createdAt` |

## Relações

- `Restaurant` é a raiz de tenant para catálogo, pedidos, reservas, delivery, CRM, pagamentos e observabilidade.
- `Organization` concentra o pacote enterprise com assinatura, licença, membros, convites, chaves e auditoria.
- `Subscription`, `License`, `BillingHistory`, `Usage` e `UsageLimit` sustentam billing e controle de consumo.
- `Payment`, `Transaction`, `Refund`, `Invoice`, `Installment`, `GatewayLog` e `WebhookEvent` formam a espinha financeira.
- `Order`, `Reservation`, `Dispatch`, `Route` e `TrackingEvent` cobrem a operação diária.

## Fluxos

1. Cadastro/seed cria restaurante, usuários, catálogo e mesas.
2. Login valida credenciais, ativo do usuário e ativo do restaurante.
3. Actions de catálogo consultam `restaurantId`, geram slug e revalidam cache.
4. Reservas registram histórico com autoria.
5. Financeiro agrega pagamentos, transações, refunds e movimentos por tenant.
6. Delivery amarra pedidos, entregadores, rotas e rastreamento.
7. Enterprise usa organization, subscription, license e usage para governança.

