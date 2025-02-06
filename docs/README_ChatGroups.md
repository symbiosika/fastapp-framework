# Chat Groups API Documentation

Chat Groups allow users to organize and share chat sessions with other users within an organisation.

## Endpoints

### Get User's Chat Groups

```
GET /api/v1/organisation/{organisationId}/ai/chat-groups
```

Returns all chat groups the authenticated user is a member of.

### Create Chat Group

```
POST /api/v1/organisation/{organisationId}/ai/chat-groups
```

Creates a new chat group and automatically adds the creating user as a member.

**Request Body:**

```typescript
{
  name: string;
  meta?: Record<string, any>;  // Optional metadata
}
```

### Update Chat Group

```
PUT /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}
```

Updates an existing chat group. Only members can update the group.

**Request Body:**

```typescript
{
  name?: string;
  meta?: Record<string, any>;
}
```

### Delete Chat Group

```
DELETE /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}
```

Deletes a chat group. Only members can delete the group.

### Add Users to Group

```
POST /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}/users
```

Adds multiple users to a chat group. Only existing members can add new users.

**Request Body:**

```typescript
{
  userIds: string[];  // Array of user IDs to add
}
```

### Remove Users from Group

```
DELETE /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}/users
```

Removes multiple users from a chat group. Only existing members can remove users.

**Request Body:**

```typescript
{
  userIds: string[];  // Array of user IDs to remove
}
```

### Get Group Chat History

```
GET /api/v1/organisation/{organisationId}/ai/chat/history/group/{groupId}
```

Returns the chat history for all chat sessions in a specific group.

## Authentication

All endpoints require JWT authentication and appropriate permissions.

## Error Responses

Common error responses:

- `400` Bad Request - Invalid input
- `403` Forbidden - User not authorized (e.g., not a group member)
- `404` Not Found - Group not found

Error response format:

```typescript
{
  message: string;
}
```
