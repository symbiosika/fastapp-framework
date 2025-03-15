---
title: Symbiosika Backend API v1.0.0
language_tabs:
  - javascript: JavaScript
    typescript: TypeScript
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="symbiosika-backend-api">Symbiosika Backend API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

API for the Symbiosika AI Backend

<h1 id="symbiosika-backend-api-default">Default</h1>

## Create a new organisation

<a id="opIdpostApiV1Organisation"></a>

`POST /api/v1/organisation`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ]
}
```

<h3 id="create-a-new-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» description|body|string¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="create-a-new-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get an organisation

<a id="opIdgetApiV1OrganisationByOrganisationId"></a>

`GET /api/v1/organisation/{organisationId}`

<h3 id="get-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update an organisation

<a id="opIdputApiV1OrganisationByOrganisationId"></a>

`PUT /api/v1/organisation/{organisationId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|false|none|
|» description|body|string¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete an organisation

<a id="opIddeleteApiV1OrganisationByOrganisationId"></a>

`DELETE /api/v1/organisation/{organisationId}`

<h3 id="delete-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

<h3 id="delete-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get all members of an organisation

<a id="opIdgetApiV1OrganisationByOrganisationIdMembers"></a>

`GET /api/v1/organisation/{organisationId}/members`

<h3 id="get-all-members-of-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "userEmail": {
        "type": "string"
      },
      "role": {
        "anyOf": [
          {
            "enum": [
              null
            ]
          },
          {
            "enum": [
              null
            ]
          },
          {
            "enum": [
              null
            ]
          }
        ]
      },
      "joinedAt": {
        "type": "string"
      }
    },
    "required": [
      "userEmail",
      "role",
      "joinedAt"
    ]
  }
}
```

<h3 id="get-all-members-of-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-members-of-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userEmail|string|true|none|none|
|» role|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» joinedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Add a user directly to an organisation

<a id="opIdpostApiV1OrganisationByOrganisationIdMembers"></a>

`POST /api/v1/organisation/{organisationId}/members`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    }
  },
  "required": [
    "userId"
  ]
}
```

<h3 id="add-a-user-directly-to-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» userId|body|string|true|none|
|» role|body|any|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "role": {
      "enum": [
        "owner",
        "admin",
        "member"
      ]
    },
    "joinedAt": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "organisationId",
    "role",
    "joinedAt"
  ]
}
```

<h3 id="add-a-user-directly-to-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-a-user-directly-to-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» role|any|true|none|none|
|» joinedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|role|owner|
|role|admin|
|role|member|

<aside class="success">
This operation does not require authentication
</aside>

## Invite a user to an organisation by email

<a id="opIdpostApiV1OrganisationByOrganisationIdInvite"></a>

`POST /api/v1/organisation/{organisationId}/invite`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    },
    "sendMail": {
      "type": "boolean"
    }
  },
  "required": [
    "email"
  ]
}
```

<h3 id="invite-a-user-to-an-organisation-by-email-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» email|body|string(email)|true|none|
|» role|body|any|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|» sendMail|body|boolean|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string"
    },
    "role": {
      "enum": [
        "owner",
        "admin",
        "member"
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "maxLength": 50
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "email",
    "role",
    "organisationId",
    "status",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="invite-a-user-to-an-organisation-by-email-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="invite-a-user-to-an-organisation-by-email-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» email|string|true|none|none|
|» role|any|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» status|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|role|owner|
|role|admin|
|role|member|

<aside class="success">
This operation does not require authentication
</aside>

## Change the role of a member

<a id="opIdputApiV1OrganisationByOrganisationIdMembersByMemberId"></a>

`PUT /api/v1/organisation/{organisationId}/members/{memberId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    }
  },
  "required": [
    "role"
  ]
}
```

<h3 id="change-the-role-of-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|memberId|path|string|true|none|
|body|body|object|false|none|
|» role|body|any|true|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "role": {
      "enum": [
        "owner",
        "admin",
        "member"
      ]
    },
    "joinedAt": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "organisationId",
    "role",
    "joinedAt"
  ]
}
```

<h3 id="change-the-role-of-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="change-the-role-of-a-member-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» role|any|true|none|none|
|» joinedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|role|owner|
|role|admin|
|role|member|

<aside class="success">
This operation does not require authentication
</aside>

## Remove a member from an organisation

<a id="opIddeleteApiV1OrganisationByOrganisationIdMembersByMemberId"></a>

`DELETE /api/v1/organisation/{organisationId}/members/{memberId}`

<h3 id="remove-a-member-from-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|memberId|path|string|true|none|

<h3 id="remove-a-member-from-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-admin">admin</h1>

## Health check endpoint

<a id="opIdgetApiV1Ping"></a>

`GET /api/v1/ping`

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "online": {
      "type": "boolean"
    },
    "canConnectToInternet": {
      "type": "boolean"
    }
  },
  "required": [
    "online",
    "canConnectToInternet"
  ]
}
```

<h3 id="health-check-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="health-check-endpoint-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» online|boolean|true|none|none|
|» canConnectToInternet|boolean|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Download logs

<a id="opIdgetApiV1AdminLogsDownload"></a>

`GET /api/v1/admin/logs/download`

> Example responses

> 200 Response

<h3 id="download-logs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|string|

<aside class="success">
This operation does not require authentication
</aside>

## Clear logs

<a id="opIdpostApiV1AdminLogsClear"></a>

`POST /api/v1/admin/logs/clear`

<h3 id="clear-logs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-user">user</h1>

## Login endpoint

<a id="opIdpostApiV1UserLogin"></a>

`POST /api/v1/user/login`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "magicLinkToken": {
      "type": "string"
    },
    "redirectUrl": {
      "type": "string"
    }
  },
  "required": [
    "email",
    "password"
  ]
}
```

<h3 id="login-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» email|body|string|true|none|
|» password|body|string|true|none|
|» magicLinkToken|body|string|false|none|
|» redirectUrl|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "email": {
          "type": "string"
        },
        "emailVerified": {
          "type": "boolean"
        },
        "image": {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            }
          ]
        },
        "firstname": {
          "type": "string",
          "maxLength": 255
        },
        "surname": {
          "type": "string",
          "maxLength": 255
        },
        "createdAt": {
          "type": "string"
        },
        "updatedAt": {
          "type": "string"
        },
        "extUserId": {
          "type": "string"
        },
        "meta": {
          "anyOf": [
            {
              "anyOf": [
                {
                  "anyOf": [
                    {
                      "type": "string",
                      "nullable": true
                    },
                    {
                      "type": "number",
                      "nullable": true
                    },
                    {
                      "type": "boolean",
                      "nullable": true
                    }
                  ]
                },
                {
                  "type": "array",
                  "items": {}
                },
                {
                  "type": "object",
                  "additionalProperties": {}
                }
              ],
              "nullable": true
            }
          ]
        },
        "lastOrganisationId": {
          "anyOf": [
            {
              "type": "string",
              "format": "uuid",
              "nullable": true
            }
          ]
        }
      },
      "required": [
        "id",
        "email",
        "emailVerified",
        "image",
        "firstname",
        "surname",
        "createdAt",
        "updatedAt",
        "extUserId",
        "meta",
        "lastOrganisationId"
      ]
    },
    "token": {
      "type": "string"
    },
    "redirectUrl": {
      "type": "string"
    }
  },
  "required": [
    "user",
    "token"
  ]
}
```

<h3 id="login-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="login-endpoint-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» user|object|true|none|none|
|»» id|string(uuid)|true|none|none|
|»» email|string|true|none|none|
|»» emailVerified|boolean|true|none|none|
|»» image|string¦null|true|none|none|
|»» firstname|string|true|none|none|
|»» surname|string|true|none|none|
|»» createdAt|string|true|none|none|
|»» updatedAt|string|true|none|none|
|»» extUserId|string|true|none|none|
|»» meta|any|true|none|none|
|»» lastOrganisationId|string(uuid)¦null|true|none|none|
|» token|string|true|none|none|
|» redirectUrl|string|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Send a magic link to the user

<a id="opIdgetApiV1UserSend-magic-link"></a>

`GET /api/v1/user/send-magic-link`

<h3 id="send-a-magic-link-to-the-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|email|query|string|true|none|

<h3 id="send-a-magic-link-to-the-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Send a verification email to the user

<a id="opIdgetApiV1UserSend-verification-email"></a>

`GET /api/v1/user/send-verification-email`

<h3 id="send-a-verification-email-to-the-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|email|query|string|true|none|

<h3 id="send-a-verification-email-to-the-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Verify email endpoint

<a id="opIdgetApiV1UserVerify-email"></a>

`GET /api/v1/user/verify-email`

<h3 id="verify-email-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|token|query|string|true|none|

<h3 id="verify-email-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Register endpoint

<a id="opIdpostApiV1UserRegister"></a>

`POST /api/v1/user/register`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "sendVerificationEmail": {
      "type": "boolean"
    },
    "meta": {}
  },
  "required": [
    "email",
    "password"
  ]
}
```

<h3 id="register-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» email|body|string|true|none|
|» password|body|string|true|none|
|» sendVerificationEmail|body|boolean|false|none|
|» meta|body|any|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string"
    },
    "emailVerified": {
      "type": "boolean"
    },
    "image": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "firstname": {
      "type": "string",
      "maxLength": 255
    },
    "surname": {
      "type": "string",
      "maxLength": 255
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "extUserId": {
      "type": "string"
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "lastOrganisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "email",
    "emailVerified",
    "image",
    "firstname",
    "surname",
    "createdAt",
    "updatedAt",
    "extUserId",
    "meta",
    "lastOrganisationId"
  ]
}
```

<h3 id="register-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="register-endpoint-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» email|string|true|none|none|
|» emailVerified|boolean|true|none|none|
|» image|string¦null|true|none|none|
|» firstname|string|true|none|none|
|» surname|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» extUserId|string|true|none|none|
|» meta|any|true|none|none|
|» lastOrganisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Forgot password endpoint

<a id="opIdpostApiV1UserForgot-password"></a>

`POST /api/v1/user/forgot-password`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    }
  },
  "required": [
    "email"
  ]
}
```

<h3 id="forgot-password-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» email|body|string|true|none|

<h3 id="forgot-password-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Reset password with token

<a id="opIdpostApiV1UserReset-password"></a>

`POST /api/v1/user/reset-password`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string"
    },
    "password": {
      "type": "string"
    }
  },
  "required": [
    "token",
    "password"
  ]
}
```

<h3 id="reset-password-with-token-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» token|body|string|true|none|
|» password|body|string|true|none|

<h3 id="reset-password-with-token-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get the own user

<a id="opIdgetApiV1UserMe"></a>

`GET /api/v1/user/me`

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string"
    },
    "emailVerified": {
      "type": "boolean"
    },
    "image": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "firstname": {
      "type": "string",
      "maxLength": 255
    },
    "surname": {
      "type": "string",
      "maxLength": 255
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "extUserId": {
      "type": "string"
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "lastOrganisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "email",
    "emailVerified",
    "image",
    "firstname",
    "surname",
    "createdAt",
    "updatedAt",
    "extUserId",
    "meta",
    "lastOrganisationId"
  ]
}
```

<h3 id="get-the-own-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-the-own-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» email|string|true|none|none|
|» emailVerified|boolean|true|none|none|
|» image|string¦null|true|none|none|
|» firstname|string|true|none|none|
|» surname|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» extUserId|string|true|none|none|
|» meta|any|true|none|none|
|» lastOrganisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update the own user

<a id="opIdputApiV1UserMe"></a>

`PUT /api/v1/user/me`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "firstname": {
      "type": "string"
    },
    "surname": {
      "type": "string"
    },
    "image": {
      "type": "string"
    },
    "lastOrganisationId": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    }
  },
  "required": []
}
```

<h3 id="update-the-own-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» firstname|body|string|false|none|
|» surname|body|string|false|none|
|» image|body|string|false|none|
|» lastOrganisationId|body|string¦null|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string"
    },
    "emailVerified": {
      "type": "boolean"
    },
    "image": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "firstname": {
      "type": "string",
      "maxLength": 255
    },
    "surname": {
      "type": "string",
      "maxLength": 255
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "extUserId": {
      "type": "string"
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "lastOrganisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "email",
    "emailVerified",
    "image",
    "firstname",
    "surname",
    "createdAt",
    "updatedAt",
    "extUserId",
    "meta",
    "lastOrganisationId"
  ]
}
```

<h3 id="update-the-own-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-the-own-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» email|string|true|none|none|
|» emailVerified|boolean|true|none|none|
|» image|string¦null|true|none|none|
|» firstname|string|true|none|none|
|» surname|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» extUserId|string|true|none|none|
|» meta|any|true|none|none|
|» lastOrganisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Setup the user's first organisation. Can throw an error if the user already has an organisation and this is not allowed

<a id="opIdpostApiV1UserSetup"></a>

`POST /api/v1/user/setup`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationName": {
      "type": "string"
    }
  },
  "required": [
    "organisationName"
  ]
}
```

<h3 id="setup-the-user's-first-organisation.-can-throw-an-error-if-the-user-already-has-an-organisation-and-this-is-not-allowed-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» organisationName|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="setup-the-user's-first-organisation.-can-throw-an-error-if-the-user-already-has-an-organisation-and-this-is-not-allowed-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="setup-the-user's-first-organisation.-can-throw-an-error-if-the-user-already-has-an-organisation-and-this-is-not-allowed-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Change the own password

<a id="opIdputApiV1UserMePassword"></a>

`PUT /api/v1/user/me/password`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "oldPassword": {
      "type": "string"
    },
    "newPassword": {
      "type": "string"
    }
  },
  "required": [
    "oldPassword",
    "newPassword"
  ]
}
```

<h3 id="change-the-own-password-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» oldPassword|body|string|true|none|
|» newPassword|body|string|true|none|

<h3 id="change-the-own-password-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get the user's organisations

<a id="opIdgetApiV1UserOrganisations"></a>

`GET /api/v1/user/organisations`

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "organisationId": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "role": {
        "type": "string"
      }
    },
    "required": [
      "organisationId",
      "name",
      "role"
    ]
  }
}
```

<h3 id="get-the-user's-organisations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-the-user's-organisations-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» organisationId|string|true|none|none|
|» name|string|true|none|none|
|» role|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Drop the membership of the user itself from an organisation

<a id="opIddeleteApiV1UserOrganisationByOrganisationIdMembership"></a>

`DELETE /api/v1/user/organisation/{organisationId}/membership`

<h3 id="drop-the-membership-of-the-user-itself-from-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

