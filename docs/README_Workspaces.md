# Workspace API Documentation

## Endpoints

### Get All Workspaces
```
GET /api/v1/organisation/{organisationId}/workspaces
```
Returns all workspaces accessible by the authenticated user (personal and team workspaces).

### Get Single Workspace
```
GET /api/v1/organisation/{organisationId}/workspaces/{workspaceId}
```
Returns a specific workspace by ID.

### Create Workspace
```
POST /api/v1/organisation/{organisationId}/workspaces
```
Creates a new workspace.

**Request Body:**
```typescript
{
  organisationId: string;  // UUID
  userId?: string;        // UUID - Either userId or teamId must be set
  teamId?: string;        // UUID - Either userId or teamId must be set
  name: string;
  description?: string;
  // Optional relations
  knowledgeTextIds?: string[];      // Array of UUIDs
  knowledgeEntryIds?: string[];     // Array of UUIDs
  promptTemplateIds?: string[];     // Array of UUIDs
  chatGroupIds?: string[];          // Array of UUIDs
  chatSessionIds?: string[];        // Array of UUIDs
}
```

### Update Workspace
```
PUT /api/v1/organisation/{organisationId}/workspaces/{workspaceId}
```
Updates an existing workspace.

**Request Body:**
```typescript
{
  organisationId: string;  // UUID
  name?: string;
  description?: string;
}
```

### Delete Workspace
```
DELETE /api/v1/organisation/{organisationId}/workspaces/{workspaceId}
```
Deletes a workspace.

### Add Relations to Workspace
```
POST /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/relations
```
Adds relations (knowledge texts, entries, templates, etc.) to a workspace.

**Request Body:**
```typescript
{
  knowledgeTextIds?: string[];      // Array of UUIDs
  knowledgeEntryIds?: string[];     // Array of UUIDs
  promptTemplateIds?: string[];     // Array of UUIDs
  chatGroupIds?: string[];          // Array of UUIDs
  chatSessionIds?: string[];        // Array of UUIDs
}
```

### Remove Relations from Workspace
```
DELETE /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/relations
```
Removes relations from a workspace.

**Request Body:**
```typescript
{
  knowledgeTextIds?: string[];      // Array of UUIDs
  knowledgeEntryIds?: string[];     // Array of UUIDs
  promptTemplateIds?: string[];     // Array of UUIDs
  chatGroupIds?: string[];          // Array of UUIDs
  chatSessionIds?: string[];        // Array of UUIDs
}
```

## Authentication

All endpoints require JWT authentication and appropriate permissions.

## Error Responses

All endpoints may return:
- `400` for validation errors
- `500` for server errors
- Error response format:
```typescript
{
  message: string
}
```
