# Payment-Service API Documentation

The Payment Service API provides endpoints to manage customer subscriptions and payments. The base URL for all endpoints is `/api/v1/stripe`.

## Endpoints

### 1. Get Products

Retrieves products for a specific group and optional type.

- **URL:** `/api/v1/stripe/products`
- **Method:** `GET`
- **Query Parameters:** 
  - `group` (required): The product group (e.g., "premium")
  - `type` (optional): Can be "subscription" or "payment"
- **Response:** Returns an array of StripeDetailedItem objects

### 2. Get User Subscriptions

Retrieves the user's subscription status.

- **URL:** `/api/v1/stripe/subscriptions`
- **Method:** `GET`
- **Query Parameters:** 
  - `planName` (optional): Specific plan name to check
- **Response:** 
  ```json
  [
    {
      "planName": "premium",
      "valid": true,
      "end": "2023-12-31T23:59:59.999Z"
    }
  ]
  ```

### 3. Cancel Subscription

Cancels a user's subscription.

- **URL:** `/api/v1/stripe/cancel-subscription`
- **Method:** `POST`
- **Query Parameters:** 
  - `planName` (required): The name of the plan to cancel
- **Response:** Returns a message and the cancelled subscription details

### 4. Get Account Link

Generates a billing portal session for a customer.

- **URL:** `/api/v1/stripe/account-link`
- **Method:** `GET`
- **Query Parameters:** 
  - `planName` (required): The name of the plan
  - `returnUrl` (required): URL to return to after managing billing
- **Response:** Returns an object with account links for each subscription

### 5. Create Checkout Session

Creates a new checkout session for subscription or one-time payment.

- **URL:** `/api/v1/stripe/create-checkout-session`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "productName": "premium",
    "discount": "COUPON10", // Optional
    "successUrl": "https://example.com/success", // Optional
    "cancelUrl": "https://example.com/cancel" // Optional
  }
  ```
- **Response:** Returns an object with the checkout URL

### 6. Payment Success Redirect

Handles the redirect after a successful payment.

- **URL:** `/api/v1/stripe/success`
- **Method:** `GET`
- **Query Parameters:** 
  - `session_id` (required): The Stripe session ID
- **Response:** Redirects to the success page or returns payment status

## Error Handling

All endpoints will return appropriate HTTP status codes and error messages in case of failures. Make sure to handle these errors in your client application.

## Authentication

These endpoints require authentication. Ensure that you include the necessary authentication headers with each request.

## Notes

- The API automatically handles customer creation if they don't exist in Stripe.
- Subscription statuses are cached locally and refreshed when necessary.
- Both subscription and one-time payments are supported.
- After a successful payment, the API updates the local database to reflect the new subscription or payment status.