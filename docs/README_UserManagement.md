# User Management API Endpoints

These endpoints allow you to manage user accounts, including authentication, registration, and profile management.

## Authentication

### Login

Authenticates a user and returns a JWT token.

```http
POST /api/v1/user/login
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "magicLinkToken": "optional_magic_link_token",
  "redirectUrl": "optional_redirect_url"
}
```

### Parameters

| Parameter        | Type    | Description                                     |
| ---------------- | ------- | ----------------------------------------------- |
| `email`          | string  | User's email address                            |
| `password`       | string  | User's password                                 |
| `magicLinkToken` | string? | Optional token for magic link authentication    |
| `redirectUrl`    | string? | Optional URL to redirect after successful login |

## User Profile

### Get Current User

Retrieves the profile of the authenticated user.

```http
GET /api/v1/user/me
```

### Response

```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "firstname": "John",
  "surname": "Doe",
  "image": "profile-image-url",
  "meta": {}
}
```

### Update Profile

Updates the current user's profile information.

```http
PUT /api/v1/user/me
```

### Request Body

```json
{
  "firstname": "John",
  "surname": "Doe",
  "image": "profile-image-url"
}
```

## User Registration

### Register New User

Creates a new user account.

```http
POST /api/v1/user/register
```

### Request Body

```json
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "sendVerificationEmail": true,
  "meta": {}
}
```

### Parameters

| Parameter               | Type    | Description                                           |
| ----------------------- | ------- | ----------------------------------------------------- |
| `email`                 | string  | User's email address                                  |
| `password`              | string  | User's password                                       |
| `sendVerificationEmail` | boolean | Whether to send verification email (defaults to true) |
| `meta`                  | object  | Optional metadata for custom verifications            |

## Email Verification

### Send Verification Email

Sends a verification email to the user.

```http
GET /api/v1/user/send-verification-email?email=user@example.com
```

### Parameters

| Parameter | Type   | Description             |
| --------- | ------ | ----------------------- |
| `email`   | string | Email address to verify |

### Verify Email

Verifies a user's email address using a token.

```http
GET /api/v1/user/verify-email?token=verification_token
```

### Parameters

| Parameter | Type   | Description                           |
| --------- | ------ | ------------------------------------- |
| `token`   | string | Verification token received via email |

## User Search

### Search Users by Email

Search for a user by their email address.

```http
GET /api/v1/user/search?email=user@example.com
```

### Parameters

| Parameter | Type   | Description                 |
| --------- | ------ | --------------------------- |
| `email`   | string | Email address to search for |

### Response

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstname": "John",
  "surname": "Doe"
}
```

## Magic Link Authentication

### Request Magic Link

Sends a magic link for passwordless authentication.

```http
GET /api/v1/user/send-magic-link?email=user@example.com
```

### Parameters

| Parameter | Type   | Description                         |
| --------- | ------ | ----------------------------------- |
| `email`   | string | Email address to send magic link to |

## Notes

- All secured endpoints require a valid JWT token in the `Cookie` header (`jwt=token`)
- Magic link authentication is available as an alternative to password-based login
- The API supports custom pre-registration verifications that can be configured server-side