<h3 id="drop-the-membership-of-the-user-itself-from-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get the user's teams

<a id="opIdgetApiV1UserOrganisationByOrganisationIdTeams"></a>

`GET /api/v1/user/organisation/{organisationId}/teams`

<h3 id="get-the-user's-teams-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "teamId": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "role": {
        "type": "string"
      }
    },
    "required": [
      "teamId",
      "name",
      "role"
    ]
  }
}
```

<h3 id="get-the-user's-teams-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-the-user's-teams-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» teamId|string|true|none|none|
|» name|string|true|none|none|
|» role|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Drop the membership of the user itself from a team

<a id="opIddeleteApiV1UserOrganisationByOrganisationIdTeamsByTeamIdMembership"></a>

`DELETE /api/v1/user/organisation/{organisationId}/teams/{teamId}/membership`

<h3 id="drop-the-membership-of-the-user-itself-from-a-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|teamId|path|string|true|none|
|organisationId|path|string|true|none|

<h3 id="drop-the-membership-of-the-user-itself-from-a-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get the user's last organisation

<a id="opIdgetApiV1UserLast-organisation"></a>

`GET /api/v1/user/last-organisation`

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "lastOrganisationId": {
      "type": "string"
    },
    "organisationName": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "lastOrganisationId",
    "organisationName"
  ]
}
```

<h3 id="get-the-user's-last-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-the-user's-last-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string|true|none|none|
|» lastOrganisationId|string|true|none|none|
|» organisationName|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Set the user's last organisation

<a id="opIdputApiV1UserLast-organisation"></a>

`PUT /api/v1/user/last-organisation`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    }
  },
  "required": [
    "organisationId"
  ]
}
```

<h3 id="set-the-user's-last-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|none|
|» organisationId|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "lastOrganisationId": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "lastOrganisationId"
  ]
}
```

<h3 id="set-the-user's-last-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="set-the-user's-last-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string|true|none|none|
|» lastOrganisationId|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Search for users by email address in the whole Application

<a id="opIdgetApiV1UserSearch"></a>

`GET /api/v1/user/search`

<h3 id="search-for-users-by-email-address-in-the-whole-application-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|email|query|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "firstname": {
      "type": "string"
    },
    "surname": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "email",
    "firstname",
    "surname"
  ]
}
```

<h3 id="search-for-users-by-email-address-in-the-whole-application-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="search-for-users-by-email-address-in-the-whole-application-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» email|string|true|none|none|
|» firstname|string|true|none|none|
|» surname|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Refresh the own token

<a id="opIdgetApiV1UserRefresh-token"></a>

`GET /api/v1/user/refresh-token`

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string"
    },
    "expiresAt": {
      "type": "string"
    }
  },
  "required": [
    "token",
    "expiresAt"
  ]
}
```

<h3 id="refresh-the-own-token-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="refresh-the-own-token-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» token|string|true|none|none|
|» expiresAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-invitations">invitations</h1>

## Get all pending invitations for my user

<a id="opIdgetApiV1UserOrganisationsInvitations"></a>

`GET /api/v1/user/organisations/invitations`

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "email": {
        "type": "string"
      },
      "role": {
        "enum": [
          "owner",
          "admin",
          "member"
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "status": {
        "type": "string",
        "maxLength": 50
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "email",
      "role",
      "organisationId",
      "status",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-pending-invitations-for-my-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-pending-invitations-for-my-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» email|string|true|none|none|
|» role|any|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» status|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|role|owner|
|role|admin|
|role|member|

<aside class="success">
This operation does not require authentication
</aside>

## Create a new invitation

<a id="opIdpostApiV1OrganisationByOrganisationIdInvitations"></a>

`POST /api/v1/organisation/{organisationId}/invitations`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string"
    },
    "role": {
      "enum": [
        "owner",
        "admin",
        "member"
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "maxLength": 50
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "email",
    "organisationId"
  ]
}
```

<h3 id="create-a-new-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» email|body|string|true|none|
|» role|body|any|false|none|
|» organisationId|body|string(uuid)|true|none|
|» status|body|string|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» role|owner|
|» role|admin|
|» role|member|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "organisationId": {
      "type": "string"
    },
    "organisationName": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "status": {
      "type": "string"
    },
    "role": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "organisationName",
    "email",
    "status",
    "role"
  ]
}
```

<h3 id="create-a-new-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-invitation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» organisationId|string|true|none|none|
|» organisationName|string|true|none|none|
|» email|string|true|none|none|
|» status|string|true|none|none|
|» role|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all invitations of an organisation to manage them as an admin overview. This path is not for a user to get his own invitations.

<a id="opIdgetApiV1OrganisationByOrganisationIdInvitations"></a>

`GET /api/v1/organisation/{organisationId}/invitations`

<h3 id="get-all-invitations-of-an-organisation-to-manage-them-as-an-admin-overview.-this-path-is-not-for-a-user-to-get-his-own-invitations.-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "email": {
        "type": "string"
      },
      "role": {
        "enum": [
          "owner",
          "admin",
          "member"
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "status": {
        "type": "string",
        "maxLength": 50
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "email",
      "role",
      "organisationId",
      "status",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-invitations-of-an-organisation-to-manage-them-as-an-admin-overview.-this-path-is-not-for-a-user-to-get-his-own-invitations.-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-invitations-of-an-organisation-to-manage-them-as-an-admin-overview.-this-path-is-not-for-a-user-to-get-his-own-invitations.-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» email|string|true|none|none|
|» role|any|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» status|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|role|owner|
|role|admin|
|role|member|

<aside class="success">
This operation does not require authentication
</aside>

## Drop an invitation by its ID

<a id="opIddeleteApiV1OrganisationByOrganisationIdInvitationsById"></a>

`DELETE /api/v1/organisation/{organisationId}/invitations/{id}`

<h3 id="drop-an-invitation-by-its-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="drop-an-invitation-by-its-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Accept an invitation by the User himself

<a id="opIdpostApiV1OrganisationByOrganisationIdInvitationsByIdAccept"></a>

`POST /api/v1/organisation/{organisationId}/invitations/{id}/accept`

<h3 id="accept-an-invitation-by-the-user-himself-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="accept-an-invitation-by-the-user-himself-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Decline an invitation

<a id="opIdpostApiV1OrganisationByOrganisationIdInvitationsByIdDecline"></a>

`POST /api/v1/organisation/{organisationId}/invitations/{id}/decline`

<h3 id="decline-an-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="decline-an-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-teams">teams</h1>

## Create a new team

<a id="opIdpostApiV1OrganisationByOrganisationIdTeams"></a>

`POST /api/v1/organisation/{organisationId}/teams`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "name",
    "organisationId"
  ]
}
```

<h3 id="create-a-new-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» description|body|string¦null|false|none|
|» meta|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» organisationId|body|string(uuid)|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "meta",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="create-a-new-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-team-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all teams of an organisation

<a id="opIdgetApiV1OrganisationByOrganisationIdTeams"></a>

`GET /api/v1/organisation/{organisationId}/teams`

<h3 id="get-all-teams-of-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "description": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": [
      "id",
      "name",
      "description",
      "meta",
      "createdAt",
      "updatedAt",
      "organisationId"
    ]
  }
}
```

<h3 id="get-all-teams-of-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-teams-of-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get a team by its id

<a id="opIdgetApiV1OrganisationByOrganisationIdTeamsByTeamId"></a>

`GET /api/v1/organisation/{organisationId}/teams/{teamId}`

<h3 id="get-a-team-by-its-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "meta",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="get-a-team-by-its-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-a-team-by-its-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a team

<a id="opIdputApiV1OrganisationByOrganisationIdTeamsByTeamId"></a>

`PUT /api/v1/organisation/{organisationId}/teams/{teamId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "name",
    "organisationId"
  ]
}
```

<h3 id="update-a-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» description|body|string¦null|false|none|
|» meta|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» organisationId|body|string(uuid)|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "meta",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="update-a-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-team-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a team

<a id="opIddeleteApiV1OrganisationByOrganisationIdTeamsByTeamId"></a>

`DELETE /api/v1/organisation/{organisationId}/teams/{teamId}`

<h3 id="delete-a-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|

<h3 id="delete-a-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get all members of a team

<a id="opIdgetApiV1OrganisationByOrganisationIdTeamsByTeamIdMembers"></a>

`GET /api/v1/organisation/{organisationId}/teams/{teamId}/members`

<h3 id="get-all-members-of-a-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "teamId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      },
      "userEmail": {
        "type": "string"
      },
      "role": {
        "anyOf": [
          {
            "enum": [
              null
            ]
          },
          {
            "enum": [
              null
            ]
          }
        ]
      }
    },
    "required": [
      "teamId",
      "userId",
      "userEmail",
      "role"
    ]
  }
}
```

<h3 id="get-all-members-of-a-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-members-of-a-team-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» teamId|string|true|none|none|
|» userId|string|true|none|none|
|» userEmail|string|true|none|none|
|» role|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Add a member to a team

<a id="opIdpostApiV1OrganisationByOrganisationIdTeamsByTeamIdMembers"></a>

`POST /api/v1/organisation/{organisationId}/teams/{teamId}/members`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    }
  },
  "required": [
    "userId",
    "role"
  ]
}
```

<h3 id="add-a-member-to-a-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|
|body|body|object|false|none|
|» userId|body|string|true|none|
|» role|body|any|true|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|»» *anonymous*|null|
|»» *anonymous*|null|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "teamId": {
      "type": "string"
    },
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    },
    "joinedAt": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "teamId",
    "role",
    "joinedAt"
  ]
}
```

<h3 id="add-a-member-to-a-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-a-member-to-a-team-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string|true|none|none|
|» teamId|string|true|none|none|
|» role|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» joinedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Change the role of a member

<a id="opIdputApiV1OrganisationByOrganisationIdTeamsByTeamIdMembersByDestinationUserId"></a>

`PUT /api/v1/organisation/{organisationId}/teams/{teamId}/members/{destinationUserId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    }
  },
  "required": [
    "role"
  ]
}
```

<h3 id="change-the-role-of-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|
|destinationUserId|path|string|true|none|
|body|body|object|false|none|
|» role|body|any|true|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|»» *anonymous*|null|
|»» *anonymous*|null|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "teamId": {
      "type": "string"
    },
    "role": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    },
    "joinedAt": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "teamId",
    "role",
    "joinedAt"
  ]
}
```

<h3 id="change-the-role-of-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="change-the-role-of-a-member-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string|true|none|none|
|» teamId|string|true|none|none|
|» role|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» joinedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Remove a member from a team

<a id="opIddeleteApiV1OrganisationByOrganisationIdTeamsByTeamIdMembersByDestinationUserId"></a>

`DELETE /api/v1/organisation/{organisationId}/teams/{teamId}/members/{destinationUserId}`

<h3 id="remove-a-member-from-a-team-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|teamId|path|string|true|none|
|destinationUserId|path|string|true|none|

<h3 id="remove-a-member-from-a-team-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-permission-groups">permission-groups</h1>

## Create a new permission group

<a id="opIdpostApiV1OrganisationByOrganisationIdPermission-groups"></a>

`POST /api/v1/organisation/{organisationId}/permission-groups`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "name"
  ]
}
```

<h3 id="create-a-new-permission-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» meta|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» organisationId|body|string(uuid)¦null|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "name",
    "meta",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="create-a-new-permission-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-permission-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all permission groups of an organisation

<a id="opIdgetApiV1OrganisationByOrganisationIdPermission-groups"></a>

`GET /api/v1/organisation/{organisationId}/permission-groups`

<h3 id="get-all-permission-groups-of-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      },
      "organisationId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      }
    },
    "required": [
      "id",
      "name",
      "meta",
      "createdAt",
      "updatedAt",
      "organisationId"
    ]
  }
}
```

<h3 id="get-all-permission-groups-of-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-permission-groups-of-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get a single permission group

<a id="opIdgetApiV1OrganisationByOrganisationIdPermission-groupsById"></a>

`GET /api/v1/organisation/{organisationId}/permission-groups/{id}`

<h3 id="get-a-single-permission-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "name",
    "meta",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="get-a-single-permission-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-a-single-permission-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a permission group

<a id="opIdputApiV1OrganisationByOrganisationIdPermission-groupsById"></a>

`PUT /api/v1/organisation/{organisationId}/permission-groups/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": []
}
```

<h3 id="update-a-permission-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|false|none|
|» meta|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» organisationId|body|string(uuid)¦null|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "name",
    "meta",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="update-a-permission-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-permission-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a permission group

<a id="opIddeleteApiV1OrganisationByOrganisationIdPermission-groupsById"></a>

`DELETE /api/v1/organisation/{organisationId}/permission-groups/{id}`

<h3 id="delete-a-permission-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-permission-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Assign a permission to a permission group

<a id="opIdpostApiV1OrganisationByOrganisationIdPermission-groupsByGroupIdPermissionsByPermissionId"></a>

`POST /api/v1/organisation/{organisationId}/permission-groups/{groupId}/permissions/{permissionId}`

<h3 id="assign-a-permission-to-a-permission-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|
|permissionId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "groupId": {
      "type": "string"
    },
    "permissionId": {
      "type": "string"
    }
  },
  "required": [
    "groupId",
    "permissionId"
  ]
}
```

<h3 id="assign-a-permission-to-a-permission-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="assign-a-permission-to-a-permission-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» groupId|string|true|none|none|
|» permissionId|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Remove a permission from a permission group

<a id="opIddeleteApiV1OrganisationByOrganisationIdPermission-groupsByGroupIdPermissionsByPermissionId"></a>

`DELETE /api/v1/organisation/{organisationId}/permission-groups/{groupId}/permissions/{permissionId}`

<h3 id="remove-a-permission-from-a-permission-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|
|permissionId|path|string|true|none|

<h3 id="remove-a-permission-from-a-permission-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Create a new path permission

<a id="opIdpostApiV1OrganisationByOrganisationIdPath-permissions"></a>

`POST /api/v1/organisation/{organisationId}/path-permissions`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "system": {
      "type": "boolean"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "type": {
      "enum": [
        "regex"
      ]
    },
    "method": {
      "type": "string",
      "maxLength": 10
    },
    "pathExpression": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "category",
    "name",
    "method",
    "pathExpression"
  ]
}
```

