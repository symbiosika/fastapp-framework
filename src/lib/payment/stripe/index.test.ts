import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { StripeService } from "../../payment/stripe/index";
import { initTests } from "../../../test/init.test";
import { TEST_PRODUCT_ID, TEST_PRICE_ID } from "../../../test/init.test";

if (!process.env.STRIPE_TESTING_API_KEY) {
  throw new Error(
    "STRIPE_TESTING_API_KEY is not set. This is required for testing."
  );
}
const stripeService = new StripeService(process.env.STRIPE_TESTING_API_KEY);

describe("StripeService.createCustomer", () => {
  it("should create a new customer with valid email and userId", async () => {
    const email = "test.customer@example.com";
    const userId = "user_12345";

    const customer = await stripeService.createCustomer(email, userId);

    expect(customer).toBeDefined();
    expect(customer.email).toBe(email);
    expect(customer.metadata.userId).toBe(userId);
  });

  it("should throw an error if email is missing", async () => {
    const email = null;
    const userId = "user_12345";

    await expect(stripeService.createCustomer(email, userId)).rejects.toThrow(
      "Invalid user email or id"
    );
  });

  it("should throw an error if userId is missing", async () => {
    const email = "test.customer@example.com";
    const userId = null;

    await expect(stripeService.createCustomer(email, userId)).rejects.toThrow(
      "Invalid user email or id"
    );
  });
});

describe("StripeService.customerExists", () => {
  it("should return customer ID if customer exists", async () => {
    const email = "existing.customer@example.com";

    // Ensure the customer exists by creating one first
    const createdCustomer = await stripeService.createCustomer(
      email,
      "user_67890"
    );

    const customerId = await stripeService.customerExists(email);

    expect(customerId).toBe(createdCustomer.id);
  });

  it("should return null if customer does not exist", async () => {
    const email = "nonexistent.customer@example.com";

    const customerId = await stripeService.customerExists(email);

    expect(customerId).toBeNull();
  });

  it("should throw an error if email is missing", async () => {
    const email = null;

    await expect(stripeService.customerExists(email)).rejects.toThrow(
      "Invalid user email"
    );
  });
});

describe("StripeService.createProductAndPrice", () => {
  beforeAll(async () => {
    await initTests();
  });

  it("should create a database entry for existing Stripe product and price", async () => {
    // Now test our function
    const result = await stripeService.createProductInDb({
      name: "Test Product DB Entry",
      group: "test-group",
      type: "subscription",
      stripeProductId: TEST_PRODUCT_ID,
      stripePriceId: TEST_PRICE_ID,
    });

    expect(result).toBeDefined();
    expect(result.productId).toBe(TEST_PRODUCT_ID);
    expect(result.priceId).toBe(TEST_PRICE_ID);
  });

  it("should throw error for non-existent product", async () => {
    await expect(
      stripeService.createProductInDb({
        name: "Test Product",
        group: "test-group",
        type: "subscription",
        stripeProductId: "prod_nonexistent",
        stripePriceId: "price_nonexistent",
      })
    ).rejects.toThrow();
  });
});

describe("StripeService subscription operations", () => {
  let customerId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    await initTests();
    // Create a test customer to use for subscription tests
    const customer = await stripeService.createCustomer(
      "subscription.test@example.com",
      "user_subscription_test"
    );
    customerId = customer.id;
  });

  it("should create a subscription session", async () => {
    const session = await stripeService.createSubscriptionSession(
      customerId,
      "Test Product DB Entry", // Use the product name from your DB
      "", // No discount
      "http://localhost:3000/success",
      "http://localhost:3000/cancel"
    );

    expect(session).toBeDefined();
    expect(session.url).toBeDefined();
    expect(session.payment_status).toBe("unpaid");
    expect(session.customer).toBe(customerId);
  });

  it("should check subscription status", async () => {
    const result = await stripeService.hasValidSubscription(
      customerId,
      "Test Product DB Entry"
    );

    expect(result).toBeDefined();
    expect(typeof result.valid).toBe("boolean");
  });

  it("should get active subscriptions", async () => {
    // Create a subscription directly with Stripe API for testing

    const result = await stripeService.hasValidSubscription(
      customerId,
      "Test Product DB Entry"
    );
    expect(result).toBeDefined();
    expect(typeof result.valid).toBe("boolean");
  });

  it("should generate billing portal session", async () => {
    const session = await stripeService.generateAccountLink(
      customerId,
      "http://localhost:3000/return"
    );

    expect(session).toBeDefined();
    expect(session.url).toBeDefined();
    expect(session.return_url).toBe("http://localhost:3000/return");
  });

  // Clean up after tests if needed
  afterAll(async () => {
    if (customerId) {
      await stripeService._stripe.customers.del(customerId);
    }
  });
});
