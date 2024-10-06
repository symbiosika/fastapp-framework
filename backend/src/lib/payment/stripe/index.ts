import Stripe from "stripe";
import APP_PAYMENT_OPTIONS from "../../../../custom-stripe";
import type { StripeDetailedItem } from "src/lib/types/shared/payment";

/**
 * Stripe Service
 * @description This service is used to interact with the Stripe API.
 */
export class StripeService {
  private stripe: Stripe;

  constructor(apiKey?: string) {
    const stripeApiKey = apiKey || process.env.STRIPE_API_KEY;
    if (!stripeApiKey) {
      throw new Error("Stripe API key is not provided");
    }
    this.stripe = new Stripe(stripeApiKey, {
      apiVersion: "2024-09-30.acacia",
    });
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
      throw new Error("Invalid user email or id");
    }
    // try to create customer via stripe API
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      });
      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  /**
   * Check if a customer exists in Stripe
   */
  async customerExists(email: null | string): Promise<string> {
    // return if no email is given
    if (!email) {
      throw new Error("Invalid user email");
    }
    // try to get customer via stripe API
    try {
      const customers = await this.stripe.customers.list({ email });
      return customers.data[0].id;
    } catch (error) {
      console.error("Error checking customer:", error);
      throw error;
    }
  }

  /**
   * Check if a customer has a valid subscription
   */
  async hasValidSubscription(
    customerId: null | string
  ): Promise<{ valid: boolean; end?: string }> {
    // return if no customer id is given
    if (!customerId) {
      return { valid: false };
    }
    // try to get subscriptions via stripe API
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });
      // result length is 0 if no subscription is found
      if (subscriptions.data.length < 1) {
        return { valid: false };
      }
      // format date as "YYYY-MM-DD"
      const persiodEndFormatted = new Date(
        subscriptions.data[0].current_period_end * 1000
      )
        .toISOString()
        .split("T")[0];
      return {
        valid: true,
        end: subscriptions.data[0].cancel_at_period_end
          ? persiodEndFormatted
          : undefined,
      };
    } catch (error) {
      // any error means also no valid subscription
      console.error("Error checking valid subscription:", error);
      return { valid: false };
    }
  }

  /**
   * Create a session on stripe for checkout
   * in this session there will be a URL to redirect the user to the checkout page
   * types: 'standard'
   */
  async createSubscription(
    customerId: null | string,
    name: string,
    discount: string
  ): Promise<Stripe.Checkout.Session> {
    // return if no customer id or invalid type is given
    if (!customerId) {
      throw new Error("Invalid customer ID");
    }
    // try to create subscription via stripe API
    try {
      // search the product
      const stripeItem = APP_PAYMENT_OPTIONS.stripeItems.find((i) => {
        return i.priceName === name;
      });
      if (!stripeItem) {
        throw new Error("Invalid product");
      }
      // set price id depending on type
      const priceId = stripeItem.priceId;

      // create a session to checkout
      const session = await this.stripe.checkout.sessions.create({
        mode: stripeItem.type,
        // payment method types: card, google pay and apple pay
        payment_method_types: APP_PAYMENT_OPTIONS.paymentMethodTypes,
        customer: customerId,
        discounts: discount ? [{ coupon: discount }] : undefined,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `/static/start.html`, // ?session_id={CHECKOUT_SESSION_ID}
        cancel_url: `/static/start.html`,
      });
      // console.log("Created checkout session: ", session.id);
      return session;
    } catch (error) {
      // console.error("Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription by stripe customer id
   */
  async cancelSubscription(
    customerId: null | string
  ): Promise<Stripe.Subscription> {
    // return if no customer id is given
    if (!customerId) {
      throw new Error("Invalid customer id");
    }
    // try to cancel subscription via stripe API
    try {
      // get subscription id by customer id
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });
      if (subscriptions.data.length === 0) {
        throw new Error("No active subscription found");
      }
      const subscriptionId = subscriptions.data[0].id;
      // cancel subscription
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  }

  /**
   * Generate a user account link for a customer
   */
  async generateAccountLink(
    customerId: null | string
  ): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
    // return if no customer id is given
    if (!customerId) {
      throw new Error("Invalid customer id");
    }
    // try to generate account link via stripe API
    try {
      return await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `/static/start.html`,
      });
    } catch (error) {
      console.error("Error generating account link:", error);
      throw error;
    }
  }

  /**
   * Get all products for a specific group
   */
  async getProductsByGroup(
    group: string,
    type?: "subscription" | "payment" | undefined
  ): Promise<StripeDetailedItem[]> {
    try {
      // Find all stripe items for the given group
      const groupItems = APP_PAYMENT_OPTIONS.stripeItems.filter(
        (item) => item.group === group && (type ? item.type === type : true)
      );

      // Fetch detailed information for each item from Stripe API
      const detailedItems = await Promise.all(
        groupItems.map(async (item) => {
          const product = await this.stripe.products.retrieve(item.prodId);
          const price = await this.stripe.prices.retrieve(item.priceId);

          return {
            priceName: item.priceName,
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
      console.error("Error fetching products by group:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