<h3 id="create-a-new-path-permission-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» system|body|boolean|false|none|
|» category|body|string|true|none|
|» name|body|string|true|none|
|» description|body|string¦null|false|none|
|» type|body|string|false|none|
|» method|body|string|true|none|
|» pathExpression|body|string|true|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» organisationId|body|string(uuid)¦null|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» type|regex|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "system": {
      "type": "boolean"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "type": {
      "enum": [
        "regex"
      ]
    },
    "method": {
      "type": "string",
      "maxLength": 10
    },
    "pathExpression": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "system",
    "category",
    "name",
    "description",
    "type",
    "method",
    "pathExpression",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="create-a-new-path-permission-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-path-permission-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» system|boolean|true|none|none|
|» category|string|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» type|string|true|none|none|
|» method|string|true|none|none|
|» pathExpression|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|regex|

<aside class="success">
This operation does not require authentication
</aside>

## Get a single path permission

<a id="opIdgetApiV1OrganisationByOrganisationIdPath-permissionsById"></a>

`GET /api/v1/organisation/{organisationId}/path-permissions/{id}`

<h3 id="get-a-single-path-permission-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "system": {
      "type": "boolean"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "type": {
      "enum": [
        "regex"
      ]
    },
    "method": {
      "type": "string",
      "maxLength": 10
    },
    "pathExpression": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "system",
    "category",
    "name",
    "description",
    "type",
    "method",
    "pathExpression",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="get-a-single-path-permission-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-a-single-path-permission-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» system|boolean|true|none|none|
|» category|string|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» type|string|true|none|none|
|» method|string|true|none|none|
|» pathExpression|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|regex|

<aside class="success">
This operation does not require authentication
</aside>

## Update a path permission

<a id="opIdputApiV1OrganisationByOrganisationIdPath-permissionsById"></a>

`PUT /api/v1/organisation/{organisationId}/path-permissions/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "system": {
      "type": "boolean"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "type": {
      "enum": [
        "regex"
      ]
    },
    "method": {
      "type": "string",
      "maxLength": 10
    },
    "pathExpression": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": []
}
```

<h3 id="update-a-path-permission-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» system|body|boolean|false|none|
|» category|body|string|false|none|
|» name|body|string|false|none|
|» description|body|string¦null|false|none|
|» type|body|string|false|none|
|» method|body|string|false|none|
|» pathExpression|body|string|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» organisationId|body|string(uuid)¦null|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» type|regex|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "system": {
      "type": "boolean"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "type": {
      "enum": [
        "regex"
      ]
    },
    "method": {
      "type": "string",
      "maxLength": 10
    },
    "pathExpression": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "system",
    "category",
    "name",
    "description",
    "type",
    "method",
    "pathExpression",
    "createdAt",
    "updatedAt",
    "organisationId"
  ]
}
```

<h3 id="update-a-path-permission-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-path-permission-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» system|boolean|true|none|none|
|» category|string|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» type|string|true|none|none|
|» method|string|true|none|none|
|» pathExpression|string|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|regex|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a path permission

<a id="opIddeleteApiV1OrganisationByOrganisationIdPath-permissionsById"></a>

`DELETE /api/v1/organisation/{organisationId}/path-permissions/{id}`

<h3 id="delete-a-path-permission-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-path-permission-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-search">search</h1>

## Search for users by email address inside an organisation

<a id="opIdgetApiV1OrganisationByOrganisationIdSearchUser"></a>

`GET /api/v1/organisation/{organisationId}/search/user`

<h3 id="search-for-users-by-email-address-inside-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "firstname": {
      "type": "string"
    },
    "surname": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "email",
    "firstname",
    "surname"
  ]
}
```

<h3 id="search-for-users-by-email-address-inside-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="search-for-users-by-email-address-inside-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» email|string|true|none|none|
|» firstname|string|true|none|none|
|» surname|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-files">files</h1>

## Save files

<a id="opIdpostApiV1OrganisationByOrganisationIdFilesByTypeByBucket"></a>

`POST /api/v1/organisation/{organisationId}/files/{type}/{bucket}`

> Body parameter

```yaml
type: object
properties:
  file: {}
  chatId:
    type: string
  workspaceId:
    type: string
required:
  - file

```

<h3 id="save-files-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|type|path|any|true|none|
|bucket|path|string|true|none|
|body|body|object|false|none|
|» file|body|any|true|none|
|» chatId|body|string|false|none|
|» workspaceId|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string"
    },
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "organisationId": {
      "type": "string"
    }
  },
  "required": [
    "path",
    "id",
    "name",
    "organisationId"
  ]
}
```

<h3 id="save-files-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="save-files-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» path|string|true|none|none|
|» id|string|true|none|none|
|» name|string|true|none|none|
|» organisationId|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get a file

<a id="opIdgetApiV1OrganisationByOrganisationIdFilesByTypeByBucketByFilename"></a>

`GET /api/v1/organisation/{organisationId}/files/{type}/{bucket}/{filename}`

<h3 id="get-a-file-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|type|path|any|true|none|
|bucket|path|string|true|none|
|filename|path|string|true|none|

<h3 id="get-a-file-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get a file info

<a id="opIdgetApiV1OrganisationByOrganisationIdFilesByTypeByBucketByIdInfo"></a>

`GET /api/v1/organisation/{organisationId}/files/{type}/{bucket}/{id}/info`

<h3 id="get-a-file-info-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|type|path|any|true|none|
|bucket|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "bucket": {
      "type": "string",
      "maxLength": 255
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "fileType": {
      "type": "string",
      "maxLength": 255
    },
    "extension": {
      "type": "string",
      "maxLength": 255
    },
    "file": {},
    "expiresAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    }
  },
  "required": [
    "id",
    "createdAt",
    "updatedAt",
    "organisationId",
    "bucket",
    "name",
    "fileType",
    "extension",
    "file",
    "expiresAt",
    "chatId",
    "workspaceId"
  ]
}
```

<h3 id="get-a-file-info-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-a-file-info-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» bucket|string|true|none|none|
|» name|string|true|none|none|
|» fileType|string|true|none|none|
|» extension|string|true|none|none|
|» file|any|true|none|none|
|» expiresAt|string¦null|true|none|none|
|» chatId|string¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a file

<a id="opIddeleteApiV1OrganisationByOrganisationIdFilesByTypeByBucketById"></a>

`DELETE /api/v1/organisation/{organisationId}/files/{type}/{bucket}/{id}`

<h3 id="delete-a-file-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|type|path|any|true|none|
|bucket|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-file-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-secrets">secrets</h1>

## Get all secrets for an organisation

<a id="opIdgetApiV1OrganisationByOrganisationIdSecrets"></a>

`GET /api/v1/organisation/{organisationId}/secrets`

<h3 id="get-all-secrets-for-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "createdAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "name",
      "createdAt"
    ]
  }
}
```

<h3 id="get-all-secrets-for-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-secrets-for-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» name|string|true|none|none|
|» createdAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Add or update a backend secret

<a id="opIdpostApiV1OrganisationByOrganisationIdSecrets"></a>

`POST /api/v1/organisation/{organisationId}/secrets`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "value": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "value"
  ]
}
```

<h3 id="add-or-update-a-backend-secret-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» name|body|string|true|none|
|» value|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "createdAt"
  ]
}
```

<h3 id="add-or-update-a-backend-secret-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-or-update-a-backend-secret-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» name|string|true|none|none|
|» createdAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a secret

<a id="opIddeleteApiV1OrganisationByOrganisationIdSecretsByName"></a>

`DELETE /api/v1/organisation/{organisationId}/secrets/{name}`

<h3 id="delete-a-secret-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|name|path|string|true|none|

<h3 id="delete-a-secret-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-plugins">plugins</h1>

## Get all available plugins

<a id="opIdgetApiV1OrganisationByOrganisationIdPluginsAvailable"></a>

`GET /api/v1/organisation/{organisationId}/plugins/available`

<h3 id="get-all-available-plugins-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "version": {
        "type": "number"
      },
      "neededParameters": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "category": {
              "type": "string"
            },
            "type": {
              "anyOf": [
                {
                  "enum": [
                    null
                  ]
                },
                {
                  "enum": [
                    null
                  ]
                },
                {
                  "enum": [
                    null
                  ]
                },
                {
                  "enum": [
                    null
                  ]
                }
              ]
            },
            "name": {
              "type": "string"
            },
            "label": {
              "type": "string"
            },
            "description": {
              "type": "string"
            }
          },
          "required": [
            "category",
            "type",
            "name",
            "label",
            "description"
          ]
        }
      },
      "uiActions": {
        "type": "object",
        "properties": {
          "configUi": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                },
                "urlPath": {
                  "type": "string"
                }
              },
              "required": [
                "name",
                "label",
                "urlPath"
              ]
            }
          }
        },
        "required": []
      }
    },
    "required": [
      "name",
      "label",
      "description",
      "version",
      "neededParameters"
    ]
  }
}
```

<h3 id="get-all-available-plugins-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-available-plugins-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» version|number|true|none|none|
|» neededParameters|[object]|true|none|none|
|»» category|string|true|none|none|
|»» type|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» name|string|true|none|none|
|»» label|string|true|none|none|
|»» description|string|true|none|none|
|» uiActions|object|false|none|none|
|»» configUi|object|false|none|none|
|»»» **additionalProperties**|object|false|none|none|
|»»»» name|string|true|none|none|
|»»»» label|string|true|none|none|
|»»»» urlPath|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Get all installed plugins

<a id="opIdgetApiV1OrganisationByOrganisationIdPluginsInstalled"></a>

`GET /api/v1/organisation/{organisationId}/plugins/installed`

<h3 id="get-all-installed-plugins-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "name": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "pluginType": {
        "type": "string"
      },
      "version": {
        "type": "integer",
        "minimum": -2147483648,
        "maximum": 2147483647
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "organisationId",
      "name",
      "description",
      "pluginType",
      "version",
      "meta",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-installed-plugins-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-installed-plugins-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string|true|none|none|
|» pluginType|string|true|none|none|
|» version|integer|true|none|none|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Register a new plugin

<a id="opIdpostApiV1OrganisationByOrganisationIdPluginsInstalled"></a>

`POST /api/v1/organisation/{organisationId}/plugins/installed`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "pluginType": {
      "type": "string"
    },
    "version": {
      "type": "integer",
      "minimum": -2147483648,
      "maximum": 2147483647
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "organisationId",
    "name",
    "description",
    "pluginType",
    "version",
    "meta"
  ]
}
```

<h3 id="register-a-new-plugin-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» organisationId|body|string(uuid)|true|none|
|» name|body|string|true|none|
|» description|body|string|true|none|
|» pluginType|body|string|true|none|
|» version|body|integer|true|none|
|» meta|body|any|true|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "pluginType": {
      "type": "string"
    },
    "version": {
      "type": "integer",
      "minimum": -2147483648,
      "maximum": 2147483647
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "name",
    "description",
    "pluginType",
    "version",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="register-a-new-plugin-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="register-a-new-plugin-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string|true|none|none|
|» pluginType|string|true|none|none|
|» version|integer|true|none|none|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get plugin configuration

<a id="opIdgetApiV1OrganisationByOrganisationIdPluginsInstalledByIdOrName"></a>

`GET /api/v1/organisation/{organisationId}/plugins/installed/{idOrName}`

<h3 id="get-plugin-configuration-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|idOrName|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "pluginType": {
      "type": "string"
    },
    "version": {
      "type": "integer",
      "minimum": -2147483648,
      "maximum": 2147483647
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "name",
    "description",
    "pluginType",
    "version",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-plugin-configuration-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-plugin-configuration-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string|true|none|none|
|» pluginType|string|true|none|none|
|» version|integer|true|none|none|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update plugin configuration

<a id="opIdputApiV1OrganisationByOrganisationIdPluginsInstalledByIdOrName"></a>

`PUT /api/v1/organisation/{organisationId}/plugins/installed/{idOrName}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "pluginType": {
      "type": "string"
    },
    "version": {
      "type": "integer",
      "minimum": -2147483648,
      "maximum": 2147483647
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-plugin-configuration-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|idOrName|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» organisationId|body|string(uuid)|false|none|
|» name|body|string|false|none|
|» description|body|string|false|none|
|» pluginType|body|string|false|none|
|» version|body|integer|false|none|
|» meta|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "pluginType": {
      "type": "string"
    },
    "version": {
      "type": "integer",
      "minimum": -2147483648,
      "maximum": 2147483647
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "name",
    "description",
    "pluginType",
    "version",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-plugin-configuration-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-plugin-configuration-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» description|string|true|none|none|
|» pluginType|string|true|none|none|
|» version|integer|true|none|none|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a plugin configuration

<a id="opIddeleteApiV1OrganisationByOrganisationIdPluginsInstalledByIdOrName"></a>

`DELETE /api/v1/organisation/{organisationId}/plugins/installed/{idOrName}`

<h3 id="delete-a-plugin-configuration-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|idOrName|path|string|true|none|

<h3 id="delete-a-plugin-configuration-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-plugins-gateway">plugins-gateway</h1>

## API Gateway for the plugin endpoints: GET

<a id="opIdgetApiV1OrganisationByOrganisationIdPluginsGwByPluginNameByEndpoint"></a>

`GET /api/v1/organisation/{organisationId}/plugins/gw/{pluginName}/{endpoint}`

<h3 id="api-gateway-for-the-plugin-endpoints:-get-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|pluginName|path|string|true|none|
|endpoint|path|string|true|none|

<h3 id="api-gateway-for-the-plugin-endpoints:-get-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response. Dynamic Body from Plugin|None|

<aside class="success">
This operation does not require authentication
</aside>

## API Gateway for the plugin endpoints: POST

<a id="opIdpostApiV1OrganisationByOrganisationIdPluginsGwByPluginNameByEndpoint"></a>

`POST /api/v1/organisation/{organisationId}/plugins/gw/{pluginName}/{endpoint}`

<h3 id="api-gateway-for-the-plugin-endpoints:-post-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|pluginName|path|string|true|none|
|endpoint|path|string|true|none|

<h3 id="api-gateway-for-the-plugin-endpoints:-post-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response. Dynamic Body from Plugin|None|

<aside class="success">
This operation does not require authentication
</aside>

## API Gateway for the plugin endpoints: DELETE

<a id="opIddeleteApiV1OrganisationByOrganisationIdPluginsGwByPluginNameByEndpoint"></a>

`DELETE /api/v1/organisation/{organisationId}/plugins/gw/{pluginName}/{endpoint}`

<h3 id="api-gateway-for-the-plugin-endpoints:-delete-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|pluginName|path|string|true|none|
|endpoint|path|string|true|none|

<h3 id="api-gateway-for-the-plugin-endpoints:-delete-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response. Dynamic Body from Plugin|None|

<aside class="success">
This operation does not require authentication
</aside>

## API Gateway for the plugin endpoints: PUT

<a id="opIdputApiV1OrganisationByOrganisationIdPluginsGwByPluginNameByEndpoint"></a>

`PUT /api/v1/organisation/{organisationId}/plugins/gw/{pluginName}/{endpoint}`

<h3 id="api-gateway-for-the-plugin-endpoints:-put-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|pluginName|path|string|true|none|
|endpoint|path|string|true|none|

<h3 id="api-gateway-for-the-plugin-endpoints:-put-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response. Dynamic Body from Plugin|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-webhooks">webhooks</h1>

## Create a new webhook

<a id="opIdpostApiV1OrganisationByOrganisationIdWebhooks"></a>

`POST /api/v1/organisation/{organisationId}/webhooks`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "enum": [
        "n8n"
      ]
    },
    "event": {
      "enum": [
        "chat-output"
      ]
    },
    "webhookUrl": {
      "type": "string"
    },
    "method": {
      "enum": [
        "POST",
        "GET"
      ]
    },
    "headers": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "lastUsedAt": {
      "type": "string"
    }
  },
  "required": [
    "userId",
    "organisationId",
    "name",
    "type",
    "event",
    "webhookUrl"
  ]
}
```

<h3 id="create-a-new-webhook-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» userId|body|string(uuid)|true|none|
|» organisationId|body|string(uuid)|true|none|
|» organisationWide|body|boolean|false|none|
|» name|body|string|true|none|
|» type|body|string|true|none|
|» event|body|string|true|none|
|» webhookUrl|body|string|true|none|
|» method|body|any|false|none|
|» headers|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» meta|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» lastUsedAt|body|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» type|n8n|
|» event|chat-output|
|» method|POST|
|» method|GET|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "enum": [
        "n8n"
      ]
    },
    "event": {
      "enum": [
        "chat-output"
      ]
    },
    "webhookUrl": {
      "type": "string"
    },
    "method": {
      "enum": [
        "POST",
        "GET"
      ]
    },
    "headers": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "lastUsedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "userId",
    "organisationId",
    "organisationWide",
    "name",
    "type",
    "event",
    "webhookUrl",
    "method",
    "headers",
    "meta",
    "createdAt",
    "updatedAt",
    "lastUsedAt"
  ]
}
```

