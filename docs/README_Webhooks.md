# Webhooks API Documentation

Webhooks allow users to configure automated notifications to external services when specific events occur within the application.

## Endpoints

### Get All Webhooks

```
GET /api/v1/webhooks
```

Returns all webhooks belonging to the authenticated user within their organization.

### Create Webhook

```
POST /api/v1/webhooks
```

Creates a new webhook for the authenticated user.

**Request Body:**
```typescript
{
  name: string;
  type: "n8n";  // Currently only n8n is supported
  event: "chat-output";  // Currently only chat-output is supported
  webhookUrl: string;
  method?: "POST" | "GET";  // Defaults to POST
  headers?: Record<string, string>;  // Optional custom headers
  meta?: Record<string, any>;  // Optional metadata
  organisationId: string; 
}
```


### Get Webhook by ID

```
GET /api/v1/webhooks/:id
```

Returns a specific webhook by ID. User must have access to the webhook.

### Update Webhook

```
PUT /api/v1/webhooks/:id
```

Updates an existing webhook. User must have access to the webhook.

**Request Body:** Same as Create Webhook, all fields optional

### Delete Webhook

```
DELETE /api/v1/webhooks/:id
```

Deletes a webhook. User must have access to the webhook.

### Register N8N Webhook

```
POST /api/v1/webhooks/register/n8n
```

Specialized endpoint for registering n8n webhooks.

**Request Body:**
```typescript
{
  name: string;
  webhookUrl: string;
  event: "chatOutput";
  organisationId?: string;
}
```

### Check Webhook Existence

```
POST /api/v1/webhooks/check
```

Checks if a webhook exists and is accessible to the user.

**Request Body:**
```typescript
{
  webhookId: string;
}
```

**Response:**
```typescript
{
  exists: boolean;
}
```

### Trigger Webhook

```
POST /api/v1/webhooks/:id/trigger
```

Manually triggers a webhook with custom payload.

**Request Body:**
```typescript
{
  // Optional custom payload to send to webhook
  [key: string]: any;
}
```

**Response:**
```typescript
{
  success: boolean;
  statusCode: number;
  response: any;  // Response from the webhook endpoint
}
```

## Authentication

All endpoints require JWT authentication. The user's ID and organization ID are extracted from the authentication token.

## Error Responses

Common error responses:

- `400` Bad Request - Invalid input
- `403` Forbidden - User doesn't have access to the webhook
- `404` Not Found - Webhook not found
- `500` Internal Server Error - Various webhook operation failures

Error response format:
```typescript
{
  message: string;
}
```

## Webhook Types and Events

Currently supported configurations:

- **Types:**
  - `n8n`: Integration with n8n workflow automation

- **Events:**
  - `chat-output`: Triggered when chat output is generated

## Headers and Methods

- Default method is `POST`
- Default Content-Type is `application/json`
- Custom headers can be specified during webhook creation or update