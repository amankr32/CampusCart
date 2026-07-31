import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "like_new",
  "good",
  "fair",
  "worn",
]);

export const productStatusEnum = pgEnum("product_status", [
  "available",
  "reserved",
  "sold",
  "hidden",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "seller_confirmed",
  "completed",
  "cancelled",
]);

export const messageTypeEnum = pgEnum("message_type", ["text", "system"]);

export const studentStatusEnum = pgEnum("student_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "dismissed",
  "actioned",
]);

export const reportTargetEnum = pgEnum("report_target", ["product", "user"]);

// ---------------------------------------------------------------------------
// Users — every student who signs up for Campus Cart
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    username: text("username").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    yearSemester: text("year_semester"),
    hostel: text("hostel"),
    branch: text("branch"),
    isAdmin: boolean("is_admin").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
    studentStatus: studentStatusEnum("student_status")
      .notNull()
      .default("unverified"),
    trustScore: integer("trust_score").notNull().default(20),
    rejectionReason: text("rejection_reason"),
    lastActiveAt: timestamp("last_active_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_username_idx").on(table.username),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.id],
    references: [tenants.ownerId],
  }),
  orders: many(orders),
  reviews: many(reviews, { relationName: "reviews_authored" }),
  reviewsAsBuyer: many(reviews, { relationName: "reviews_received_as_buyer" }),
  conversationsAsBuyer: many(conversations, {
    relationName: "conversations_as_buyer",
  }),
  conversationsAsSeller: many(conversations, {
    relationName: "conversations_as_seller",
  }),
  messages: many(messages),
  studentVerifications: many(studentVerifications),
  reportsSubmitted: many(reports),
}));

// ---------------------------------------------------------------------------
// Verification Codes — 6-digit email OTPs for initial registration
// ---------------------------------------------------------------------------

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("verification_codes_email_idx").on(table.email)]
);

// ---------------------------------------------------------------------------
// Password Reset Tokens — single-use secure reset link tokens
// ---------------------------------------------------------------------------

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("password_reset_token_idx").on(table.token),
    index("password_reset_email_idx").on(table.email),
  ]
);

// ---------------------------------------------------------------------------
// Student Verification Requests — PTU portal verification with anti-fraud code
// ---------------------------------------------------------------------------

export const studentVerifications = pgTable(
  "student_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ptuRollNo: text("ptu_roll_no").notNull(),
    portalScreenshotUrl: text("portal_screenshot_url").notNull(),
    liveVerificationCode: text("live_verification_code").notNull(),
    status: verificationStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("student_verifications_user_idx").on(table.userId),
    index("student_verifications_status_idx").on(table.status),
  ]
);

export const studentVerificationsRelations = relations(
  studentVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [studentVerifications.userId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [studentVerifications.reviewedBy],
      references: [users.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Tenants — one storefront per selling student (addressable at /store/[slug])
// ---------------------------------------------------------------------------

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeName: text("store_name").notNull(),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tenants_slug_idx").on(table.slug),
    uniqueIndex("tenants_owner_idx").on(table.ownerId),
  ]
);

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, {
    fields: [tenants.ownerId],
    references: [users.id],
  }),
  products: many(products),
}));

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    parentId: uuid("parent_id"),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)]
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
  products: many(products),
}));

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    condition: productConditionEnum("condition").notNull().default("good"),
    status: productStatusEnum("status").notNull().default("available"),
    quantity: integer("quantity").notNull().default(1),
    hostel: text("hostel"),
    branch: text("branch"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    views: integer("views").notNull().default(0),
    favoritesCount: integer("favorites_count").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_tenant_idx").on(table.tenantId),
    index("products_category_idx").on(table.categoryId),
    index("products_archived_idx").on(table.isArchived),
    index("products_status_idx").on(table.status),
  ]
);

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
  orders: many(orders),
  conversations: many(conversations),
}));

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    totalCents: integer("total_cents").notNull(),
    status: orderStatusEnum("status").notNull().default("seller_confirmed"),
    sellerConfirmedAt: timestamp("seller_confirmed_at").notNull().defaultNow(),
    buyerConfirmedAt: timestamp("buyer_confirmed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("orders_buyer_idx").on(table.buyerId),
    index("orders_tenant_idx").on(table.tenantId),
    index("orders_conversation_idx").on(table.conversationId),
  ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [orders.conversationId],
    references: [conversations.id],
  }),
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  reviews: many(reviews),
}));

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "cascade",
    }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    revieweeId: uuid("reviewee_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    rating: integer("rating").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_order_user_idx").on(table.orderId, table.userId),
    index("reviews_product_idx").on(table.productId),
    index("reviews_reviewee_idx").on(table.revieweeId),
  ]
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
    relationName: "reviews_authored",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviews_received_as_buyer",
  }),
}));

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("conversations_buyer_seller_product_idx").on(
      table.buyerId,
      table.sellerId,
      table.productId
    ),
    index("conversations_buyer_idx").on(table.buyerId),
    index("conversations_seller_idx").on(table.sellerId),
    index("conversations_product_idx").on(table.productId),
  ]
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    product: one(products, {
      fields: [conversations.productId],
      references: [products.id],
    }),
    buyer: one(users, {
      fields: [conversations.buyerId],
      references: [users.id],
      relationName: "conversations_as_buyer",
    }),
    seller: one(users, {
      fields: [conversations.sellerId],
      references: [users.id],
      relationName: "conversations_as_seller",
    }),
    messages: many(messages),
  })
);

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: messageTypeEnum("type").notNull().default("text"),
    message: text("message"),
    image: text("image"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
  ]
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Reports — User and Listing Moderation System
// ---------------------------------------------------------------------------

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: reportTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    details: text("details"),
    status: reportStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("reports_reporter_idx").on(table.reporterId),
    index("reports_status_idx").on(table.status),
  ]
);

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Audit Logs — Security and Action Tracking
// ---------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("audit_logs_user_idx").on(table.userId)]
);