<h3 id="create-a-new-webhook-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-webhook-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» name|string|true|none|none|
|» type|string|true|none|none|
|» event|string|true|none|none|
|» webhookUrl|string|true|none|none|
|» method|any|true|none|none|
|» headers|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|n8n|
|event|chat-output|
|method|POST|
|method|GET|

<aside class="success">
This operation does not require authentication
</aside>

## Get all webhooks for the user

<a id="opIdgetApiV1OrganisationByOrganisationIdWebhooks"></a>

`GET /api/v1/organisation/{organisationId}/webhooks`

<h3 id="get-all-webhooks-for-the-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "type": "string",
        "format": "uuid"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "organisationWide": {
        "type": "boolean"
      },
      "name": {
        "type": "string"
      },
      "type": {
        "enum": [
          "n8n"
        ]
      },
      "event": {
        "enum": [
          "chat-output"
        ]
      },
      "webhookUrl": {
        "type": "string"
      },
      "method": {
        "enum": [
          "POST",
          "GET"
        ]
      },
      "headers": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      },
      "lastUsedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "userId",
      "organisationId",
      "organisationWide",
      "name",
      "type",
      "event",
      "webhookUrl",
      "method",
      "headers",
      "meta",
      "createdAt",
      "updatedAt",
      "lastUsedAt"
    ]
  }
}
```

<h3 id="get-all-webhooks-for-the-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-webhooks-for-the-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» name|string|true|none|none|
|» type|string|true|none|none|
|» event|string|true|none|none|
|» webhookUrl|string|true|none|none|
|» method|any|true|none|none|
|» headers|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|n8n|
|event|chat-output|
|method|POST|
|method|GET|

<aside class="success">
This operation does not require authentication
</aside>

## Get all organisation webhooks

<a id="opIdgetApiV1OrganisationByOrganisationIdWebhooksGlobal"></a>

`GET /api/v1/organisation/{organisationId}/webhooks/global`

<h3 id="get-all-organisation-webhooks-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "type": "string",
        "format": "uuid"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "organisationWide": {
        "type": "boolean"
      },
      "name": {
        "type": "string"
      },
      "type": {
        "enum": [
          "n8n"
        ]
      },
      "event": {
        "enum": [
          "chat-output"
        ]
      },
      "webhookUrl": {
        "type": "string"
      },
      "method": {
        "enum": [
          "POST",
          "GET"
        ]
      },
      "headers": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      },
      "lastUsedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "userId",
      "organisationId",
      "organisationWide",
      "name",
      "type",
      "event",
      "webhookUrl",
      "method",
      "headers",
      "meta",
      "createdAt",
      "updatedAt",
      "lastUsedAt"
    ]
  }
}
```

<h3 id="get-all-organisation-webhooks-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-organisation-webhooks-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» name|string|true|none|none|
|» type|string|true|none|none|
|» event|string|true|none|none|
|» webhookUrl|string|true|none|none|
|» method|any|true|none|none|
|» headers|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|n8n|
|event|chat-output|
|method|POST|
|method|GET|

<aside class="success">
This operation does not require authentication
</aside>

## Get a specific webhook by ID

<a id="opIdgetApiV1OrganisationByOrganisationIdWebhooksById"></a>

`GET /api/v1/organisation/{organisationId}/webhooks/{id}`

<h3 id="get-a-specific-webhook-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "enum": [
        "n8n"
      ]
    },
    "event": {
      "enum": [
        "chat-output"
      ]
    },
    "webhookUrl": {
      "type": "string"
    },
    "method": {
      "enum": [
        "POST",
        "GET"
      ]
    },
    "headers": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "lastUsedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "userId",
    "organisationId",
    "organisationWide",
    "name",
    "type",
    "event",
    "webhookUrl",
    "method",
    "headers",
    "meta",
    "createdAt",
    "updatedAt",
    "lastUsedAt"
  ]
}
```

<h3 id="get-a-specific-webhook-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-a-specific-webhook-by-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» name|string|true|none|none|
|» type|string|true|none|none|
|» event|string|true|none|none|
|» webhookUrl|string|true|none|none|
|» method|any|true|none|none|
|» headers|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|n8n|
|event|chat-output|
|method|POST|
|method|GET|

<aside class="success">
This operation does not require authentication
</aside>

## Update a webhook

<a id="opIdputApiV1OrganisationByOrganisationIdWebhooksById"></a>

`PUT /api/v1/organisation/{organisationId}/webhooks/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "enum": [
        "n8n"
      ]
    },
    "event": {
      "enum": [
        "chat-output"
      ]
    },
    "webhookUrl": {
      "type": "string"
    },
    "method": {
      "enum": [
        "POST",
        "GET"
      ]
    },
    "headers": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "lastUsedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-a-webhook-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» userId|body|string(uuid)|false|none|
|» organisationId|body|string(uuid)|false|none|
|» organisationWide|body|boolean|false|none|
|» name|body|string|false|none|
|» type|body|string|false|none|
|» event|body|string|false|none|
|» webhookUrl|body|string|false|none|
|» method|body|any|false|none|
|» headers|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» meta|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|
|» lastUsedAt|body|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» type|n8n|
|» event|chat-output|
|» method|POST|
|» method|GET|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "enum": [
        "n8n"
      ]
    },
    "event": {
      "enum": [
        "chat-output"
      ]
    },
    "webhookUrl": {
      "type": "string"
    },
    "method": {
      "enum": [
        "POST",
        "GET"
      ]
    },
    "headers": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "lastUsedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "userId",
    "organisationId",
    "organisationWide",
    "name",
    "type",
    "event",
    "webhookUrl",
    "method",
    "headers",
    "meta",
    "createdAt",
    "updatedAt",
    "lastUsedAt"
  ]
}
```

<h3 id="update-a-webhook-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-webhook-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» name|string|true|none|none|
|» type|string|true|none|none|
|» event|string|true|none|none|
|» webhookUrl|string|true|none|none|
|» method|any|true|none|none|
|» headers|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» meta|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|n8n|
|event|chat-output|
|method|POST|
|method|GET|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a webhook

<a id="opIddeleteApiV1OrganisationByOrganisationIdWebhooksById"></a>

`DELETE /api/v1/organisation/{organisationId}/webhooks/{id}`

<h3 id="delete-a-webhook-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|organisationId|path|string|true|none|

<h3 id="delete-a-webhook-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Register a webhook for n8n

<a id="opIdpostApiV1OrganisationByOrganisationIdWebhooksRegisterN8n"></a>

`POST /api/v1/organisation/{organisationId}/webhooks/register/n8n`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "webhookUrl": {
      "type": "string"
    },
    "event": {
      "type": "string"
    },
    "organisationId": {
      "type": "string"
    },
    "organisationWide": {
      "type": "boolean"
    }
  },
  "required": [
    "name",
    "webhookUrl",
    "event",
    "organisationId"
  ]
}
```

<h3 id="register-a-webhook-for-n8n-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» name|body|string|true|none|
|» webhookUrl|body|string|true|none|
|» event|body|string|true|none|
|» organisationId|body|string|true|none|
|» organisationWide|body|boolean|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "success": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "success"
  ]
}
```

<h3 id="register-a-webhook-for-n8n-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="register-a-webhook-for-n8n-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» success|boolean|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Check if a webhook exists

<a id="opIdpostApiV1OrganisationByOrganisationIdWebhooksCheck"></a>

`POST /api/v1/organisation/{organisationId}/webhooks/check`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "webhookId": {
      "type": "string"
    }
  },
  "required": [
    "webhookId"
  ]
}
```

<h3 id="check-if-a-webhook-exists-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» webhookId|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "exists": {
      "type": "boolean"
    }
  },
  "required": [
    "exists"
  ]
}
```

<h3 id="check-if-a-webhook-exists-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="check-if-a-webhook-exists-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» exists|boolean|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Trigger a webhook

<a id="opIdpostApiV1OrganisationByOrganisationIdWebhooksByIdTrigger"></a>

`POST /api/v1/organisation/{organisationId}/webhooks/{id}/trigger`

> Body parameter

```json
{}
```

<h3 id="trigger-a-webhook-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|organisationId|path|string|true|none|
|body|body|any|false|none|

<h3 id="trigger-a-webhook-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-ai">ai</h1>

## Get fine-tuning data entries

<a id="opIdgetApiV1OrganisationByOrganisationIdAiFine-tuningById"></a>

`GET /api/v1/organisation/{organisationId}/ai/fine-tuning/{id}`

<h3 id="get-fine-tuning-data-entries-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "knowledgeEntryId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "category": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "question": {
      "type": "string"
    },
    "answer": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "knowledgeEntryId",
    "name",
    "category",
    "question",
    "answer"
  ]
}
```

<h3 id="get-fine-tuning-data-entries-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-fine-tuning-data-entries-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» knowledgeEntryId|string(uuid)|true|none|none|
|» name|string¦null|true|none|none|
|» category|string¦null|true|none|none|
|» question|string|true|none|none|
|» answer|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Add new fine-tuning data

<a id="opIdpostApiV1OrganisationByOrganisationIdAiFine-tuning"></a>

`POST /api/v1/organisation/{organisationId}/ai/fine-tuning`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "category": {
      "type": "string"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string"
          },
          "answer": {
            "type": "string"
          }
        },
        "required": [
          "question",
          "answer"
        ]
      }
    }
  },
  "required": [
    "organisationId",
    "data"
  ]
}
```

<h3 id="add-new-fine-tuning-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» organisationId|body|string|true|none|
|» name|body|string|false|none|
|» category|body|string|false|none|
|» data|body|[object]|true|none|
|»» question|body|string|true|none|
|»» answer|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "finetuning",
        "plugin",
        "external"
      ]
    },
    "sourceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceExternalId": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceFileBucket": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceUrl": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000,
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "abstract": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "sourceType",
    "sourceId",
    "sourceExternalId",
    "sourceFileBucket",
    "sourceUrl",
    "name",
    "description",
    "abstract",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="add-new-fine-tuning-data-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-new-fine-tuning-data-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Update fine-tuning data

<a id="opIdputApiV1OrganisationByOrganisationIdAiFine-tuningById"></a>

`PUT /api/v1/organisation/{organisationId}/ai/fine-tuning/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "category": {
      "type": "string"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string"
          },
          "answer": {
            "type": "string"
          }
        },
        "required": [
          "question",
          "answer"
        ]
      }
    }
  },
  "required": [
    "organisationId",
    "data"
  ]
}
```

<h3 id="update-fine-tuning-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|
|body|body|object|false|none|
|» organisationId|body|string|true|none|
|» name|body|string|false|none|
|» category|body|string|false|none|
|» data|body|[object]|true|none|
|»» question|body|string|true|none|
|»» answer|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "workspaceId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "knowledgeEntryId": {
        "type": "string",
        "format": "uuid"
      },
      "name": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 255,
            "nullable": true
          }
        ]
      },
      "category": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 255,
            "nullable": true
          }
        ]
      },
      "question": {
        "type": "string"
      },
      "answer": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "organisationId",
      "teamId",
      "userId",
      "workspaceId",
      "knowledgeEntryId",
      "name",
      "category",
      "question",
      "answer"
    ]
  }
}
```

<h3 id="update-fine-tuning-data-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-fine-tuning-data-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» knowledgeEntryId|string(uuid)|true|none|none|
|» name|string¦null|true|none|none|
|» category|string¦null|true|none|none|
|» question|string|true|none|none|
|» answer|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete fine-tuning data

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiFine-tuningById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/fine-tuning/{id}`

<h3 id="delete-fine-tuning-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-fine-tuning-data-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get all available models

<a id="opIdgetApiV1OrganisationByOrganisationIdAiModels"></a>

`GET /api/v1/organisation/{organisationId}/ai/models`

<h3 id="get-all-available-models-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "chat": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "provider": {
            "anyOf": [
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              }
            ]
          },
          "model": {
            "type": "string"
          }
        },
        "required": [
          "provider",
          "model"
        ]
      }
    },
    "multiModal": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "provider": {
            "anyOf": [
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              }
            ]
          },
          "model": {
            "type": "string"
          }
        },
        "required": [
          "provider",
          "model"
        ]
      }
    },
    "tts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "provider": {
            "anyOf": [
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              }
            ]
          },
          "model": {
            "type": "string"
          }
        },
        "required": [
          "provider",
          "model"
        ]
      }
    },
    "stt": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "provider": {
            "anyOf": [
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              }
            ]
          },
          "model": {
            "type": "string"
          }
        },
        "required": [
          "provider",
          "model"
        ]
      }
    },
    "imageGeneration": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "provider": {
            "anyOf": [
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              },
              {
                "enum": [
                  null
                ]
              }
            ]
          },
          "model": {
            "type": "string"
          }
        },
        "required": [
          "provider",
          "model"
        ]
      }
    }
  },
  "required": [
    "chat",
    "multiModal",
    "tts",
    "stt",
    "imageGeneration"
  ]
}
```

