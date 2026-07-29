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
]);

// Orders only come into existence once a seller hits "Mark as Sold" inside
// a conversation, so "pending"/"negotiating" are conversation-level states,
// not order-level ones — the order itself starts life already seller-side
// confirmed.
export const orderStatusEnum = pgEnum("order_status", [
  "seller_confirmed",
  "completed",
  "cancelled",
]);

// System messages ("Seller marked this as sold", etc.) are inserted by the
// app itself to surface order-flow events inline in the chat, rather than
// building a separate notification center.
export const messageTypeEnum = pgEnum("message_type", ["text", "system"]);

// ---------------------------------------------------------------------------
// Users — every student who signs up. A user becomes a "seller" the moment
// they open a tenant (store), but every user starts as a plain buyer.
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    username: text("username").notNull(),
    hostel: text("hostel"),
    branch: text("branch"),
    isAdmin: boolean("is_admin").notNull().default(false),
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
}));

// ---------------------------------------------------------------------------
// Tenants — one storefront per selling student. Kept 1:1 with a user for
// simplicity (a student runs a single stall), addressable at /store/[slug].
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
// Categories — flat list with an optional parent, for category/subcategory
// browsing (e.g. "Books" -> "Semester Notes").
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
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_tenant_idx").on(table.tenantId),
    index("products_category_idx").on(table.categoryId),
    index("products_archived_idx").on(table.isArchived),
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
// Orders — one row per product sold. Created the moment a seller hits
// "Mark as Sold" inside a conversation (already seller-confirmed at that
// point); becomes "completed" once the buyer confirms they received the
// item. Buyer and seller settle payment offline — the app just tracks the
// order's status through that offline handoff.
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
// Reviews — one per buyer per product, and only after a completed order.
// ---------------------------------------------------------------------------

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable so existing/demo reviews that predate the order flow keep
    // working; the review actions always set it for anything submitted
    // through the app from here on.
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "cascade",
    }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Null = the buyer reviewing the product/listing (shows on the product
    // page). Set = the seller reviewing this buyer (shows on their profile
    // as a buyer, not tied to any product's star rating).
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
// Conversations — one private thread per (buyer, seller, product). Created
// the moment a buyer hits "Message Seller"; this is where price, condition,
// and pickup details get negotiated before an offline handoff.
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
    // Bumped on every new message so the conversation list can sort by
    // "most recently active" without a join against messages.
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // One thread per buyer+seller+product — this is what makes "Message
    // Seller" idempotent (open existing thread instead of duplicating it).
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
// Messages — individual chat messages within a conversation. A message
// carries text, an image, or both.
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
