# Knowledge Texts API Documentation

The Knowledge Texts API provides CRUD operations for managing knowledge text entries within organizations. Each entry can be associated with specific users, teams, or workspaces for access control.

## Data Types

### KnowledgeTextInsert
```typescript
{
  organisationId: string;
  teamId?: string;
  userId?: string;
  workspaceId?: string;
  text: string;
  title: string;
  meta: Record<string, string | number | boolean | undefined>;
}
```

### KnowledgeTextSelect (Response Type)
```typescript
{
  id: string;
  organisationId: string;
  teamId?: string;
  userId?: string;
  workspaceId?: string;
  text: string;
  title: string;
  meta: Record<string, string | number | boolean | undefined>;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Create Knowledge Text
Creates a new knowledge text entry.

**Endpoint:** `POST /api/v1/organisation/:organisationId/ai/knowledge/texts`
**Auth:** Required  
**Permissions:** User must have access to the organization

**Request Body:**
```json
{
  "organisationId": "uuid",
  "text": "Content of the knowledge text",
  "title": "Optional title",
  "meta": {
    "category": "documentation",
    "language": "en"
  }
}
```

**Response:** Returns the created knowledge text entry

### Read Knowledge Texts
Retrieves knowledge text entries with optional filtering.

**Endpoint:** `GET /api/v1/organisation/:organisationId/ai/knowledge/texts`  
**Auth:** Required  
**Permissions:** User must have access to the organization

**Query Parameters:**
- `id`: Optional specific entry ID
- `limit`: Maximum number of entries (default: 10)
- `page`: Page number for pagination (default: 1)
- `teamId`: Filter by team
- `workspaceId`: Filter by workspace

**Response:** Returns an array of knowledge text entries

### Update Knowledge Text
Updates an existing knowledge text entry.

**Endpoint:** `PUT /api/v1/organisation/:organisationId/ai/knowledge/texts/:id`  
**Auth:** Required  
**Permissions:** User must have access to the organization and the specific entry

**Request Body:**
```json
{
  "organisationId": "uuid",
  "text": "Updated content",
  "title": "Updated title",
  "meta": {
    "status": "reviewed"
  }
}
```

**Response:** Returns the updated knowledge text entry

### Delete Knowledge Text
Deletes a knowledge text entry.

**Endpoint:** `DELETE /api/v1/organisation/:organisationId/ai/knowledge/texts/:id`  
**Auth:** Required  
**Permissions:** User must have access to the organization and the specific entry

**Response:**
```json
{
  "success": true
}
```

## Access Control
- Entries can be associated with specific users, teams, or workspaces
- Public entries have null values for userId, teamId, and workspaceId
- Users can only access entries that are either:
  - Public (no specific assignments)
  - Assigned to their user ID
  - Assigned to their team
  - Assigned to their workspace

## Error Handling
All endpoints return HTTP 400 with an error message if:
- Required parameters are missing
- Validation fails
- Entry is not found
- User lacks permission to access the entry

Example error response:
```json
{
  "message": "Knowledge text not found or access denied"
}
```