<h3 id="get-all-available-models-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-available-models-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chat|[object]|true|none|none|
|»» provider|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» model|string|true|none|none|
|» multiModal|[object]|true|none|none|
|»» provider|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» model|string|true|none|none|
|» tts|[object]|true|none|none|
|»» provider|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» model|string|true|none|none|
|» stt|[object]|true|none|none|
|»» provider|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» model|string|true|none|none|
|» imageGeneration|[object]|true|none|none|
|»» provider|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» model|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Chat with a Prompt Template

<a id="opIdpostApiV1OrganisationByOrganisationIdAiChat-with-template"></a>

`POST /api/v1/organisation/{organisationId}/ai/chat`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    },
    "chatSessionGroupId": {
      "type": "string"
    },
    "initiateTemplate": {
      "type": "object",
      "properties": {
        "promptId": {
          "type": "string"
        },
        "promptName": {
          "type": "string"
        },
        "promptCategory": {
          "type": "string"
        },
        "organisationId": {
          "type": "string"
        }
      },
      "required": []
    },
    "trigger": {
      "type": "object",
      "properties": {
        "next": {
          "type": "boolean"
        },
        "skip": {
          "type": "boolean"
        }
      },
      "required": [
        "next",
        "skip"
      ]
    },
    "variables": {
      "type": "object",
      "additionalProperties": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "number"
          },
          {
            "type": "boolean"
          }
        ]
      }
    },
    "llmOptions": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string"
        },
        "maxTokens": {
          "type": "number"
        },
        "temperature": {
          "type": "number"
        }
      },
      "required": []
    }
  },
  "required": []
}
```

<h3 id="chat-with-a-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» chatId|body|string|false|none|
|» chatSessionGroupId|body|string|false|none|
|» initiateTemplate|body|object|false|none|
|»» promptId|body|string|false|none|
|»» promptName|body|string|false|none|
|»» promptCategory|body|string|false|none|
|»» organisationId|body|string|false|none|
|» trigger|body|object|false|none|
|»» next|body|boolean|true|none|
|»» skip|body|boolean|true|none|
|» variables|body|object|false|none|
|»» **additionalProperties**|body|any|false|none|
|»»» *anonymous*|body|string|false|none|
|»»» *anonymous*|body|number|false|none|
|»»» *anonymous*|body|boolean|false|none|
|» llmOptions|body|object|false|none|
|»» model|body|string|false|none|
|»» maxTokens|body|number|false|none|
|»» temperature|body|number|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    },
    "message": {
      "type": "object",
      "properties": {
        "role": {
          "anyOf": [
            {
              "enum": [
                null
              ]
            },
            {
              "enum": [
                null
              ]
            }
          ]
        },
        "content": {
          "type": "string"
        }
      },
      "required": [
        "role",
        "content"
      ]
    },
    "meta": {},
    "finished": {
      "type": "boolean"
    },
    "render": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "type": {
              "enum": [
                null
              ]
            }
          },
          "required": [
            "type"
          ]
        },
        {
          "type": "object",
          "properties": {
            "type": {
              "enum": [
                null
              ]
            },
            "url": {
              "type": "string"
            }
          },
          "required": [
            "type",
            "url"
          ]
        },
        {
          "type": "object",
          "properties": {
            "type": {
              "enum": [
                null
              ]
            },
            "severity": {
              "anyOf": [
                {
                  "enum": [
                    null
                  ]
                },
                {
                  "enum": [
                    null
                  ]
                },
                {
                  "enum": [
                    null
                  ]
                }
              ]
            }
          },
          "required": [
            "type",
            "severity"
          ]
        },
        {
          "type": "object",
          "properties": {
            "type": {
              "enum": [
                null
              ]
            }
          },
          "required": [
            "type"
          ]
        },
        {
          "type": "object",
          "properties": {
            "type": {
              "enum": [
                null
              ]
            },
            "definition": {
              "type": "array",
              "items": {}
            },
            "data": {
              "type": "object",
              "additionalProperties": {}
            }
          },
          "required": [
            "type",
            "definition",
            "data"
          ]
        }
      ]
    }
  },
  "required": [
    "chatId",
    "message",
    "meta"
  ]
}
```

<h3 id="chat-with-a-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="chat-with-a-prompt-template-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatId|string|true|none|none|
|» message|object|true|none|none|
|»» role|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» content|string|true|none|none|
|» meta|any|true|none|none|
|» finished|boolean|false|none|none|
|» render|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|object|true|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|object|true|none|none|
|»»» url|string|true|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|object|true|none|none|
|»»» severity|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|object|true|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|object|true|none|none|
|»»» definition|[any]|true|none|none|
|»»» data|object|true|none|none|
|»»»» **additionalProperties**|any|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|
|type|null|
|type|null|
|type|null|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|
|type|null|
|type|null|

<aside class="success">
This operation does not require authentication
</aside>

## Chat History for the current user

<a id="opIdgetApiV1OrganisationByOrganisationIdAiChatHistory"></a>

`GET /api/v1/organisation/{organisationId}/ai/chat/history`

<h3 id="chat-history-for-the-current-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|startFrom|param|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "messages": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "state": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "chatSessionGroupId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "deleteAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "lastUsedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "userId",
    "organisationId",
    "messages",
    "state",
    "chatSessionGroupId",
    "deleteAt",
    "createdAt",
    "updatedAt",
    "lastUsedAt"
  ]
}
```

<h3 id="chat-history-for-the-current-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="chat-history-for-the-current-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» name|string|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|
|» messages|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» state|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatSessionGroupId|string(uuid)¦null|true|none|none|
|» deleteAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Chat History for one chat session

<a id="opIdgetApiV1OrganisationByOrganisationIdAiChatHistoryById"></a>

`GET /api/v1/organisation/{organisationId}/ai/chat/history/{id}`

<h3 id="chat-history-for-one-chat-session-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "history": {},
    "chatSessionGroupId": {
      "type": "string"
    },
    "parentWorkspaceId": {
      "type": "string"
    }
  },
  "required": [
    "chatId",
    "name",
    "history"
  ]
}
```

<h3 id="chat-history-for-one-chat-session-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="chat-history-for-one-chat-session-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatId|string|true|none|none|
|» name|string|true|none|none|
|» history|any|true|none|none|
|» chatSessionGroupId|string|false|none|none|
|» parentWorkspaceId|string|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Drop a chat session by ID

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiChatHistoryById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/chat/history/{id}`

<h3 id="drop-a-chat-session-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="drop-a-chat-session-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Create an empty chat session

<a id="opIdpostApiV1OrganisationByOrganisationIdAiChatEnsure-session"></a>

`POST /api/v1/organisation/{organisationId}/ai/chat/ensure-session`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    },
    "chatSessionGroupId": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="create-an-empty-chat-session-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» chatId|body|string|false|none|
|» chatSessionGroupId|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    }
  },
  "required": [
    "chatId"
  ]
}
```

<h3 id="create-an-empty-chat-session-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-an-empty-chat-session-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatId|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Start a new interview session

<a id="opIdpostApiV1OrganisationByOrganisationIdAiInterviewStart"></a>

`POST /api/v1/organisation/{organisationId}/ai/interview/start`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "interviewName": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "guidelines": {
      "type": "string"
    }
  },
  "required": [
    "interviewName",
    "description",
    "guidelines"
  ]
}
```

<h3 id="start-a-new-interview-session-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» interviewName|body|string|true|none|
|» description|body|string|true|none|
|» guidelines|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "interview": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "guidelines": {
          "type": "string"
        }
      },
      "required": [
        "name",
        "description",
        "guidelines"
      ]
    }
  },
  "required": [
    "chatId",
    "name",
    "interview"
  ]
}
```

<h3 id="start-a-new-interview-session-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="start-a-new-interview-session-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatId|string|true|none|none|
|» name|string|true|none|none|
|» interview|object|true|none|none|
|»» name|string|true|none|none|
|»» description|string|true|none|none|
|»» guidelines|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Submit response to interview question

<a id="opIdpostApiV1OrganisationByOrganisationIdAiInterviewByChatIdRespond"></a>

`POST /api/v1/organisation/{organisationId}/ai/interview/{chatId}/respond`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    },
    "organisationId": {
      "type": "string"
    },
    "chatId": {
      "type": "string"
    },
    "user_input": {
      "type": "string"
    },
    "llmOptions": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string"
        },
        "maxTokens": {
          "type": "number"
        },
        "temperature": {
          "type": "number"
        }
      },
      "required": []
    }
  },
  "required": [
    "userId",
    "organisationId",
    "chatId",
    "user_input"
  ]
}
```

<h3 id="submit-response-to-interview-question-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|chatId|path|string|true|none|
|body|body|object|false|none|
|» userId|body|string|true|none|
|» organisationId|body|string|true|none|
|» chatId|body|string|true|none|
|» user_input|body|string|true|none|
|» llmOptions|body|object|false|none|
|»» model|body|string|false|none|
|»» maxTokens|body|number|false|none|
|»» temperature|body|number|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string"
    },
    "interview": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "guidelines": {
          "type": "string"
        },
        "moderator": {
          "type": "string"
        },
        "interviewer": {
          "type": "string"
        },
        "goals": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "summary": {
          "type": "string"
        }
      },
      "required": [
        "name",
        "description",
        "guidelines",
        "moderator",
        "interviewer"
      ]
    },
    "lastMessage": {
      "type": "object",
      "properties": {
        "role": {
          "anyOf": [
            {
              "enum": [
                null
              ]
            },
            {
              "enum": [
                null
              ]
            },
            {
              "enum": [
                null
              ]
            }
          ]
        },
        "content": {},
        "meta": {
          "type": "object",
          "properties": {
            "model": {
              "type": "string"
            },
            "human": {
              "type": "boolean"
            },
            "timestamp": {
              "type": "string"
            }
          },
          "required": []
        }
      },
      "required": [
        "role"
      ]
    }
  },
  "required": [
    "chatId",
    "interview",
    "lastMessage"
  ]
}
```

<h3 id="submit-response-to-interview-question-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="submit-response-to-interview-question-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatId|string|true|none|none|
|» interview|object|true|none|none|
|»» name|string|true|none|none|
|»» description|string|true|none|none|
|»» guidelines|string|true|none|none|
|»» moderator|string|true|none|none|
|»» interviewer|string|true|none|none|
|»» goals|[string]|false|none|none|
|»» summary|string|false|none|none|
|» lastMessage|object|true|none|none|
|»» role|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|object|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» content|any|false|none|none|
|»» meta|object|false|none|none|
|»»» model|string|false|none|none|
|»»» human|boolean|false|none|none|
|»»» timestamp|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|null|
|*anonymous*|null|
|*anonymous*|null|

<aside class="success">
This operation does not require authentication
</aside>

## Update a chat message in a session

<a id="opIdputApiV1OrganisationByOrganisationIdAiChatByChatIdMessageByMessageId"></a>

`PUT /api/v1/organisation/{organisationId}/ai/chat/{chatId}/message/{messageId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-a-chat-message-in-a-session-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|chatId|path|string|true|none|
|messageId|path|string|true|none|
|body|body|object|false|none|
|» content|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    }
  },
  "required": [
    "success"
  ]
}
```

<h3 id="update-a-chat-message-in-a-session-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-chat-message-in-a-session-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get prompt templates

<a id="opIdgetApiV1OrganisationByOrganisationIdAiTemplates"></a>

`GET /api/v1/organisation/{organisationId}/ai/templates`

<h3 id="get-prompt-templates-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "label": {
        "type": "string",
        "maxLength": 255
      },
      "description": {
        "type": "string",
        "maxLength": 1000
      },
      "category": {
        "type": "string",
        "maxLength": 255
      },
      "systemPrompt": {
        "type": "string"
      },
      "userPrompt": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "langCode": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 2,
            "nullable": true
          }
        ]
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "hidden": {
        "type": "boolean"
      },
      "needsInitialCall": {
        "type": "boolean"
      },
      "llmOptions": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "name",
      "label",
      "description",
      "category",
      "systemPrompt",
      "userPrompt",
      "langCode",
      "userId",
      "organisationId",
      "hidden",
      "needsInitialCall",
      "llmOptions",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-prompt-templates-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-prompt-templates-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» category|string|true|none|none|
|» systemPrompt|string|true|none|none|
|» userPrompt|string¦null|true|none|none|
|» langCode|string¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» hidden|boolean|true|none|none|
|» needsInitialCall|boolean|true|none|none|
|» llmOptions|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create new prompt template

<a id="opIdpostApiV1OrganisationByOrganisationIdAiTemplates"></a>

