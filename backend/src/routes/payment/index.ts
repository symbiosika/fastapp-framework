import { stripeService } from "../../lib/payment/stripe";
import { getDb } from "../../lib/db/db-connection";
import { activeSubscriptions, purchases } from "../../lib/db/schema/payment";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { FastAppHono } from "../../index.d";
import type { StripeDetailedItem } from "src/lib/types/shared/payment";
import type Stripe from "stripe";

/**
 * Check if the user has an active subscription
 * If the App has only one possible subscription per user the planName can be left empty
 */
export async function checkUserSubscription(
  userId: string,
  planName?: string
): Promise<{ planName: string; valid: boolean; end?: string }[]> {
  const db = getDb();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let where: any = eq(activeSubscriptions.userId, userId);
  if (planName) {
    where = and(where, eq(activeSubscriptions.planName, planName));
  }

  const subscriptions = await db
    .select()
    .from(activeSubscriptions)
    .where(where);

  const results: { planName: string; valid: boolean; end?: string }[] = [];

  for (const subscription of subscriptions) {
    if (subscription.updatedAt >= yesterday) {
      // Subscription data is recent, use it
      results.push({
        planName: subscription.planName,
        valid: subscription.status === "active",
        end: subscription.currentPeriodEnd.toISOString(),
      });
    } else {
      // Subscription data is old, check with stripe
      const stripeSubscription = await stripeService.hasValidSubscription(
        subscription.stripeCustomerId,
        subscription.planName
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
        .where(
          and(
            eq(activeSubscriptions.userId, userId),
            eq(activeSubscriptions.planName, subscription.planName)
          )
        );

      results.push({
        planName: subscription.planName,
        valid: stripeSubscription.valid,
        end: stripeSubscription.end,
      });
    }
  }

  return results;
}

/**
 * Define the payment routes
 */
export default function defineRoutes(app: FastAppHono) {
  /**
   * Get all products
   * Can be filtered by group and type
   */
  app.get("/products", async (c) => {
    const group = c.req.query("group");
    const type = c.req.query("type");

    if (!group) throw new HTTPException(400, { message: "Group is required" });
    if (type && type !== "subscription" && type !== "payment")
      throw new HTTPException(400, {
        message: "Type must be 'subscription' or 'payment'",
      });

    const products: StripeDetailedItem[] = await stripeService
      .getProductsByGroupAndType(
        group,
        type as "subscription" | "payment" | undefined
      )
      .catch((e) => {
        console.error(e);
        throw new HTTPException(500, { message: e });
      });

    return c.json(products);
  });

  /**
   * Get the user's subscription
   */
  app.get("/subscriptions", async (c) => {
    const userId = c.get("usersId");
    const planName = c.req.query("planName");

    console.log("Checking user subscription", userId, planName);
    const subscription = await checkUserSubscription(userId, planName).catch(
      (e) => {
        console.error(e);
        throw new HTTPException(500, {
          message: "Error checking user subscription. " + e,
        });
      }
    );
    return c.json(subscription);
  });

  /**
   * Cancel the user's subscription
   */
  app.post("/cancel-subscription", async (c) => {
    const userId = c.get("usersId");
    const planName = c.req.query("planName");
    if (!planName) {
      throw new HTTPException(400, { message: "Plan name is required" });
    }

    const entries = await getDb()
      .select()
      .from(activeSubscriptions)
      .where(
        and(
          eq(activeSubscriptions.userId, userId),
          eq(activeSubscriptions.planName, planName)
        )
      );

    if (entries.length === 0) {
      throw new HTTPException(404, { message: "No active subscription found" });
    }
    const cancelledSubscription = await stripeService.cancelSubscription(
      entries[0].stripeCustomerId,
      entries[0].stripeSubscriptionId
    );

    // Update local database
    await getDb()
      .update(activeSubscriptions)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(cancelledSubscription.current_period_end),
        updatedAt: new Date(),
        metadata: cancelledSubscription,
      })
      .where(
        and(
          eq(activeSubscriptions.userId, userId),
          eq(activeSubscriptions.planName, planName)
        )
      );

    return c.json({
      message: "Subscription cancelled successfully",
      cancelledSubscription,
    });
  });

  /**
   * Get the account link for the user to a plan
   */
  app.get("/account-link", async (c) => {
    const userId = c.get("usersId");
    const planName = c.req.query("planName");
    const returnUrl = c.req.query("returnUrl");
    if (!planName) {
      throw new HTTPException(400, { message: "Plan name is required" });
    }
    if (!returnUrl) {
      throw new HTTPException(400, { message: "Return URL is required" });
    }
    console.log("Getting account link for user", userId);

    try {
      const subscriptions = await getDb()
        .select()
        .from(activeSubscriptions)
        .where(
          and(
            eq(activeSubscriptions.userId, userId),
            eq(activeSubscriptions.planName, planName)
          )
        );

      if (subscriptions.length === 0) {
        throw new HTTPException(404, { message: "No Subscriptions found" });
      }

      const accountLinks: { url: string; planName: string }[] = [];
      for (const subscription of subscriptions) {
        const accountLink = await stripeService.generateAccountLink(
          subscription.stripeCustomerId,
          returnUrl
        );
        accountLinks.push({
          url: accountLink.url,
          planName: subscription.planName,
        });
      }
      return c.json({ accountLinks });
    } catch (error) {
      console.error("Error getting account link", error);
      throw new HTTPException(500, {
        message: "Error getting account link. " + error,
      });
    }
  });

  /**
   * Create a checkout session
   */
  app.post("/create-checkout-session", async (c) => {
    const { productName, discount, successUrl, cancelUrl } = await c.req.json();
    const userId = c.get("usersId");
    const userEmail = c.get("usersEmail");

    console.log("Creating checkout session for product", {
      productName,
      discount,
      successUrl,
      cancelUrl,
    });

    let customerId = await stripeService.customerExists(userEmail);
    if (!customerId) {
      const customer = await stripeService.createCustomer(userEmail, userId);
      customerId = customer.id;
    }

    const session = await stripeService.createSubscription(
      customerId,
      productName,
      discount ?? "",
      successUrl ?? undefined,
      cancelUrl ?? undefined
    );

    // Store the session ID in your database, associated with the user
    await storeCheckoutSession(
      userId,
      productName,
      session,
      session.mode as "payment" | "subscription"
    );

    return c.json({ checkoutUrl: session.url });
  });

  // Redirect page after payment for both subscriptions and one-time payments
  app.get("/success", async (c) => {
    const sessionId = c.req.query("session_id");
    console.log("Finished session ID:", sessionId);

    if (!sessionId) {
      throw new HTTPException(400, { message: "Session ID is required" });
    }

    try {
      // Verify the session and update the database
      const session = await stripeService.retrieveCheckoutSession(sessionId);
      // console.log("Success Session", session);

      if (
        session.mode === "subscription" &&
        session.payment_status === "paid"
      ) {
        console.log("Updating subscription in database");
        const purchase = await getDb()
          .select()
          .from(purchases)
          .where(eq(purchases.stripePaymentIntentId, session.id))
          .limit(1);
        if (purchase.length === 0) {
          console.error("No purchase found for session", session.id);
          throw new HTTPException(404, { message: "No purchase found" });
        }
        await updatePaymentInDatabase(session.id, "succeeded", true);
        await updateOrCreateSubscriptionInDatabase(
          purchase[0].userId,
          session,
          purchase[0].productName
        );
        // redirect to the success page
        return c.redirect("/static/");
      } else if (
        session.mode === "payment" &&
        session.payment_status === "paid"
      ) {
        console.log("Updating payment in database");
        await updatePaymentInDatabase(session.id, "succeeded");
        // redirect to the success page
        return c.redirect("/static/");
      } else {
        return c.json({
          success: false,
          message: "Payment not completed",
          session,
        });
      }
    } catch (error) {
      console.error("Error processing success page:", error);
      throw new HTTPException(500, {
        message: "Error processing success page. " + error,
      });
    }
  });
}

