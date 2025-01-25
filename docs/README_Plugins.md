# Plugin Management API Endpoints

These endpoints allow you to manage server plugins, including listing available plugins, installing new plugins, and managing their configurations.

## List Available Plugins

Retrieves all plugins that are available for installation.

```http
GET /api/v1/organisation/:organisationId/plugins/available
```

### Response

```json
[
  {
    "name": "plugin-name",
    "version": 1,
    "neededParameters": [
      {
        "category": "general",
        "type": "string|boolean|number|secret",
        "name": "parameterName",
        "label": "Parameter Label",
        "description": "Parameter description"
      }
    ]
  }
]
```

## List Installed Plugins

Retrieves all installed plugins with their configurations.

```http
GET /api/v1/organisation/:organisationId/plugins/installed
```

### Response

```json
[
  {
    "id": "plugin-uuid",
    "name": "plugin-name",
    "description": "Plugin description",
    "meta": {
      "parameterName": {
        "type": "string|boolean|number|secret",
        "value?": "parameter value", // only set if non-secret
        "id?": "database-id-for-the-secret" // only set if secret
      }
    },
    "isValid": true,
    "error": "null|string"
  }
]
```

## Get Single Plugin

Retrieves a specific plugin by its ID or name.

```http
GET /api/v1/organisation/:organisationId/plugins/installed/:idOrName
```

### Parameters

| Parameter  | Type   | Description                           |
| ---------- | ------ | ------------------------------------- |
| `idOrName` | string | Either the UUID or name of the plugin |

### Response

```json
{
  "id": "plugin-uuid",
  "name": "plugin-name",
  "description": "Plugin description",
  "meta": {
    "parameterName": {
      "type": "string|boolean|number|secret",
      "value": "parameter value" // or "id" for secrets
    }
  }
}
```

## Register New Plugin

Registers a new plugin in the system.

```http
POST /api/v1/organisation/:organisationId/plugins/installed
```

### Request Body

```json
{
  "name": "github-demo",
  "description": "Demo",
  "pluginType": "github-issues",
  "version": 1,
  "meta": {
    "apiToken": {
      "type": "secret",
      "inputValue": "github_pat_so-secret"
    },
    "owner": {
      "type": "string",
      "value": "my-org"
    },
    "repo": {
      "type": "string",
      "value": "my-repo"
    }
  }
}
```

## Update Plugin Configuration

Updates the configuration of an existing plugin.

```http
PUT /api/v1/organisation/:organisationId/plugins/installed/:id
```

### Parameters

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| `id`      | string | The UUID of the plugin |

### Request Body

```json
{
  "name": "plugin-name",
  "description": "Updated description",
  "meta": {
    "parameterName": {
      "type": "string",
      "value": "new value"
    },
    "secretParam": {
      "type": "secret",
      "id": "existing-secret-id", // Optional: Include to keep existing secret
      "inputValue": "new-secret-value" // Optional: Include to update secret
    }
  }
}
```

## Delete Plugin

Removes a plugin from the system.

```http
DELETE /api/v1/organisation/:organisationId/plugins/installed/:id
```

### Parameters

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| `id`      | string | The UUID of the plugin |