`POST /api/v1/organisation/{organisationId}/ai/templates`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "systemPrompt": {
      "type": "string"
    },
    "userPrompt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "langCode": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 2,
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "hidden": {
      "type": "boolean"
    },
    "needsInitialCall": {
      "type": "boolean"
    },
    "llmOptions": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "systemPrompt",
    "organisationId"
  ]
}
```

<h3 id="create-new-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» label|body|string|false|none|
|» description|body|string|false|none|
|» category|body|string|false|none|
|» systemPrompt|body|string|true|none|
|» userPrompt|body|string¦null|false|none|
|» langCode|body|string¦null|false|none|
|» userId|body|string(uuid)¦null|false|none|
|» organisationId|body|string(uuid)|true|none|
|» hidden|body|boolean|false|none|
|» needsInitialCall|body|boolean|false|none|
|» llmOptions|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "systemPrompt": {
      "type": "string"
    },
    "userPrompt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "langCode": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 2,
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "hidden": {
      "type": "boolean"
    },
    "needsInitialCall": {
      "type": "boolean"
    },
    "llmOptions": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "label",
    "description",
    "category",
    "systemPrompt",
    "userPrompt",
    "langCode",
    "userId",
    "organisationId",
    "hidden",
    "needsInitialCall",
    "llmOptions",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="create-new-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-new-prompt-template-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» category|string|true|none|none|
|» systemPrompt|string|true|none|none|
|» userPrompt|string¦null|true|none|none|
|» langCode|string¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» hidden|boolean|true|none|none|
|» needsInitialCall|boolean|true|none|none|
|» llmOptions|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update prompt template

<a id="opIdputApiV1OrganisationByOrganisationIdAiTemplatesById"></a>

`PUT /api/v1/organisation/{organisationId}/ai/templates/{id}`

> Body parameter

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "name": {
          "type": "string",
          "maxLength": 255
        },
        "label": {
          "type": "string",
          "maxLength": 255
        },
        "description": {
          "type": "string",
          "maxLength": 1000
        },
        "category": {
          "type": "string",
          "maxLength": 255
        },
        "systemPrompt": {
          "type": "string"
        },
        "userPrompt": {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            }
          ]
        },
        "langCode": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 2,
              "nullable": true
            }
          ]
        },
        "userId": {
          "anyOf": [
            {
              "type": "string",
              "format": "uuid",
              "nullable": true
            }
          ]
        },
        "organisationId": {
          "type": "string",
          "format": "uuid"
        },
        "hidden": {
          "type": "boolean"
        },
        "needsInitialCall": {
          "type": "boolean"
        },
        "llmOptions": {
          "anyOf": [
            {
              "anyOf": [
                {
                  "anyOf": [
                    {
                      "type": "string",
                      "nullable": true
                    },
                    {
                      "type": "number",
                      "nullable": true
                    },
                    {
                      "type": "boolean",
                      "nullable": true
                    }
                  ]
                },
                {
                  "type": "array",
                  "items": {}
                },
                {
                  "type": "object",
                  "additionalProperties": {}
                }
              ],
              "nullable": true
            }
          ]
        },
        "createdAt": {
          "type": "string"
        },
        "updatedAt": {
          "type": "string"
        }
      },
      "required": [
        "name",
        "systemPrompt",
        "organisationId"
      ]
    },
    {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ]
    }
  ]
}
```

<h3 id="update-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|
|body|body|any|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "systemPrompt": {
      "type": "string"
    },
    "userPrompt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "langCode": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 2,
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "hidden": {
      "type": "boolean"
    },
    "needsInitialCall": {
      "type": "boolean"
    },
    "llmOptions": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "label",
    "description",
    "category",
    "systemPrompt",
    "userPrompt",
    "langCode",
    "userId",
    "organisationId",
    "hidden",
    "needsInitialCall",
    "llmOptions",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-prompt-template-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» category|string|true|none|none|
|» systemPrompt|string|true|none|none|
|» userPrompt|string¦null|true|none|none|
|» langCode|string¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» hidden|boolean|true|none|none|
|» needsInitialCall|boolean|true|none|none|
|» llmOptions|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete prompt template

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiTemplatesById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/templates/{id}`

<h3 id="delete-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get placeholders for prompt template

<a id="opIdgetApiV1OrganisationByOrganisationIdAiTemplatesByPromptTemplateIdPlaceholders"></a>

`GET /api/v1/organisation/{organisationId}/ai/templates/{promptTemplateId}/placeholders`

<h3 id="get-placeholders-for-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|promptTemplateId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "promptTemplateId",
    "name",
    "label",
    "description",
    "type",
    "requiredByUser",
    "defaultValue",
    "hidden"
  ]
}
```

<h3 id="get-placeholders-for-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-placeholders-for-prompt-template-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» promptTemplateId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» type|any|true|none|none|
|» requiredByUser|boolean|true|none|none|
|» defaultValue|string¦null|true|none|none|
|» hidden|boolean|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|text|
|type|image|

<aside class="success">
This operation does not require authentication
</aside>

## Add a new placeholder to a prompt template

<a id="opIdpostApiV1OrganisationByOrganisationIdAiTemplatesByPromptTemplateIdPlaceholders"></a>

`POST /api/v1/organisation/{organisationId}/ai/templates/{promptTemplateId}/placeholders`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "promptTemplateId",
    "name"
  ]
}
```

<h3 id="add-a-new-placeholder-to-a-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|promptTemplateId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» promptTemplateId|body|string(uuid)|true|none|
|» name|body|string|true|none|
|» label|body|string|false|none|
|» description|body|string|false|none|
|» type|body|any|false|none|
|» requiredByUser|body|boolean|false|none|
|» defaultValue|body|string¦null|false|none|
|» hidden|body|boolean|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» type|text|
|» type|image|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "promptTemplateId",
    "name",
    "label",
    "description",
    "type",
    "requiredByUser",
    "defaultValue",
    "hidden"
  ]
}
```

<h3 id="add-a-new-placeholder-to-a-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-a-new-placeholder-to-a-prompt-template-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» promptTemplateId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» type|any|true|none|none|
|» requiredByUser|boolean|true|none|none|
|» defaultValue|string¦null|true|none|none|
|» hidden|boolean|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|text|
|type|image|

<aside class="success">
This operation does not require authentication
</aside>

## Get placeholder for prompt template

<a id="opIdgetApiV1OrganisationByOrganisationIdAiTemplatesByPromptTemplateIdPlaceholdersById"></a>

`GET /api/v1/organisation/{organisationId}/ai/templates/{promptTemplateId}/placeholders/{id}`

<h3 id="get-placeholder-for-prompt-template-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|promptTemplateId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "promptTemplateId",
    "name",
    "label",
    "description",
    "type",
    "requiredByUser",
    "defaultValue",
    "hidden"
  ]
}
```

<h3 id="get-placeholder-for-prompt-template-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-placeholder-for-prompt-template-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» promptTemplateId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» type|any|true|none|none|
|» requiredByUser|boolean|true|none|none|
|» defaultValue|string¦null|true|none|none|
|» hidden|boolean|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|text|
|type|image|

<aside class="success">
This operation does not require authentication
</aside>

## Update a prompt-template placeholder by ID

<a id="opIdputApiV1OrganisationByOrganisationIdAiTemplatesByPromptTemplateIdPlaceholdersById"></a>

`PUT /api/v1/organisation/{organisationId}/ai/templates/{promptTemplateId}/placeholders/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "promptTemplateId",
    "name",
    "label",
    "description",
    "type",
    "requiredByUser",
    "defaultValue",
    "hidden"
  ]
}
```

<h3 id="update-a-prompt-template-placeholder-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|promptTemplateId|path|string|true|none|
|id|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|true|none|
|» promptTemplateId|body|string(uuid)|true|none|
|» name|body|string|true|none|
|» label|body|string|true|none|
|» description|body|string|true|none|
|» type|body|any|true|none|
|» requiredByUser|body|boolean|true|none|
|» defaultValue|body|string¦null|true|none|
|» hidden|body|boolean|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» type|text|
|» type|image|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "promptTemplateId",
    "name",
    "label",
    "description",
    "type",
    "requiredByUser",
    "defaultValue",
    "hidden"
  ]
}
```

<h3 id="update-a-prompt-template-placeholder-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-prompt-template-placeholder-by-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» promptTemplateId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» type|any|true|none|none|
|» requiredByUser|boolean|true|none|none|
|» defaultValue|string¦null|true|none|none|
|» hidden|boolean|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|text|
|type|image|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a placeholder for a prompt template by ID

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiTemplatesByPromptTemplateIdPlaceholdersById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/templates/{promptTemplateId}/placeholders/{id}`

<h3 id="delete-a-placeholder-for-a-prompt-template-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|promptTemplateId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-placeholder-for-a-prompt-template-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get an object with all placeholders for a prompt template with the default values

<a id="opIdgetApiV1OrganisationByOrganisationIdAiTemplatesPlaceholders"></a>

`GET /api/v1/organisation/{organisationId}/ai/templates/placeholders`

<h3 id="get-an-object-with-all-placeholders-for-a-prompt-template-with-the-default-values-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "promptTemplateId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "label": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "type": {
      "enum": [
        "text",
        "image"
      ]
    },
    "requiredByUser": {
      "type": "boolean"
    },
    "defaultValue": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "hidden": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "promptTemplateId",
    "name",
    "label",
    "description",
    "type",
    "requiredByUser",
    "defaultValue",
    "hidden"
  ]
}
```

<h3 id="get-an-object-with-all-placeholders-for-a-prompt-template-with-the-default-values-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-an-object-with-all-placeholders-for-a-prompt-template-with-the-default-values-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» promptTemplateId|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» label|string|true|none|none|
|» description|string|true|none|none|
|» type|any|true|none|none|
|» requiredByUser|boolean|true|none|none|
|» defaultValue|string¦null|true|none|none|
|» hidden|boolean|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|text|
|type|image|

<aside class="success">
This operation does not require authentication
</aside>

## Get prompt snippets

<a id="opIdgetApiV1OrganisationByOrganisationIdAiPrompt-snippets"></a>

`GET /api/v1/organisation/{organisationId}/ai/prompt-snippets`

<h3 id="get-prompt-snippets-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "content": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "content",
    "category",
    "userId",
    "organisationId",
    "organisationWide",
    "teamId",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-prompt-snippets-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-prompt-snippets-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» content|string|true|none|none|
|» category|string|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Add a new prompt snippet

<a id="opIdpostApiV1OrganisationByOrganisationIdAiPrompt-snippets"></a>

`POST /api/v1/organisation/{organisationId}/ai/prompt-snippets`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "content": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "content",
    "organisationId"
  ]
}
```

<h3 id="add-a-new-prompt-snippet-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» content|body|string|true|none|
|» category|body|string|false|none|
|» userId|body|string(uuid)¦null|false|none|
|» organisationId|body|string(uuid)|true|none|
|» organisationWide|body|boolean|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "content": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "content",
    "category",
    "userId",
    "organisationId",
    "organisationWide",
    "teamId",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="add-a-new-prompt-snippet-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-a-new-prompt-snippet-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» content|string|true|none|none|
|» category|string|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get prompt snippet by ID

<a id="opIdgetApiV1OrganisationByOrganisationIdAiPrompt-snippetsById"></a>

`GET /api/v1/organisation/{organisationId}/ai/prompt-snippets/{id}`

<h3 id="get-prompt-snippet-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "content": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "content",
    "category",
    "userId",
    "organisationId",
    "organisationWide",
    "teamId",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-prompt-snippet-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-prompt-snippet-by-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» content|string|true|none|none|
|» category|string|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a prompt snippet

<a id="opIdputApiV1OrganisationByOrganisationIdAiPrompt-snippetsById"></a>

`PUT /api/v1/organisation/{organisationId}/ai/prompt-snippets/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "content": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-a-prompt-snippet-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|false|none|
|» content|body|string|false|none|
|» category|body|string|false|none|
|» userId|body|string(uuid)¦null|false|none|
|» organisationId|body|string(uuid)|false|none|
|» organisationWide|body|boolean|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "content": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "maxLength": 255
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "content",
    "category",
    "userId",
    "organisationId",
    "organisationWide",
    "teamId",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-a-prompt-snippet-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-prompt-snippet-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» content|string|true|none|none|
|» category|string|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» organisationWide|boolean|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a prompt snippet

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiPrompt-snippetsById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/prompt-snippets/{id}`

<h3 id="delete-a-prompt-snippet-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-prompt-snippet-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-knowledge">knowledge</h1>

## Extract knowledge from a document

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeExtract-knowledge"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/extract-knowledge`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "external"
      ]
    },
    "sourceId": {
      "type": "string"
    },
    "sourceFileBucket": {
      "type": "string"
    },
    "sourceUrl": {
      "type": "string"
    },
    "filters": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "teamId": {
      "type": "string"
    },
    "userId": {
      "type": "string"
    },
    "workspaceId": {
      "type": "string"
    }
  },
  "required": [
    "organisationId",
    "sourceType"
  ]
}
```

<h3 id="extract-knowledge-from-a-document-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» organisationId|body|string|true|none|
|» sourceType|body|any|true|none|
|» sourceId|body|string|false|none|
|» sourceFileBucket|body|string|false|none|
|» sourceUrl|body|string|false|none|
|» filters|body|object|false|none|
|»» **additionalProperties**|body|string|false|none|
|» teamId|body|string|false|none|
|» userId|body|string|false|none|
|» workspaceId|body|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» sourceType|db|
|» sourceType|local|
|» sourceType|url|
|» sourceType|text|
|» sourceType|external|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "ok": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "ok"
  ]
}
```

<h3 id="extract-knowledge-from-a-document-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="extract-knowledge-from-a-document-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» ok|boolean|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all knowledge entries

<a id="opIdgetApiV1OrganisationByOrganisationIdAiKnowledgeEntries"></a>

`GET /api/v1/organisation/{organisationId}/ai/knowledge/entries`

<h3 id="get-all-knowledge-entries-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "workspaceId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "sourceType": {
        "enum": [
          "db",
          "local",
          "url",
          "text",
          "finetuning",
          "plugin",
          "external"
        ]
      },
      "sourceId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "sourceExternalId": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 255,
            "nullable": true
          }
        ]
      },
      "sourceFileBucket": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 255,
            "nullable": true
          }
        ]
      },
      "sourceUrl": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 1000,
            "nullable": true
          }
        ]
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "description": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "abstract": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "organisationId",
      "teamId",
      "userId",
      "workspaceId",
      "sourceType",
      "sourceId",
      "sourceExternalId",
      "sourceFileBucket",
      "sourceUrl",
      "name",
      "description",
      "abstract",
      "meta",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-knowledge-entries-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-knowledge-entries-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Get a full source document for a knowledge entry by ID

<a id="opIdgetApiV1OrganisationByOrganisationIdAiKnowledgeEntriesById"></a>

`GET /api/v1/organisation/{organisationId}/ai/knowledge/entries/{id}`

