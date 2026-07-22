export type Role = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "STAFF" | "DRIVER";

export type RestaurantWeeklyHour = {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  open: string;
  close: string;
  closed: boolean;
};

export type RestaurantHoliday = {
  date: string;
  label: string;
  closed: boolean;
};

export type RestaurantIntegrations = {
  cloudinary: {
    enabled: boolean;
    cloudName: string;
    uploadPreset: string;
  };
  googleMaps: {
    enabled: boolean;
    apiKey: string;
    placeId: string;
  };
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
  };
  metaPixel: {
    enabled: boolean;
    pixelId: string;
  };
  whatsapp: {
    enabled: boolean;
    phone: string;
  };
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  favicon: string | null;
  banner: string | null;
  coverImage: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  surfaceColor: string | null;
  textColor: string | null;
  successColor: string | null;
  warningColor: string | null;
  errorColor: string | null;
  fontFamily: string | null;
  borderRadius: string | null;
  buttonStyle: string | null;
  cardStyle: string | null;
  heroStyle: string | null;
  footerStyle: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  website: string | null;
  phone: string | null;
  supportPhone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  slogan: string | null;
  history: string | null;
  mission: string | null;
  description: string | null;
  state: string | null;
  neighborhood: string | null;
  street: string | null;
  number: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: string | null;
  timezone: string | null;
  currency: string | null;
  language: string | null;
  country: string | null;
  city: string | null;
  weeklyHours: RestaurantWeeklyHour[] | null;
  holidays: RestaurantHoliday[] | null;
  isOpen: boolean | null;
  minimumOrderAmount: number | null;
  deliveryFee: number | null;
  deliveryRadiusKm: number | null;
  averagePreparationTime: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  integrations: RestaurantIntegrations | null;
  subscriptionPlan: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: number;
  promotionalPrice: number | null;
  active: boolean;
  featured: boolean;
  preparationTime: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Table = {
  id: string;
  restaurantId: string;
  number: number;
  capacity: number;
  qrCode: string;
  active: boolean;
};

