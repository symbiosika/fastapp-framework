# User Management API Endpoints

These endpoints allow you to manage organizations, teams, permissions, and invitations within the system.

## Organization Management

### Create Organization

Creates a new organisation.

```http
POST /api/v1/organisations
```

#### Request Body

```json
{
  "name": "My Organization",
  "description": "Organization description"
}
```

### Get Organization

Retrieves a specific organisation by ID.

```http
GET /api/v1/organisations/:organisationId
```

### Update Organization

Updates an existing organisation.

```http
PUT /api/v1/organisations/:organisationId
```

#### Request Body

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Organization

Deletes an organisation.

```http
DELETE /api/v1/organisations/:organisationId
```

## Team Management

### Create Team

Creates a new team within an organisation.

```http
POST /api/v1//organisations/:organisationId/teams
```

#### Request Body

```json
{
  "name": "Team Name",
  "description": "Team description",
  "organisationId": "org-uuid",
  "meta": {} // Optional metadata
}
```

### Get Teams by Organization

Retrieves all teams and their members for a specific organisation.

```http
GET /api/v1/organisations/:organisationId/teams
```

### Update Team

Updates an existing team.

```http
PUT /api/v1/organisations/:organisationId/teams/:teamId
```

#### Request Body

```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "meta": {} // Optional metadata
}
```

### Delete Team

Deletes a team.

```http
DELETE /api/v1/organisations/:organisationId/teams/:teamId
```

## Team Member Management

### Add Team Member

Adds a user to a team.

```http
POST /api/v1/organisations/:organisationId/teams/:teamId/members
```

#### Request Body

```json
{
  "userId": "user-uuid",
  "role": "member" // Optional role
}
```

### Remove Team Member

Removes a user from a team.

```http
DELETE /api/v1/organisations/:organisationId/teams/:teamId/members/:userId
```

## Permission Management

### Create Permission Group

Creates a new permission group.

```http
POST /api/v1/organisations/:organisationId/permission-groups
```

#### Request Body

```json
{
  "name": "Group Name",
  "meta": {}, // Optional metadata
  "organisationId": "org-uuid"
}
```

### Get Permission Group

Retrieves a specific permission group.

```http
GET /api/v1/organisations/:organisationId/permission-groups/:permissionGroupId
```

### Update Permission Group

Updates an existing permission group.

```http
PUT /api/v1/organisations/:organisationId/permission-groups/:permissionGroupId
```

#### Request Body

```json
{
  "name": "Updated Group Name",
  "meta": {} // Optional metadata
}
```

### Delete Permission Group

Deletes a permission group.

```http
DELETE /api/v1/organisations/:organisationId/permission-groups/:permissionGroupId
```

## Path Permissions

### Create Path Permission

Creates a new path permission.

```http
POST /api/v1/organisations/:organisationId/path-permissions
```

#### Request Body

```json
{
  "system": false,
  "category": "manage-teams",
  "name": "permission-name",
  "description": "Permission description",
  "method": "GET",
  "pathExpression": "^/api/.*$",
  "organisationId": "org-uuid" // Optional
}
```

### Get Path Permission

Retrieves a specific path permission.

```http
GET /api/v1/organisations/:organisationId/path-permissions/:pathPermissionId
```

### Update Path Permission

Updates an existing path permission.

```http
PUT /api/v1/organisations/:organisationId/path-permissions/:pathPermissionId
```

### Delete Path Permission

Deletes a path permission.

```http
DELETE /api/v1/organisations/:organisationId/path-permissions/:pathPermissionId
```

## Permission Assignment

### Assign Permission to Group

Assigns a permission to a permission group.

```http
POST /api/v1/organisations/:organisationId/permission-groups/:permissionGroupId/permissions/:permissionId
```

### Remove Permission from Group

Removes a permission from a permission group.

```http
DELETE /api/v1/organisations/:organisationId/permission-groups/:permissionGroupId/permissions/:permissionId
```

## Organization Invitations

### Create Invitation

Creates a new organisation invitation.

```http
POST /api/v1/organisations/:organisationId/invitations
```

#### Request Body

```json
{
  "email": "user@example.com",
  "organisationId": "org-uuid"
}
```

### Get All Invitations

Retrieves all organisation invitations.

```http
GET /api/v1/organisations/:organisationId/invitations
```

### Accept Invitation

Accepts an organisation invitation.

```http
POST /api/v1/organisations/:organisationId/invitations/:id/accept
```

Note: Use `id=all` to accept all pending invitations for the authenticated user.

### Decline Invitation

Declines an organisation invitation.

```http
POST /api/v1/organisations/:organisationId/invitations/:id/decline
```

## User Organization Management

### Get User Organizations

Retrieves all organizations for the authenticated user.

```http
GET /api/v1/user/my-organisations
```

### Get Last Organization

Retrieves the last accessed organisation for the authenticated user.

```http
GET /api/v1/user/last-organisation
```

### Set Last Organization

Sets the last accessed organisation for the authenticated user.

```http
POST /api/v1/user/set-last-organisation/:id
```

### Get Organization Permission Groups

Retrieves all permission groups for a specific organisation.

```http
GET /api/v1/organisations/:organisationId/permission-groups
```

## Authentication

All endpoints require authentication using the `authAndSetUsersInfo` middleware. The user's ID will be available in the context as `usersId`.

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 404: Resource not found
- 500: Server error with error message

Error responses include a message field explaining the error:

```json
{
  "message": "Error description"
}
```
