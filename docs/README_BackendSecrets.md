# Secret Management API Endpoints

These endpoints allow you to manage backend secrets (like API keys, tokens, or other sensitive configuration values) that can be used internally by the application.

## List All Secrets

Retrieves all stored secrets.

```http
GET /api/v1/secrets
```

### Response

```json
{
  "id": "secrets-id-from-db",
  "name": "secrets-name"
}[]
```

## Create or Update Secret

Adds a new secret or updates an existing one.

```http
POST /api/secrets
```

### Request Body

```json
{
  "name": "SECRET_NAME",
  "value": "your_secret_value"
}
```

### Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| `name`    | string | The name/key of the secret |
| `value`   | string | The secret value to store  |


### Notes

- All secrets are stored encrypted and cannot be accessed by the API
- Use meaningful names for your secrets (e.g., `STRIPE_SECRET_KEY`, `DATABASE_PASSWORD`)