export type Customer = {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  email: string | null;
  birthday: Date | null;
  city: string | null;
  country: string | null;
  status: "ACTIVE" | "VIP" | "INACTIVE" | "BLOCKED";
  tags: string[] | null;
  lastVisitAt: Date | null;
  totalSpent: number;
  averageTicket: number;
  frequency: number;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerProfile = {
  id: string;
  restaurantId: string;
  customerId: string;
  notes: string | null;
  occupation: string | null;
  preferredLanguage: string | null;
  marketingConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerAddress = {
  id: string;
  restaurantId: string;
  customerId: string;
  label: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  complement: string | null;
  isDefault: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerPreferences = {
  id: string;
  restaurantId: string;
  customerId: string;
  favoriteCategories: unknown | null;
  favoriteProducts: unknown | null;
  dietaryRestrictions: unknown | null;
  channels: unknown | null;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
  smsOptIn: boolean;
  pushOptIn: boolean;
  birthdayOptIn: boolean;
  marketingOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerSegment = {
  id: string;
  restaurantId: string;
  name: string;
  type: "NEW" | "RECURRING" | "VIP" | "INACTIVE" | "BIRTHDAY" | "HIGH_VALUE" | "LOW_VALUE";
  description: string | null;
  color: string | null;
  rule: unknown | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type LoyaltyAccount = {
  id: string;
  restaurantId: string;
  customerId: string;
  pointsBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  pointsExpiryDays: number | null;
  rewardTier: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type LoyaltyTransaction = {
  id: string;
  loyaltyAccountId: string;
  restaurantId: string;
  customerId: string;
  type: "EARN" | "REDEEM" | "EXPIRE" | "ADJUST";
  points: number;
  orderId: string | null;
  reservationId: string | null;
  notes: string | null;
  metadata: unknown | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type Coupon = {
  id: string;
  restaurantId: string;
  segmentId: string | null;
  code: string;
  name: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "FIRST_PURCHASE" | "BIRTHDAY" | "SEGMENT" | "PERIOD";
  value: number;
  minimumOrderAmount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  stackable: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CouponUsage = {
  id: string;
  couponId: string;
  restaurantId: string;
  customerId: string | null;
  orderId: string | null;
  reservationId: string | null;
  usedAt: Date;
  discountAmount: number;
  metadata: unknown | null;
};

export type CashbackAccount = {
  id: string;
  restaurantId: string;
  customerId: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CashbackTransaction = {
  id: string;
  cashbackAccountId: string;
  restaurantId: string;
  customerId: string;
  type: "CREDIT" | "DEBIT" | "EXPIRE" | "REDEEM" | "REFUND";
  amount: number;
  orderId: string | null;
  reservationId: string | null;
  notes: string | null;
  metadata: unknown | null;
  createdAt: Date;
};

export type Campaign = {
  id: string;
  restaurantId: string;
  name: string;
  channel: "WHATSAPP" | "EMAIL" | "SMS" | "PUSH";
  status: "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED";
  subject: string | null;
  message: string | null;
  audience: unknown | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  totalRecipients: number;
  totalDelivered: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignRecipient = {
  id: string;
  campaignId: string;
  restaurantId: string;
  customerId: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  deliveredAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentGatewayProvider =
  | "STRIPE"
  | "MERCADO_PAGO"
  | "PAYPAL"
  | "PAGAR_ME"
  | "ASAAS"
  | "YOOKASSA"
  | "M_PESA"
  | "UNITEL_MONEY";

export type PaymentMethodType =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "PIX"
  | "TRANSFER"
  | "DIGITAL_WALLET"
  | "IN_PERSON"
  | "QR_CODE"
  | "PARTIAL"
  | "SPLIT";

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CHARGEBACK";

export type RefundStatus = "REQUESTED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED";

export type InvoiceStatus = "PENDING" | "PAID" | "CANCELED" | "REFUNDED" | "OVERDUE";

export type InstallmentStatus = "PENDING" | "PAID" | "CANCELED" | "OVERDUE";

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "RETRYING" | "CANCELED";

export type PaymentTransactionType = "AUTHORIZE" | "CAPTURE" | "SETTLEMENT" | "VOID" | "REFUND" | "CHARGEBACK" | "ADJUSTMENT";

export type FinancialMovementType = "REVENUE" | "EXPENSE" | "REFUND" | "FEE" | "TAX" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT";

export type GatewayLogStatus = "SUCCESS" | "FAILED" | "RETRYING" | "PENDING";

export type WebhookEventStatus = "RECEIVED" | "PROCESSED" | "FAILED" | "RETRYING";

export type WebhookEventType = "PAYMENT_APPROVED" | "PAYMENT_REJECTED" | "PAYMENT_PENDING" | "CHARGEBACK" | "REFUND" | "CANCELLATION";

export type PaymentMethod = {
  id: string;
  restaurantId: string;
  code: string;
  name: string;
  type: PaymentMethodType;
  gatewayProvider: PaymentGatewayProvider | null;
  supportsInstallments: boolean;
  supportsPartial: boolean;
  active: boolean;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Wallet = {
  id: string;
  restaurantId: string;
  name: string;
  currency: string;
  balance: number;
  reservedBalance: number;
  provider: PaymentGatewayProvider | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: string;
  restaurantId: string;
  orderId: string | null;
  customerId: string | null;
  invoiceId: string | null;
  paymentMethodId: string;
  gatewayProvider: PaymentGatewayProvider;
  status: PaymentStatus;
  subtotal: number;
  tax: number;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  cashbackDiscount: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  currency: string;
  reference: string | null;
  gatewayReference: string | null;
  paidAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  restaurantId: string;
  paymentId: string;
  gatewayProvider: PaymentGatewayProvider;
  type: PaymentTransactionType;
  status: TransactionStatus;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  externalId: string | null;
  reference: string | null;
  responseTimeMs: number;
  retryCount: number;
  payload: unknown | null;
  response: unknown | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
};

export type Refund = {
  id: string;
  restaurantId: string;
  paymentId: string;
  transactionId: string | null;
  gatewayProvider: PaymentGatewayProvider;
  type: "TOTAL" | "PARTIAL" | "AUTOMATIC" | "MANUAL";
  status: RefundStatus;
  amount: number;
  reason: string | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Invoice = {
  id: string;
  restaurantId: string;
  orderId: string | null;
  paymentId: string | null;
  customerId: string | null;
  number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  pdfUrl: string | null;
  emailedAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Installment = {
  id: string;
  restaurantId: string;
  paymentId: string;
  number: number;
  total: number;
  amount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentStatus;
  gatewayReference: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FinancialMovement = {
  id: string;
  restaurantId: string;
  walletId: string | null;
  paymentId: string | null;
  invoiceId: string | null;
  refundId: string | null;
  type: FinancialMovementType;
  category: string;
  amount: number;
  balanceAfter: number;
  costCenter: string | null;
  notes: string | null;
  metadata: unknown | null;
  createdAt: Date;
};

export type GatewayLog = {
  id: string;
  restaurantId: string;
  gatewayProvider: PaymentGatewayProvider;
  action: string;
  status: GatewayLogStatus;
  payload: unknown | null;
  response: unknown | null;
  durationMs: number;
  error: string | null;
  retryCount: number;
  createdAt: Date;
};

export type WebhookEvent = {
  id: string;
  restaurantId: string;
  gatewayProvider: PaymentGatewayProvider;
  eventType: WebhookEventType;
  externalId: string | null;
  status: WebhookEventStatus;
  payload: unknown | null;
  processedAt: Date | null;
  error: string | null;
  attempts: number;
  retryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ReservationSource =
  | "WEBSITE"
  | "WHATSAPP"
  | "PHONE"
  | "ADMIN"
  | "WALK_IN";

export type ReservationHistoryAction =
  | "CREATED"
  | "UPDATED"
  | "CANCELLED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED";

export type Reservation = {
  id: string;
  restaurantId: string;
  tableId: string;
  customerId: string | null;
  createdByUserId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  guests: number;
  reservationDate: string;
  reservationTime: string;
  duration: number;
  status: ReservationStatus;
  notes: string | null;
  confirmationCode: string;
  source: ReservationSource;
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationHistory = {
  id: string;
  reservationId: string;
  restaurantId: string;
  actorUserId: string | null;
  action: ReservationHistoryAction;
  notes: string | null;
  metadata: unknown | null;
  createdAt: Date;
};

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "CANCELED";

export type DeliveryOrderStatus = "RECEIVED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELED";

export type DriverStatus = "AVAILABLE" | "BUSY" | "OFFLINE" | "IN_DELIVERY";

export type DriverShiftStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "MISSED" | "CANCELED";

export type DeliveryZoneType = "NEIGHBORHOOD" | "POSTAL_CODE" | "RADIUS" | "POLYGON";

export type DeliveryFeeType = "FIXED" | "DISTANCE" | "ZONE" | "FREE_SHIPPING" | "MINIMUM_ORDER" | "PROMOTION";

export type DispatchMode = "MANUAL" | "AUTOMATIC";

export type DispatchStatus = DeliveryOrderStatus;

export type MapProvider = "GOOGLE_MAPS" | "MAPBOX" | "OPENSTREETMAP";

export type RouteStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

export type TrackingEventType =
  | "ORDER_RECEIVED"
  | "PREPARING"
  | "READY"
  | "DRIVER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "LOCATION_UPDATE"
  | "DELIVERED"
  | "CANCELED"
  | "ETA_UPDATED"
  | "DELAYED";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type Order = {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  tableId: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export type OrderWithDetails = Order & {
  table: Table;
  items: OrderItemWithProduct[];
};

export type DeliveryAddress = {
  id: string;
  restaurantId: string;
  customerId: string | null;
  label: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  complement: string | null;
  notes: string | null;
  isDefault: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Driver = {
  id: string;
  restaurantId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  licenseNumber: string | null;
  status: DriverStatus;
  currentZoneId: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  rating: number;
  totalDeliveries: number;
  totalDistanceKm: number;
  active: boolean;
  onlineSince: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DriverShift = {
  id: string;
  restaurantId: string;
  driverId: string;
  startAt: Date;
  endAt: Date;
  status: DriverShiftStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliveryZone = {
  id: string;
  restaurantId: string;
  name: string;
  type: DeliveryZoneType;
  description: string | null;
  neighborhood: string | null;
  postalCodes: string[] | null;
  polygon: Array<{ latitude: number; longitude: number }> | null;
  radiusKm: number | null;
  centerLatitude: number | null;
  centerLongitude: number | null;
  priority: number;
  minOrderAmount: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliveryFee = {
  id: string;
  restaurantId: string;
  zoneId: string | null;
  name: string;
  type: DeliveryFeeType;
  fixedAmount: number | null;
  perKmAmount: number | null;
  minimumOrderAmount: number | null;
  freeShippingThreshold: number | null;
  promotionLabel: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Route = {
  id: string;
  restaurantId: string;
  orderId: string | null;
  dispatchId: string | null;
  driverId: string | null;
  provider: MapProvider;
  distanceKm: number;
  durationMinutes: number;
  etaAt: Date | null;
  polyline: string | null;
  status: RouteStatus;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TrackingEvent = {
  id: string;
  restaurantId: string;
  orderId: string | null;
  dispatchId: string | null;
  driverId: string | null;
  routeId: string | null;
  type: TrackingEventType;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  etaMinutes: number | null;
  actualAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Dispatch = {
  id: string;
  restaurantId: string;
  orderId: string;
  driverId: string | null;
  mode: DispatchMode;
  status: DispatchStatus;
  priority: number;
  queuePosition: number;
  notes: string | null;
  assignedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliverySettings = {
  id: string;
  restaurantId: string;
  defaultDispatchMode: DispatchMode;
  autoAssignDrivers: boolean;
  allowScheduledDelivery: boolean;
  defaultEstimatedMinutes: number;
  mapProvider: MapProvider;
  notificationChannels: {
    push: boolean;
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
  preparedForRealtimeTracking: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliveryTimelineItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  createdAt: Date;
};

export type DeliveryDashboardKpis = {
  ordersInDelivery: number;
  averageDeliveryTimeMinutes: number;
  completedDeliveries: number;
  lateDeliveries: number;
  cancellations: number;
  topDriverName: string | null;
  averageDeliveryFee: number;
  revenueDelivery: number;
};

export type DeliveryDashboard = {
  restaurantId: string;
  drivers: Driver[];
  shifts: DriverShift[];
  zones: DeliveryZone[];
  fees: DeliveryFee[];
  routes: Route[];
  dispatches: Dispatch[];
  trackingEvents: TrackingEvent[];
  settings: DeliverySettings;
  timeline: DeliveryTimelineItem[];
  charts: {
    deliveriesByDay: Array<{ label: string; value: number }>;
    averageTime: Array<{ label: string; value: number }>;
    drivers: Array<{ label: string; value: number }>;
    zones: Array<{ label: string; value: number }>;
  };
  kpis: DeliveryDashboardKpis;
};

export type Organization = {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  billingEmail: string | null;
  ownerName: string | null;
  trialEndsAt: Date | null;
  currentRestaurantId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Plan = {
  id: string;
  code: "starter" | "basic" | "pro" | "premium" | "enterprise" | string;
  name: string;
  description: string | null;
  billingInterval: "MONTHLY" | "YEARLY";
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  features: unknown | null;
  limits: unknown | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Subscription = {
  id: string;
  organizationId: string;
  restaurantId: string;
  planId: string;
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "SUSPENDED";
  billingInterval: "MONTHLY" | "YEARLY";
  trialEndsAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  seats: number;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type License = {
  id: string;
  organizationId: string;
  restaurantId: string;
  key: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  seats: number;
  activatedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RestaurantMember = {
  id: string;
  organizationId: string;
  restaurantId: string;
  userId: string | null;
  name: string;
  email: string;
  role: Role;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INVITED";
  invitedByUserId: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Invitation = {
  id: string;
  organizationId: string;
  restaurantId: string;
  email: string;
  role: Role;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELED";
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLog = {
  id: string;
  organizationId: string;
  restaurantId: string;
  actorUserId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: unknown | null;
  createdAt: Date;
};

export type ApiKey = {
  id: string;
  organizationId: string;
  restaurantId: string;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: string[] | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Usage = {
  id: string;
  organizationId: string;
  restaurantId: string;
  metric: string;
  period: string;
  used: number;
  limit: number | null;
  resetAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UsageLimit = {
  id: string;
  planId: string;
  metric: string;
  limit: number;
  hardLimit: boolean;
  warningThreshold: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingHistory = {
  id: string;
  organizationId: string;
  restaurantId: string;
  subscriptionId: string | null;
  invoiceNumber: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "VOID";
  amount: number;
  currency: string;
  description: string | null;
  periodStart: Date;
  periodEnd: Date;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminDashboard = {
  organizations: Organization[];
  restaurants: Restaurant[];
  subscriptions: Subscription[];
  plans: Plan[];
  licenses: License[];
  members: RestaurantMember[];
  invitations: Invitation[];
  apiKeys: ApiKey[];
  usages: Usage[];
  limits: UsageLimit[];
  billingHistory: BillingHistory[];
  auditLogs: AuditLog[];
  selectedOrganizationId: string;
  kpis: {
    mrr: number;
    arr: number;
    ltv: number;
    cac: number;
    churn: number;
    revenue: number;
    newCustomers: number;
    trialConversion: number;
    planConversion: number;
  };
};

export type SubscriptionDashboard = {
  subscriptions: Subscription[];
  plans: Plan[];
  usage: Usage[];
  limits: UsageLimit[];
  billingHistory: BillingHistory[];
  kpis: {
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
    renewals: number;
    trialEndsSoon: number;
  };
};

export type PlansDashboard = {
  plans: Plan[];
  limits: UsageLimit[];
  kpis: {
    activePlans: number;
    starter: number;
    basic: number;
    pro: number;
    premium: number;
    enterprise: number;
  };
};

export type ReservationWithDetails = Reservation & {
  table: Table;
  customer: Customer | null;
  history: ReservationHistory[];
};

export type ReservationAvailabilityStatus = "FREE" | "RESERVED" | "OCCUPIED" | "UNAVAILABLE" | "CLEANING";

export type User = {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  password: string;
  image: string | null;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionUser = {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  active: boolean;
};

export type SessionRestaurant = Restaurant;