/**
 * Store the checkout session in the database
 */
async function storeCheckoutSession(
  userId: string,
  productName: string,
  session: Stripe.Checkout.Session,
  type: "payment" | "subscription"
) {
  console.log("storeCheckoutSession", userId, session.id);
  const db = getDb();

  await db.insert(purchases).values({
    userId,
    type,
    stripePaymentIntentId: session.id,
    stripeCustomerId: session.customer as string,
    status: "pending",
    used: false,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "",
    productName,
    metadata: session,
  });
}

/**
 * Update or create a subscription in the database
 */
async function updateOrCreateSubscriptionInDatabase(
  userId: string,
  session: Stripe.Checkout.Session,
  planName: string
) {
  console.log("updateOrCreateSubscriptionInDatabase", session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  const subscription = await stripeService.getSubscriptionById(subscriptionId);

  await getDb()
    .insert(activeSubscriptions)
    .values({
      userId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      status: "active", // Assuming it's active since the payment was successful
      planName,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: subscription,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        activeSubscriptions.stripeCustomerId,
        activeSubscriptions.planName,
      ],
      set: {
        stripeSubscriptionId: subscriptionId,
        status: "active",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        metadata: subscription,
        updatedAt: new Date(),
      },
    });
}

async function updatePaymentInDatabase(
  stripePaymentIntentId: string,
  status: "succeeded" | "failed" | "pending",
  used?: boolean,
  type?: "payment" | "subscription",
  metadata?: Stripe.Checkout.Session
) {
  const db = getDb();

  await db
    .update(purchases)
    .set({
      status,
      used: used != null ? used : undefined,
      type: type != null ? type : undefined,
      metadata: metadata != null ? metadata : undefined,
    })
    .where(eq(purchases.stripePaymentIntentId, stripePaymentIntentId));
}
