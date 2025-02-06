import { sql } from "drizzle-orm";
import {
  pgEnum,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { pgBaseTable } from ".";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";

// Enum for one-time purchase status
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "succeeded",
  "failed",
  "pending",
]);

// Enum for type of payment
export const purchaseTypeEnum = pgEnum("purchase_type", [
  "payment",
  "subscription",
]);

// Products and prices
export const products = pgBaseTable(
  "products",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    group: text("group").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: purchaseTypeEnum("type").notNull(),
    prodId: text("prod_id").notNull(),
    priceId: text("price_id").notNull(),
  },
  (products) => [
    index("products_group_idx").on(products.group),
    index("products_name_idx").on(products.name),
    index("products_type_idx").on(products.type),
    unique("products_prod_id_price_id_idx").on(
      products.prodId,
      products.priceId
    ),
  ]
);

export type ProductsSelect = typeof products.$inferSelect;
export type ProductsInsert = typeof products.$inferInsert;

export const productsSelectSchema = createSelectSchema(products);
export const productsInsertSchema = createInsertSchema(products);
export const productsUpdateSchema = createUpdateSchema(products);

// Active Subscriptions Table

export const activeSubscriptions = pgBaseTable(
  "active_subscriptions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    status: text("status").notNull(),
    planName: text("plan_name").notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      mode: "date",
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      mode: "date",
    }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("stripeCustomerIdPlanName").on(
      table.stripeCustomerId,
      table.planName
    ),
    index("stripe_customer_id_plan_name_index").on(
      table.stripeCustomerId,
      table.planName
    ),
    index("active_subscriptions_status_idx").on(table.status),
    index("active_subscriptions_created_at_idx").on(table.createdAt),
    index("active_subscriptions_updated_at_idx").on(table.updatedAt),
    index("active_subscriptions_cancel_at_period_end_idx").on(
      table.cancelAtPeriodEnd
    ),
    index("active_subscriptions_current_period_start_idx").on(
      table.currentPeriodStart
    ),
    index("active_subscriptions_current_period_end_idx").on(
      table.currentPeriodEnd
    ),
    index("active_subscriptions_user_id_idx").on(table.userId),
  ]
);

export type ActiveSubscriptionsSelect = typeof activeSubscriptions.$inferSelect;
export type ActiveSubscriptionsInsert = typeof activeSubscriptions.$inferInsert;

export const activeSubscriptionsSelectSchema =
  createSelectSchema(activeSubscriptions);
export const activeSubscriptionsInsertSchema =
  createInsertSchema(activeSubscriptions);
export const activeSubscriptionsUpdateSchema =
  createUpdateSchema(activeSubscriptions);
// One-time Purchases Table
export const purchases = pgBaseTable(
  "purchases",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    type: purchaseTypeEnum("type").notNull(),
    status: purchaseStatusEnum("status").notNull(),
    used: boolean("used").notNull().default(false),
    amount: integer("amount").notNull(), // Amount in cents
    currency: text("currency").notNull(),
    productName: text("product_name").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("purchases_created_at_idx").on(table.createdAt),
    index("purchases_updated_at_idx").on(table.updatedAt),
    index("purchases_user_id_idx").on(table.userId),
    index("purchases_status_idx").on(table.status),
    index("purchases_type_idx").on(table.type),
    index("purchases_used_idx").on(table.used),
    index("purchases_product_name_idx").on(table.productName),
  ]
);

export type PurchasesSelect = typeof purchases.$inferSelect;
export type PurchasesInsert = typeof purchases.$inferInsert;

export const purchasesSelectSchema = createSelectSchema(purchases);
export const purchasesInsertSchema = createInsertSchema(purchases);
export const purchasesUpdateSchema = createUpdateSchema(purchases);

// Relations

export const activeSubscriptionsRelations = relations(
  activeSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [activeSubscriptions.userId],
      references: [users.id],
    }),
  })
);

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));
