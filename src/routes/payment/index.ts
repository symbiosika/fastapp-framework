import { stripeService } from "../../lib/payment/stripe";
import { getDb } from "../../lib/db/db-connection";
import { activeSubscriptions, purchases } from "../../lib/db/schema/payment";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { FastAppHono } from "../../types";
import type { StripeDetailedItem } from "../../lib/types/shared/payment";
import type Stripe from "stripe";
import log from "../../lib/log";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";

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
    if (new Date(subscription.updatedAt).getTime() >= yesterday.getTime()) {
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
          updatedAt: now.toISOString(),
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
  app.get(
    "/products",
    describeRoute({
      method: "get",
      path: "/products",
      summary: "Get all products",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        group: v.optional(v.string()),
        type: v.optional(
          v.union([v.literal("subscription"), v.literal("payment")])
        ),
      })
    ),
    async (c) => {
      const group = c.req.query("group");
      const type = c.req.query("type");
      if (!group)
        throw new HTTPException(400, { message: "Group is required" });
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
          log.error(e);
          throw new HTTPException(500, { message: e });
        });

      return c.json(products);
    }
  );

  /**
   * Get the user's subscription
   */
  app.get(
    "/subscriptions",
    describeRoute({
      method: "get",
      path: "/subscriptions",
      summary: "Get the user's subscription",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        planName: v.optional(v.string()),
      })
    ),
    async (c) => {
      const userId = c.get("usersId");
      const planName = c.req.query("planName");
      log.debug("Checking user subscription", userId, planName);
      const subscription = await checkUserSubscription(userId, planName).catch(
        (e) => {
          log.error(e);
          throw new HTTPException(500, {
            message: "Error checking user subscription. " + e,
          });
        }
      );
      return c.json(subscription);
    }
  );

  /**
   * Cancel the user's subscription
   */
  app.post(
    "/cancel-subscription",
    describeRoute({
      method: "post",
      path: "/cancel-subscription",
      summary: "Cancel the user's subscription",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        planName: v.string(),
      })
    ),
    async (c) => {
      const userId = c.get("usersId");
      const planName = c.req.query("planName");

      const entries = await getDb()
        .select()
        .from(activeSubscriptions)
        .where(
          and(
            eq(activeSubscriptions.userId, userId),
            eq(activeSubscriptions.planName, planName!)
          )
        );

      if (entries.length === 0) {
        throw new HTTPException(404, {
          message: "No active subscription found",
        });
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
          updatedAt: new Date().toISOString(),
          metadata: cancelledSubscription,
        })
        .where(
          and(
            eq(activeSubscriptions.userId, userId),
            eq(activeSubscriptions.planName, planName!)
          )
        );

      return c.json({
        message: "Subscription cancelled successfully",
        cancelledSubscription,
      });
    }
  );

  /**
   * Get the account link for the user to a plan
   */
  app.get(
    "/account-link",
    describeRoute({
      method: "get",
      path: "/account-link",
      summary: "Get the account link for the user to a plan",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        planName: v.string(),
        returnUrl: v.string(),
      })
    ),
    async (c) => {
      const userId = c.get("usersId");
      const planName = c.req.query("planName")!;
      const returnUrl = c.req.query("returnUrl")!;
      log.debug("Getting account link for user", userId);

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
            returnUrl!
          );
          accountLinks.push({
            url: accountLink.url,
            planName: subscription.planName,
          });
        }
        return c.json({ accountLinks });
      } catch (error) {
        log.error("Error getting account link", error + "");
        throw new HTTPException(500, {
          message: "Error getting account link. " + error,
        });
      }
    }
  );

  /**
   * Create a checkout session
   */
  app.post(
    "/create-checkout-session",
    describeRoute({
      method: "post",
      path: "/create-checkout-session",
      summary: "Create a checkout session",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "json",
      v.object({
        productName: v.string(),
        discount: v.optional(v.string()),
        successUrl: v.string(),
        cancelUrl: v.string(),
      })
    ),
    async (c) => {
      const data = c.req.valid("json");
      const userId = c.get("usersId");
      const userEmail = c.get("usersEmail");

      log.debug("Creating checkout session for product", data);

      let customerId = await stripeService.customerExists(userEmail);
      if (!customerId) {
        const customer = await stripeService.createCustomer(userEmail, userId);
        customerId = customer.id;
      }

      const session = await stripeService.createSubscriptionSession(
        customerId,
        data.productName,
        data.discount ?? "",
        data.successUrl ?? undefined,
        data.cancelUrl ?? undefined
      );

      // Store the session ID in your database, associated with the user
      await storeCheckoutSession(
        userId,
        data.productName,
        session,
        session.mode as "payment" | "subscription"
      );

      return c.json({ checkoutUrl: session.url });
    }
  );

  // Redirect page after payment for both subscriptions and one-time payments
  app.get(
    "/success",
    describeRoute({
      method: "get",
      path: "/success",
      summary:
        "Redirect page after payment for both subscriptions and one-time payments",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        session_id: v.string(),
      })
    ),
    async (c) => {
      const sessionId = c.req.query("session_id");
      log.debug("Finished session ID:", sessionId);

      if (!sessionId) {
        throw new HTTPException(400, { message: "Session ID is required" });
      }

      try {
        // Verify the session and update the database
        const session = await stripeService.retrieveCheckoutSession(sessionId);
        // log.debug("Success Session", session);

        if (
          session.mode === "subscription" &&
          session.payment_status === "paid"
        ) {
          log.debug("Updating subscription in database");
          const purchase = await getDb()
            .select()
            .from(purchases)
            .where(eq(purchases.stripePaymentIntentId, session.id))
            .limit(1);
          if (purchase.length === 0) {
            log.error("No purchase found for session", session.id);
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
          log.debug("Updating payment in database");
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
        log.error("Error processing success page:", error + "");
        throw new HTTPException(500, {
          message: "Error processing success page. " + error,
        });
      }
    }
  );
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
  log.debug("storeCheckoutSession", userId, session.id);
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
  log.debug("updateOrCreateSubscriptionInDatabase", session.id);

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