<h3 id="get-a-full-source-document-for-a-knowledge-entry-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "finetuning",
        "plugin",
        "external"
      ]
    },
    "sourceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceExternalId": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceFileBucket": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceUrl": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000,
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "abstract": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "sourceType",
    "sourceId",
    "sourceExternalId",
    "sourceFileBucket",
    "sourceUrl",
    "name",
    "description",
    "abstract",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-a-full-source-document-for-a-knowledge-entry-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-a-full-source-document-for-a-knowledge-entry-by-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a knowledge entry by ID

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiKnowledgeEntriesById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/knowledge/entries/{id}`

<h3 id="delete-a-knowledge-entry-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-knowledge-entry-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Search for similar documents

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeSimilarity-search"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/similarity-search`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    },
    "searchText": {
      "type": "string"
    },
    "n": {
      "type": "number"
    },
    "addBeforeN": {
      "type": "number"
    },
    "addAfterN": {
      "type": "number"
    },
    "filterKnowledgeEntryIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "filter": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "filterName": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "fullDocument": {
      "type": "boolean"
    }
  },
  "required": [
    "organisationId",
    "searchText"
  ]
}
```

<h3 id="search-for-similar-documents-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» organisationId|body|string|true|none|
|» searchText|body|string|true|none|
|» n|body|number|false|none|
|» addBeforeN|body|number|false|none|
|» addAfterN|body|number|false|none|
|» filterKnowledgeEntryIds|body|[string]|false|none|
|» filter|body|object|false|none|
|»» **additionalProperties**|body|[string]|false|none|
|» filterName|body|[string]|false|none|
|» fullDocument|body|boolean|false|none|

<h3 id="search-for-similar-documents-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Parse a knowledge-text entry to a knowledge entry

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeParse-document"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/parse-document`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "external"
      ]
    },
    "sourceId": {
      "type": "string"
    },
    "sourceFileBucket": {
      "type": "string"
    },
    "sourceUrl": {
      "type": "string"
    },
    "organisationId": {
      "type": "string"
    }
  },
  "required": [
    "sourceType",
    "organisationId"
  ]
}
```

<h3 id="parse-a-knowledge-text-entry-to-a-knowledge-entry-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» sourceType|body|any|true|none|
|» sourceId|body|string|false|none|
|» sourceFileBucket|body|string|false|none|
|» sourceUrl|body|string|false|none|
|» organisationId|body|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» sourceType|db|
|» sourceType|local|
|» sourceType|url|
|» sourceType|text|
|» sourceType|external|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "finetuning",
        "plugin",
        "external"
      ]
    },
    "sourceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceExternalId": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceFileBucket": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceUrl": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000,
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "abstract": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "sourceType",
    "sourceId",
    "sourceExternalId",
    "sourceFileBucket",
    "sourceUrl",
    "name",
    "description",
    "abstract",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="parse-a-knowledge-text-entry-to-a-knowledge-entry-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="parse-a-knowledge-text-entry-to-a-knowledge-entry-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Add a text knowledge entry from text

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeFrom-text"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/from-text`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    },
    "text": {
      "type": "string"
    }
  },
  "required": [
    "organisationId",
    "text"
  ]
}
```

<h3 id="add-a-text-knowledge-entry-from-text-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» organisationId|body|string|true|none|
|» text|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "finetuning",
        "plugin",
        "external"
      ]
    },
    "sourceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceExternalId": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceFileBucket": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceUrl": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000,
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "abstract": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "sourceType",
    "sourceId",
    "sourceExternalId",
    "sourceFileBucket",
    "sourceUrl",
    "name",
    "description",
    "abstract",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="add-a-text-knowledge-entry-from-text-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-a-text-knowledge-entry-from-text-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Add a text knowledge entry from URL

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeFrom-url"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/from-url`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "organisationId": {
      "type": "string"
    },
    "url": {
      "type": "string"
    }
  },
  "required": [
    "organisationId",
    "url"
  ]
}
```

<h3 id="add-a-text-knowledge-entry-from-url-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» organisationId|body|string|true|none|
|» url|body|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "finetuning",
        "plugin",
        "external"
      ]
    },
    "sourceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceExternalId": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceFileBucket": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceUrl": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000,
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "abstract": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "sourceType",
    "sourceId",
    "sourceExternalId",
    "sourceFileBucket",
    "sourceUrl",
    "name",
    "description",
    "abstract",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="add-a-text-knowledge-entry-from-url-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-a-text-knowledge-entry-from-url-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Create a new knowledge text entry

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeTexts"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/texts`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "text": {
      "type": "string"
    },
    "title": {
      "type": "string",
      "maxLength": 1000
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "organisationId",
    "text"
  ]
}
```

<h3 id="create-a-new-knowledge-text-entry-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» organisationId|body|string(uuid)|true|none|
|» organisationWide|body|boolean|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» userId|body|string(uuid)¦null|false|none|
|» workspaceId|body|string(uuid)¦null|false|none|
|» text|body|string|true|none|
|» title|body|string|false|none|
|» meta|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

<h3 id="create-a-new-knowledge-text-entry-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Read knowledge text entries

<a id="opIdgetApiV1OrganisationByOrganisationIdAiKnowledgeTexts"></a>

`GET /api/v1/organisation/{organisationId}/ai/knowledge/texts`

<h3 id="read-knowledge-text-entries-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "workspaceId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "sourceType": {
        "enum": [
          "db",
          "local",
          "url",
          "text",
          "finetuning",
          "plugin",
          "external"
        ]
      },
      "sourceId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "sourceExternalId": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 255,
            "nullable": true
          }
        ]
      },
      "sourceFileBucket": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 255,
            "nullable": true
          }
        ]
      },
      "sourceUrl": {
        "anyOf": [
          {
            "type": "string",
            "maxLength": 1000,
            "nullable": true
          }
        ]
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "description": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "abstract": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "organisationId",
      "teamId",
      "userId",
      "workspaceId",
      "sourceType",
      "sourceId",
      "sourceExternalId",
      "sourceFileBucket",
      "sourceUrl",
      "name",
      "description",
      "abstract",
      "meta",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="read-knowledge-text-entries-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="read-knowledge-text-entries-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Update a knowledge text entry

<a id="opIdputApiV1OrganisationByOrganisationIdAiKnowledgeTextsById"></a>

`PUT /api/v1/organisation/{organisationId}/ai/knowledge/texts/{id}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "organisationWide": {
      "type": "boolean"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "text": {
      "type": "string"
    },
    "title": {
      "type": "string",
      "maxLength": 1000
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "type": "string",
              "nullable": true
            },
            {
              "type": "number",
              "nullable": true
            },
            {
              "type": "boolean",
              "nullable": true
            }
          ]
        },
        {
          "type": "array",
          "items": {}
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-a-knowledge-text-entry-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» organisationId|body|string(uuid)|false|none|
|» organisationWide|body|boolean|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» userId|body|string(uuid)¦null|false|none|
|» workspaceId|body|string(uuid)¦null|false|none|
|» text|body|string|false|none|
|» title|body|string|false|none|
|» meta|body|any|false|none|
|»» *anonymous*|body|any|false|none|
|»»» *anonymous*|body|string¦null|false|none|
|»»» *anonymous*|body|number¦null|false|none|
|»»» *anonymous*|body|boolean¦null|false|none|
|»» *anonymous*|body|[any]|false|none|
|»» *anonymous*|body|object|false|none|
|»»» **additionalProperties**|body|any|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceType": {
      "enum": [
        "db",
        "local",
        "url",
        "text",
        "finetuning",
        "plugin",
        "external"
      ]
    },
    "sourceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "sourceExternalId": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceFileBucket": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 255,
          "nullable": true
        }
      ]
    },
    "sourceUrl": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000,
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "abstract": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "organisationId",
    "teamId",
    "userId",
    "workspaceId",
    "sourceType",
    "sourceId",
    "sourceExternalId",
    "sourceFileBucket",
    "sourceUrl",
    "name",
    "description",
    "abstract",
    "meta",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-a-knowledge-text-entry-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-knowledge-text-entry-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» sourceType|any|true|none|none|
|» sourceId|string(uuid)¦null|true|none|none|
|» sourceExternalId|string¦null|true|none|none|
|» sourceFileBucket|string¦null|true|none|none|
|» sourceUrl|string¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» abstract|string¦null|true|none|none|
|» meta|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|sourceType|db|
|sourceType|local|
|sourceType|url|
|sourceType|text|
|sourceType|finetuning|
|sourceType|plugin|
|sourceType|external|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a knowledge text entry

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiKnowledgeTextsById"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/knowledge/texts/{id}`

<h3 id="delete-a-knowledge-text-entry-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|id|path|string|true|none|

<h3 id="delete-a-knowledge-text-entry-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Upload a file and extract knowledge in one step

<a id="opIdpostApiV1OrganisationByOrganisationIdAiKnowledgeUpload-and-extract"></a>

`POST /api/v1/organisation/{organisationId}/ai/knowledge/upload-and-extract`

> Body parameter

```json
{}
```

```yaml
{}

```

<h3 id="upload-a-file-and-extract-knowledge-in-one-step-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|any|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "ok": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "ok"
  ]
}
```

<h3 id="upload-a-file-and-extract-knowledge-in-one-step-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<h3 id="upload-a-file-and-extract-knowledge-in-one-step-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» ok|boolean|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-chat-groups">chat-groups</h1>

## Get chat history for a chat group

<a id="opIdgetApiV1OrganisationByOrganisationIdAiChat-groupsByGroupIdHistory"></a>

`GET /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}/history`

<h3 id="get-chat-history-for-a-chat-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string"
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "messages": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "state": {
        "anyOf": [
          {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              },
              {
                "type": "number",
                "nullable": true
              },
              {
                "type": "boolean",
                "nullable": true
              }
            ]
          },
          {
            "type": "array",
            "items": {}
          },
          {
            "type": "object",
            "additionalProperties": {}
          }
        ]
      },
      "chatSessionGroupId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "deleteAt": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      },
      "lastUsedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "name",
      "userId",
      "organisationId",
      "messages",
      "state",
      "chatSessionGroupId",
      "deleteAt",
      "createdAt",
      "updatedAt",
      "lastUsedAt"
    ]
  }
}
```

<h3 id="get-chat-history-for-a-chat-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-chat-history-for-a-chat-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» name|string|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)¦null|true|none|none|
|» messages|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» state|any|true|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|any|false|none|none|

*anyOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|string¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|number¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»»» *anonymous*|boolean¦null|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[any]|false|none|none|

*or*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» **additionalProperties**|any|false|none|none|

*continued*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» chatSessionGroupId|string(uuid)¦null|true|none|none|
|» deleteAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|
|» lastUsedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a new chat group

<a id="opIdpostApiV1OrganisationByOrganisationIdAiChat-groups"></a>

`POST /api/v1/organisation/{organisationId}/ai/chat-groups`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "organisationId"
  ]
}
```

<h3 id="create-a-new-chat-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|true|none|
|» meta|body|any|false|none|
|» organisationId|body|string(uuid)|true|none|
|» teamId|body|string(uuid)¦null|false|none|
|» workspaceId|body|string(uuid)¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "meta",
    "organisationId",
    "teamId",
    "workspaceId",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="create-a-new-chat-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-chat-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all chat groups for the current user

<a id="opIdgetApiV1OrganisationByOrganisationIdAiChat-groups"></a>

`GET /api/v1/organisation/{organisationId}/ai/chat-groups`

<h3 id="get-all-chat-groups-for-the-current-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|workspaceId|query|string|false|none|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "maxLength": 255
      },
      "meta": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "workspaceId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "name",
      "meta",
      "organisationId",
      "teamId",
      "workspaceId",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-chat-groups-for-the-current-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-chat-groups-for-the-current-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a chat group

<a id="opIdputApiV1OrganisationByOrganisationIdAiChat-groupsByGroupId"></a>

`PUT /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-a-chat-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» name|body|string|false|none|
|» meta|body|any|false|none|
|» organisationId|body|string(uuid)|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» workspaceId|body|string(uuid)¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 255
    },
    "meta": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "workspaceId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "meta",
    "organisationId",
    "teamId",
    "workspaceId",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-a-chat-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-chat-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» name|string|true|none|none|
|» meta|any|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» workspaceId|string(uuid)¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a chat group

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiChat-groupsByGroupId"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}`

<h3 id="delete-a-chat-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|

<h3 id="delete-a-chat-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Add users to a chat group

<a id="opIdpostApiV1OrganisationByOrganisationIdAiChat-groupsByGroupIdUsers"></a>

`POST /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}/users`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "userIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "userIds"
  ]
}
```

<h3 id="add-users-to-a-chat-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|
|body|body|object|false|none|
|» userIds|body|[string]|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "chatSessionGroupId": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      }
    },
    "required": [
      "id",
      "chatSessionGroupId",
      "userId"
    ]
  }
}
```

<h3 id="add-users-to-a-chat-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="add-users-to-a-chat-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» chatSessionGroupId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Remove users from a chat group

<a id="opIddeleteApiV1OrganisationByOrganisationIdAiChat-groupsByGroupIdUsers"></a>

`DELETE /api/v1/organisation/{organisationId}/ai/chat-groups/{groupId}/users`

<h3 id="remove-users-from-a-chat-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|groupId|path|string|true|none|

<h3 id="remove-users-from-a-chat-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-ai-utils">ai-utils</h1>

## Convert text to speech

<a id="opIdpostApiV1OrganisationByOrganisationIdAiUtilsTts"></a>

`POST /api/v1/organisation/{organisationId}/ai/utils/tts`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    },
    "voice": {
      "anyOf": [
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        },
        {
          "enum": [
            null
          ]
        }
      ]
    }
  },
  "required": [
    "text"
  ]
}
```

<h3 id="convert-text-to-speech-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» text|body|string|true|none|
|» voice|body|any|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|
|»» *anonymous*|body|object|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|
|»» *anonymous*|null|

> Example responses

> 200 Response

<h3 id="convert-text-to-speech-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Send Audio file in MP3 format|string|

<aside class="success">
This operation does not require authentication
</aside>

## Convert speech to text

<a id="opIdpostApiV1OrganisationByOrganisationIdAiUtilsStt"></a>

`POST /api/v1/organisation/{organisationId}/ai/utils/stt`

> Body parameter

```yaml
type: object
properties:
  file: {}
  returnSegments:
    type: string
  returnWords:
    type: string
required:
  - file

```

<h3 id="convert-speech-to-text-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» file|body|any|true|none|
|» returnSegments|body|string|false|none|
|» returnWords|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    },
    "segments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "start": {
            "type": "number"
          },
          "end": {
            "type": "number"
          },
          "text": {
            "type": "string"
          }
        },
        "required": [
          "start",
          "end",
          "text"
        ]
      }
    },
    "words": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "word": {
            "type": "string"
          },
          "start": {
            "type": "number"
          },
          "end": {
            "type": "number"
          }
        },
        "required": [
          "word",
          "start",
          "end"
        ]
      }
    }
  },
  "required": [
    "text"
  ]
}
```

<h3 id="convert-speech-to-text-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Transcription result|Inline|

<h3 id="convert-speech-to-text-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» text|string|true|none|none|
|» segments|[object]|false|none|none|
|»» start|number|true|none|none|
|»» end|number|true|none|none|
|»» text|string|true|none|none|
|» words|[object]|false|none|none|
|»» word|string|true|none|none|
|»» start|number|true|none|none|
|»» end|number|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-workspaces">workspaces</h1>

