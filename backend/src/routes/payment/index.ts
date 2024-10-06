import { stripeService } from "../../lib/payment/stripe";
import { getDb } from "../../lib/db/db-connection";
import { activeSubscriptions } from "../../lib/db/schema/payment";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { FastAppHono } from "../../index.d";
import type { StripeDetailedItem } from "src/lib/types/shared/payment";

/**
 * Check if the user has an active subscription
 */
export async function checkUserSubscription(
  userId: string
): Promise<{ valid: boolean; end?: string }> {
  const db = getDb();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const subscription = await db
    .select()
    .from(activeSubscriptions)
    .where(eq(activeSubscriptions.userId, userId))
    .limit(1);

  if (subscription.length > 0) {
    if (subscription[0].updatedAt >= yesterday) {
      // Subscription data is recent, return it
      return {
        valid: subscription[0].status === "active",
        end: subscription[0].currentPeriodEnd.toISOString(),
      };
    } else {
      // Subscription data is old, check with Stripe
      const stripeSubscription = await stripeService.hasValidSubscription(
        subscription[0].stripeCustomerId
      );

      // Update local database
      await db
        .update(activeSubscriptions)
        .set({
          status: stripeSubscription.valid ? "active" : "canceled",
          currentPeriodEnd: stripeSubscription.end
            ? new Date(stripeSubscription.end)
            : now,
          updatedAt: now,
        })
        .where(eq(activeSubscriptions.userId, userId));

      return stripeSubscription;
    }
  }

  // No subscription found
  return { valid: false };
}

/**
 * Define the payment routes
 */
export default function defineRoutes(app: FastAppHono) {
  // List all products
  app.get("/products", async (c) => {
    const group = c.req.query("group");
    const type = c.req.query("type");

    if (!group) {
      throw new HTTPException(400, { message: "Group is required" });
    }
    if (type && type !== "subscription" && type !== "payment") {
      throw new HTTPException(400, {
        message: "Type must be 'subscription' or 'payment'",
      });
    }
    const products: StripeDetailedItem[] = await stripeService
      .getProductsByGroup(group, type as "subscription" | "payment" | undefined)
      .catch((e) => {
        console.error(e);
        throw new HTTPException(500, { message: e });
      });

    return c.json(products);
  });

  // Create a checkout session for purchase or subscription
  app.post("/checkout", async (c) => {
    const { productName, discount } = await c.req.json();
    const userId = c.get("usersId");
    const userEmail = c.get("usersEmail");

    let customerId = await stripeService.customerExists(userEmail);
    if (!customerId) {
      const customer = await stripeService.createCustomer(userEmail, userId);
      customerId = customer.id;
    }

    const session = await stripeService.createSubscription(
      customerId,
      productName,
      discount
    );
    return c.json({ sessionUrl: session.url });
  });

  app.get("/subscription", async (c) => {
    const userId = c.get("usersId");
    const subscription = await checkUserSubscription(userId);
    return c.json(subscription);
  });

  // Cancel user's subscription
  app.post("/cancel-subscription", async (c) => {
    const userId = c.get("usersId");
    const db = getDb();

    const customer = await db
      .select({ stripeCustomerId: activeSubscriptions.stripeCustomerId })
      .from(activeSubscriptions)
      .where(eq(activeSubscriptions.userId, userId))
      .limit(1);

    if (customer.length === 0) {
      throw new HTTPException(404, { message: "No active subscription found" });
    }

    const cancelledSubscription = await stripeService.cancelSubscription(
      customer[0].stripeCustomerId
    );

    // Update local database
    await db
      .update(activeSubscriptions)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(activeSubscriptions.userId, userId));

    return c.json({
      message: "Subscription cancelled successfully",
      cancelledSubscription,
    });
  });

  // Get account link
  app.get("/account-link", async (c) => {
    const userId = c.get("usersId");
    const db = getDb();

    const customer = await db
      .select({ stripeCustomerId: activeSubscriptions.stripeCustomerId })
      .from(activeSubscriptions)
      .where(eq(activeSubscriptions.userId, userId))
      .limit(1);

    if (customer.length === 0) {
      throw new HTTPException(404, { message: "No customer found" });
    }

    const accountLink = await stripeService.generateAccountLink(
      customer[0].stripeCustomerId
    );
    return c.json({ accountLink: accountLink.url });
  });
}
