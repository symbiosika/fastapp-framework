import { sql } from "drizzle-orm";
import {
  pgEnum,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { pgBaseTable } from ".";

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
]);

// Enum for one-time purchase status
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "succeeded",
  "failed",
  "pending",
]);

// Active Subscriptions Table
export const activeSubscriptions = pgBaseTable("active_subscriptions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  planName: text("plan_name").notNull(),
  currentPeriodStart: timestamp("current_period_start", {
    mode: "date",
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// One-time Purchases Table
export const oneTimePurchases = pgBaseTable("one_time_purchases", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  status: purchaseStatusEnum("status").notNull(),
  used: boolean("used").notNull().default(false),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull(),
  productName: text("product_name").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

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

export const oneTimePurchasesRelations = relations(
  oneTimePurchases,
  ({ one }) => ({
    user: one(users, {
      fields: [oneTimePurchases.userId],
      references: [users.id],
    }),
  })
);