## Get all workspaces for user

<a id="opIdgetApiV1OrganisationByOrganisationIdWorkspaces"></a>

`GET /api/v1/organisation/{organisationId}/workspaces`

<h3 id="get-all-workspaces-for-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "parentId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "name": {
        "type": "string"
      },
      "description": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "result": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "finishedAt": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "parentId",
      "organisationId",
      "userId",
      "teamId",
      "name",
      "description",
      "result",
      "finishedAt",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-workspaces-for-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-workspaces-for-user-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» parentId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» result|any|true|none|none|
|» finishedAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create new workspace in a specific organisation

<a id="opIdpostApiV1OrganisationByOrganisationIdWorkspaces"></a>

`POST /api/v1/organisation/{organisationId}/workspaces`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "parentId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string"
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "finishedAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "organisationId",
    "name"
  ]
}
```

<h3 id="create-new-workspace-in-a-specific-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» parentId|body|string(uuid)¦null|false|none|
|» organisationId|body|string(uuid)|true|none|
|» userId|body|string(uuid)¦null|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» name|body|string|true|none|
|» description|body|string¦null|false|none|
|» result|body|any|false|none|
|» finishedAt|body|string¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "parentId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string"
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "finishedAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "parentId",
    "organisationId",
    "userId",
    "teamId",
    "name",
    "description",
    "result",
    "finishedAt",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="create-new-workspace-in-a-specific-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-new-workspace-in-a-specific-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» parentId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» result|any|true|none|none|
|» finishedAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all shared workspaces where user is a member but not owner

<a id="opIdgetApiV1OrganisationByOrganisationIdWorkspacesShared"></a>

`GET /api/v1/organisation/{organisationId}/workspaces/shared`

<h3 id="get-all-shared-workspaces-where-user-is-a-member-but-not-owner-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "parentId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "name": {
        "type": "string"
      },
      "description": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "result": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "finishedAt": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "parentId",
      "organisationId",
      "userId",
      "teamId",
      "name",
      "description",
      "result",
      "finishedAt",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-shared-workspaces-where-user-is-a-member-but-not-owner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-shared-workspaces-where-user-is-a-member-but-not-owner-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» parentId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» result|any|true|none|none|
|» finishedAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get single workspace by ID

<a id="opIdgetApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceId"></a>

`GET /api/v1/organisation/{organisationId}/workspaces/{workspaceId}`

<h3 id="get-single-workspace-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "parentId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string"
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "finishedAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "parentId",
    "organisationId",
    "userId",
    "teamId",
    "name",
    "description",
    "result",
    "finishedAt",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-single-workspace-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-single-workspace-by-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» parentId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» result|any|true|none|none|
|» finishedAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a workspace in a specific organisation

<a id="opIdputApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceId"></a>

`PUT /api/v1/organisation/{organisationId}/workspaces/{workspaceId}`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "parentId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string"
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "finishedAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": []
}
```

<h3 id="update-a-workspace-in-a-specific-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|
|body|body|object|false|none|
|» id|body|string(uuid)|false|none|
|» parentId|body|string(uuid)¦null|false|none|
|» organisationId|body|string(uuid)|false|none|
|» userId|body|string(uuid)¦null|false|none|
|» teamId|body|string(uuid)¦null|false|none|
|» name|body|string|false|none|
|» description|body|string¦null|false|none|
|» result|body|any|false|none|
|» finishedAt|body|string¦null|false|none|
|» createdAt|body|string|false|none|
|» updatedAt|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "parentId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "teamId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "name": {
      "type": "string"
    },
    "description": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "finishedAt": {
      "anyOf": [
        {
          "type": "string",
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "parentId",
    "organisationId",
    "userId",
    "teamId",
    "name",
    "description",
    "result",
    "finishedAt",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-a-workspace-in-a-specific-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="update-a-workspace-in-a-specific-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» parentId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» result|any|true|none|none|
|» finishedAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a workspace

<a id="opIddeleteApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceId"></a>

`DELETE /api/v1/organisation/{organisationId}/workspaces/{workspaceId}`

<h3 id="delete-a-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|

<h3 id="delete-a-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Add relations to a workspace

<a id="opIdpostApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdRelations"></a>

`POST /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/relations`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "knowledgeTextIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "knowledgeEntryIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "promptTemplateIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "chatGroupIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "chatSessionIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "userIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": []
}
```

<h3 id="add-relations-to-a-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|
|body|body|object|false|none|
|» knowledgeTextIds|body|[string]|false|none|
|» knowledgeEntryIds|body|[string]|false|none|
|» promptTemplateIds|body|[string]|false|none|
|» chatGroupIds|body|[string]|false|none|
|» chatSessionIds|body|[string]|false|none|
|» userIds|body|[string]|false|none|

<h3 id="add-relations-to-a-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Remove relations from a workspace

<a id="opIddeleteApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdRelations"></a>

`DELETE /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/relations`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "knowledgeTextIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "knowledgeEntryIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "promptTemplateIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "chatGroupIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "chatSessionIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "userIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": []
}
```

<h3 id="remove-relations-from-a-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|
|body|body|object|false|none|
|» knowledgeTextIds|body|[string]|false|none|
|» knowledgeEntryIds|body|[string]|false|none|
|» promptTemplateIds|body|[string]|false|none|
|» chatGroupIds|body|[string]|false|none|
|» chatSessionIds|body|[string]|false|none|
|» userIds|body|[string]|false|none|

<h3 id="remove-relations-from-a-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get all members of a workspace

<a id="opIdgetApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdMembers"></a>

`GET /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/members`

<h3 id="get-all-members-of-a-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "userId": {
        "type": "string"
      },
      "userEmail": {
        "type": "string"
      }
    },
    "required": [
      "userId",
      "userEmail"
    ]
  }
}
```

<h3 id="get-all-members-of-a-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-members-of-a-workspace-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» userId|string|true|none|none|
|» userEmail|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Add members to a workspace

<a id="opIdpostApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdMembers"></a>

`POST /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/members`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "userIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "userIds"
  ]
}
```

<h3 id="add-members-to-a-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|
|body|body|object|false|none|
|» userIds|body|[string]|true|none|

<h3 id="add-members-to-a-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Remove members from a workspace

<a id="opIddeleteApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdMembersByMemberId"></a>

`DELETE /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/members/{memberId}`

<h3 id="remove-members-from-a-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|
|memberId|path|string|true|none|

<h3 id="remove-members-from-a-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get all child workspaces for a parent workspace

<a id="opIdgetApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdChildren"></a>

`GET /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/children`

<h3 id="get-all-child-workspaces-for-a-parent-workspace-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "parentId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "teamId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "name": {
        "type": "string"
      },
      "description": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "result": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "finishedAt": {
        "anyOf": [
          {
            "type": "string",
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "parentId",
      "organisationId",
      "userId",
      "teamId",
      "name",
      "description",
      "result",
      "finishedAt",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-child-workspaces-for-a-parent-workspace-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-child-workspaces-for-a-parent-workspace-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» parentId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» teamId|string(uuid)¦null|true|none|none|
|» name|string|true|none|none|
|» description|string¦null|true|none|none|
|» result|any|true|none|none|
|» finishedAt|string¦null|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get all parent workspaces for a given workspace ID

<a id="opIdgetApiV1OrganisationByOrganisationIdWorkspacesByWorkspaceIdOrigin"></a>

`GET /api/v1/organisation/{organisationId}/workspaces/{workspaceId}/origin`

<h3 id="get-all-parent-workspaces-for-a-given-workspace-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|workspaceId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "list": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "parentId": {
            "anyOf": [
              {
                "type": "string",
                "nullable": true
              }
            ]
          }
        },
        "required": [
          "id",
          "name"
        ]
      }
    }
  },
  "required": [
    "list"
  ]
}
```

<h3 id="get-all-parent-workspaces-for-a-given-workspace-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-parent-workspaces-for-a-given-workspace-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» list|[object]|true|none|none|
|»» id|string|true|none|none|
|»» name|string|true|none|none|
|»» parentId|string¦null|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="symbiosika-backend-api-jobs">jobs</h1>

## Get all jobs for an organisation

<a id="opIdgetApiV1OrganisationByOrganisationIdJobs"></a>

`GET /api/v1/organisation/{organisationId}/jobs`

<h3 id="get-all-jobs-for-an-organisation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|status|query|string|false|none|
|type|query|string|false|none|
|limit|query|string|false|none|
|offset|query|string|false|none|
|sortBy|query|string|false|none|
|sortOrder|query|string|false|none|
|organisationId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "userId": {
        "anyOf": [
          {
            "type": "string",
            "format": "uuid",
            "nullable": true
          }
        ]
      },
      "organisationId": {
        "type": "string",
        "format": "uuid"
      },
      "type": {
        "type": "string"
      },
      "status": {
        "enum": [
          "pending",
          "running",
          "completed",
          "failed"
        ]
      },
      "metadata": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "result": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "error": {
        "anyOf": [
          {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "nullable": true
                  },
                  {
                    "type": "number",
                    "nullable": true
                  },
                  {
                    "type": "boolean",
                    "nullable": true
                  }
                ]
              },
              {
                "type": "array",
                "items": {}
              },
              {
                "type": "object",
                "additionalProperties": {}
              }
            ],
            "nullable": true
          }
        ]
      },
      "createdAt": {
        "type": "string"
      },
      "updatedAt": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "userId",
      "organisationId",
      "type",
      "status",
      "metadata",
      "result",
      "error",
      "createdAt",
      "updatedAt"
    ]
  }
}
```

<h3 id="get-all-jobs-for-an-organisation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="get-all-jobs-for-an-organisation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» type|string|true|none|none|
|» status|any|true|none|none|
|» metadata|any|true|none|none|
|» result|any|true|none|none|
|» error|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|status|pending|
|status|running|
|status|completed|
|status|failed|

<aside class="success">
This operation does not require authentication
</aside>

## Create a new job

<a id="opIdpostApiV1OrganisationByOrganisationIdJobs"></a>

`POST /api/v1/organisation/{organisationId}/jobs`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string"
    },
    "metadata": {}
  },
  "required": [
    "type"
  ]
}
```

<h3 id="create-a-new-job-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|body|body|object|false|none|
|» type|body|string|true|none|
|» metadata|body|any|false|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "type": {
      "type": "string"
    },
    "status": {
      "enum": [
        "pending",
        "running",
        "completed",
        "failed"
      ]
    },
    "metadata": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "error": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "userId",
    "organisationId",
    "type",
    "status",
    "metadata",
    "result",
    "error",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="create-a-new-job-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|

<h3 id="create-a-new-job-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» type|string|true|none|none|
|» status|any|true|none|none|
|» metadata|any|true|none|none|
|» result|any|true|none|none|
|» error|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|status|pending|
|status|running|
|status|completed|
|status|failed|

<aside class="success">
This operation does not require authentication
</aside>

## Get a specific job by ID

<a id="opIdgetApiV1OrganisationByOrganisationIdJobsByJobId"></a>

`GET /api/v1/organisation/{organisationId}/jobs/{jobId}`

<h3 id="get-a-specific-job-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|jobId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "type": {
      "type": "string"
    },
    "status": {
      "enum": [
        "pending",
        "running",
        "completed",
        "failed"
      ]
    },
    "metadata": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "error": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "userId",
    "organisationId",
    "type",
    "status",
    "metadata",
    "result",
    "error",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="get-a-specific-job-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Job not found|None|

<h3 id="get-a-specific-job-by-id-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» type|string|true|none|none|
|» status|any|true|none|none|
|» metadata|any|true|none|none|
|» result|any|true|none|none|
|» error|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|status|pending|
|status|running|
|status|completed|
|status|failed|

<aside class="success">
This operation does not require authentication
</aside>

## Cancel a job

<a id="opIddeleteApiV1OrganisationByOrganisationIdJobsByJobId"></a>

`DELETE /api/v1/organisation/{organisationId}/jobs/{jobId}`

<h3 id="cancel-a-job-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|jobId|path|string|true|none|

<h3 id="cancel-a-job-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Job not found|None|

<aside class="success">
This operation does not require authentication
</aside>

## Update job progress

<a id="opIdputApiV1OrganisationByOrganisationIdJobsByJobIdProgress"></a>

`PUT /api/v1/organisation/{organisationId}/jobs/{jobId}/progress`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "progress": {
      "type": "number"
    }
  },
  "required": [
    "progress"
  ]
}
```

<h3 id="update-job-progress-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|jobId|path|string|true|none|
|body|body|object|false|none|
|» progress|body|number|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid",
          "nullable": true
        }
      ]
    },
    "organisationId": {
      "type": "string",
      "format": "uuid"
    },
    "type": {
      "type": "string"
    },
    "status": {
      "enum": [
        "pending",
        "running",
        "completed",
        "failed"
      ]
    },
    "metadata": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "result": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "error": {
      "anyOf": [
        {
          "anyOf": [
            {
              "anyOf": [
                {
                  "type": "string",
                  "nullable": true
                },
                {
                  "type": "number",
                  "nullable": true
                },
                {
                  "type": "boolean",
                  "nullable": true
                }
              ]
            },
            {
              "type": "array",
              "items": {}
            },
            {
              "type": "object",
              "additionalProperties": {}
            }
          ],
          "nullable": true
        }
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "userId",
    "organisationId",
    "type",
    "status",
    "metadata",
    "result",
    "error",
    "createdAt",
    "updatedAt"
  ]
}
```

<h3 id="update-job-progress-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Job not found|None|

<h3 id="update-job-progress-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(uuid)|true|none|none|
|» userId|string(uuid)¦null|true|none|none|
|» organisationId|string(uuid)|true|none|none|
|» type|string|true|none|none|
|» status|any|true|none|none|
|» metadata|any|true|none|none|
|» result|any|true|none|none|
|» error|any|true|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|status|pending|
|status|running|
|status|completed|
|status|failed|

<aside class="success">
This operation does not require authentication
</aside>

## Get job status

<a id="opIdgetApiV1OrganisationByOrganisationIdJobsByJobIdStatus"></a>

`GET /api/v1/organisation/{organisationId}/jobs/{jobId}/status`

<h3 id="get-job-status-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|organisationId|path|string|true|none|
|jobId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string"
    },
    "progress": {
      "type": "number"
    }
  },
  "required": [
    "status"
  ]
}
```

<h3 id="get-job-status-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Job not found|None|

<h3 id="get-job-status-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» status|string|true|none|none|
|» progress|number|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas