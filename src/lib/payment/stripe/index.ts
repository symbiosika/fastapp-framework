import Stripe from "stripe";
import type { StripeDetailedItem } from "../../types/shared/payment";
import { getDb } from "../../db/db-connection";
import { products } from "../../db/db-schema";
import { and, eq } from "drizzle-orm";
import { _GLOBAL_SERVER_CONFIG } from "../../../index";
import log from "../../log";

/**
 * Stripe Service
 * @description This service is used to interact with the Stripe API.
 */
export class StripeService {
  public _stripe: Stripe;
  private logEnabled: boolean = false;

  constructor(apiKey: string) {
    const stripeApiKey = apiKey;
    this.logEnabled = process.env.STRIPE_DEBUG === "true";
    if (!stripeApiKey) {
      log.debug("[StripeService] Stripe API key is not provided");
      return;
      // throw new Error("Stripe API key is not provided");
    }
    this._stripe = new Stripe(stripeApiKey, {
      apiVersion: "2024-09-30.acacia",
    });
  }

  /**
   * Small logging for debugging
   */
  private log(message: string): void {
    if (this.logEnabled) {
      log.debug(`[StripeService] Log:${message}`);
    }
  }

  private error(message: string): void {
    if (this.logEnabled) {
      log.debug(`[StripeService] Err:${message}`);
    }
  }

  /**
   * Create a new customer in Stripe
   */
  async createCustomer(
    email: null | string,
    userId: null | string
  ): Promise<Stripe.Customer> {
    // return if no email or user id is given
    if (!email || !userId) {
      this.error("Invalid user email or id " + email + " " + userId);
      throw new Error("Invalid user email or id");
    }
    // try to create customer via stripe API
    try {
      const customer = await this._stripe.customers.create({
        email,
        metadata: { userId },
      });
      return customer;
    } catch (error) {
      this.error("Error creating customer:" + error);
      throw error;
    }
  }

  /**
   * Check if a customer exists in Stripe
   */
  async customerExists(email: null | string): Promise<string | null> {
    // return if no email is given
    if (!email) {
      throw new Error("Invalid user email");
    }
    // try to get customer via stripe API
    try {
      const customers = await this._stripe.customers.list({ email });
      if (customers.data.length === 0) {
        return null;
      }
      return customers.data[0].id;
    } catch (error) {
      this.error("Error checking customer:" + error);
      throw error;
    }
  }

  /**
   * Get active subscriptions for a customer
   */
  private async getActiveSubscriptions(
    customerId: string,
    planName?: string
  ): Promise<Stripe.Subscription[]> {
    this.log(`Fetching active subscriptions for customer ${customerId}`);
    const subscriptions = await this._stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });
    this.log(
      `Customer ${customerId} has ${subscriptions.data.length} active subscriptions`
    );

    if (planName) {
      const targetSubscription = subscriptions.data.find((sub) =>
        sub.items.data.some(
          async (item) =>
            item.price.product === (await this.getPriceIdByPlanName(planName))
        )
      );
      return targetSubscription ? [targetSubscription] : [];
    }

    return subscriptions.data;
  }

  /**
   * Get a subscription by id
   */
  async getSubscriptionById(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return this._stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Check if a customer has a valid subscription
   */
  async hasValidSubscription(
    customerId: null | string,
    planName: string
  ): Promise<{ valid: boolean; end?: string }> {
    if (!customerId) {
      return { valid: false };
    }
    try {
      const activeSubscriptions = await this.getActiveSubscriptions(
        customerId,
        planName
      );
      if (activeSubscriptions.length === 0) {
        this.log("No active subscription found for plan: " + planName);
        return { valid: false };
      }
      const targetSubscription = activeSubscriptions[0];

      const periodEndFormatted = new Date(
        targetSubscription.current_period_end * 1000
      )
        .toISOString()
        .split("T")[0];

      this.log(
        `user ${customerId} has a valid subscription ending on ${periodEndFormatted}`
      );
      return {
        valid: true,
        end: targetSubscription.cancel_at_period_end
          ? periodEndFormatted
          : undefined,
      };
    } catch (error) {
      this.error("Error checking valid subscription:" + error);
      return { valid: false };
    }
  }

  /**
   * Create a session on stripe for checkout
   * in this session there will be a URL to redirect the user to the checkout page
   * types: 'standard'
   */
  async createSubscriptionSession(
    customerId: null | string,
    name: string,
    discount: string,
    successUrlParam?: string,
    cancelUrlParam?: string
  ): Promise<Stripe.Checkout.Session> {
    // return if no customer id or invalid type is given
    if (!customerId) {
      throw new Error("Invalid customer ID");
    }
    // try to create subscription via stripe API
    try {
      // find product in DB
      const stripeItems = await getDb()
        .select()
        .from(products)
        .where(eq(products.name, name));

      if (stripeItems.length === 0) {
        throw new Error("Invalid product");
      }
      const stripeItem = stripeItems[0];

      // set price id depending on type
      const priceId = stripeItem.priceId;

      let successUrl =
        successUrlParam ??
        `${_GLOBAL_SERVER_CONFIG.baseUrl}${_GLOBAL_SERVER_CONFIG.basePath}/static/subscriptions.html?session_id={CHECKOUT_SESSION_ID}`;
      // check if success urls ends with ?session_id={CHECKOUT_SESSION_ID}
      if (!successUrl.endsWith("?session_id={CHECKOUT_SESSION_ID}")) {
        successUrl += "?session_id={CHECKOUT_SESSION_ID}";
      }
      const cancelUrl =
        cancelUrlParam ??
        `${_GLOBAL_SERVER_CONFIG.baseUrl}/static/subscriptions.html`;

      // create a session to checkout
      const session = await this._stripe.checkout.sessions.create({
        mode: stripeItem.type,
        // payment method types: card, google pay and apple pay
        payment_method_types: ["card"],
        customer: customerId,
        discounts: discount ? [{ coupon: discount }] : undefined,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return session;
    } catch (error) {
      this.error("Error creating subscription:" + error);
      throw error;
    }
  }

  /**
   * Cancel a subscription by stripe customer id
   */
  async cancelSubscription(
    customerId: null | string,
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    if (!customerId) {
      throw new Error("Invalid customer id");
    }
    try {
      this.log(
        `Canceling subscription ${subscriptionId} for customer ${customerId}`
      );
      return await this._stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      this.error("Error canceling subscription:" + error);
      throw error;
    }
  }

  /**
   * Generate a user account link for a customer
   */
  async generateAccountLink(
    customerId: null | string,
    returnUrl: string
  ): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
    // return if no customer id is given
    if (!customerId) {
      throw new Error("Invalid customer id");
    }
    // try to generate account link via stripe API
    try {
      return await this._stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
    } catch (error) {
      this.error("Error generating account link:" + error);
      throw error;
    }
  }

  /**
   * Get all products for a specific group
   */
  async getProductsByGroupAndType(
    group: string,
    type?: "subscription" | "payment" | undefined
  ): Promise<StripeDetailedItem[]> {
    try {
      // Find all stripe items for the given group
      const where = type
        ? and(eq(products.group, group), eq(products.type, type))
        : eq(products.group, group);

      const groupItems = await getDb().select().from(products).where(where);

      // Fetch detailed information for each item from Stripe API
      const detailedItems = await Promise.all(
        groupItems.map(async (item) => {
          const product = await this._stripe.products.retrieve(item.prodId);
          const price = await this._stripe.prices.retrieve(item.priceId);

          return {
            priceName: item.name,
            priceId: item.priceId,
            type: item.type,
            price: price.unit_amount ? price.unit_amount / 100 : 0, // Convert from cents to dollars
            currency: price.currency,
            interval:
              price.type === "recurring"
                ? price.recurring?.interval
                : undefined,
            intervalCount:
              price.type === "recurring"
                ? price.recurring?.interval_count
                : undefined,
            // You can add more fields from the product object if needed
            description: product.description ?? undefined,
            name: product.name ?? undefined,
          };
        })
      );

      return detailedItems;
    } catch (error) {
      this.error("Error fetching products by group:" + error);
      throw error;
    }
  }

  async retrieveCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session> {
    return this._stripe.checkout.sessions.retrieve(sessionId);
  }

  // Helper method to get price ID by plan name
  private async getPriceIdByPlanName(planName: string): Promise<string> {
    const stripeItems = await getDb()
      .select()
      .from(products)
      .where(eq(products.name, planName));

    if (stripeItems.length === 0) {
      throw new Error(`Invalid product: ${planName}`);
    }
    return stripeItems[0].priceId;
  }

  /**
   * Creates a database entry for an existing Stripe product and price
   */
  async createProductInDb({
    name,
    group,
    type,
    stripeProductId,
    stripePriceId,
  }: {
    name: string;
    group: string;
    type: "subscription" | "payment";
    stripeProductId: string;
    stripePriceId: string;
  }) {
    try {
      // Verify product exists in Stripe
      const product = await this._stripe.products.retrieve(stripeProductId);
      if (!product) {
        throw new Error(`Product ${stripeProductId} not found in Stripe`);
      }

      // Verify price exists in Stripe
      const price = await this._stripe.prices.retrieve(stripePriceId);
      if (!price || price.product !== stripeProductId) {
        throw new Error(
          `Invalid price ${stripePriceId} for product ${stripeProductId}`
        );
      }

      // Store in local database
      await getDb().insert(products).values({
        name,
        group,
        type,
        prodId: stripeProductId,
        priceId: stripePriceId,
      });

      return {
        productId: stripeProductId,
        priceId: stripePriceId,
      };
    } catch (error) {
      this.error("Error creating product and price entry:" + error);
      throw error;
    }
  }
}

export const stripeService = new StripeService(
  process.env.STRIPE_API_KEY ?? ""
);
