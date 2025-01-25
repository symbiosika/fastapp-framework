# File Management API Endpoints

These endpoints allow you to manage files using either database storage or local disk storage.
The type depends on your application and is defined in the .env file.

## Upload File

Uploads a file to either database or local storage.

```http
POST /api/v1/organisation/:organisationId/files/{storage_type}/{bucket}
```

### Parameters

| Parameter      | Type   | Description                              |
| -------------- | ------ | ---------------------------------------- |
| `storage_type` | string | Storage type (`db` or `local`)           |
| `bucket`       | string | The bucket/folder name to store the file |

### Request Body

Must be `multipart/form-data` with a file field named "file".

### Response

```json
{
  "id": "file_id"
}
```

## Get File

Retrieves a file from storage.

```http
GET /api/v1/organisation/:organisationId/files/{storage_type}/{bucket}/{file_id}
```

### Parameters

| Parameter      | Type   | Description                    |
| -------------- | ------ | ------------------------------ |
| `storage_type` | string | Storage type (`db` or `local`) |
| `bucket`       | string | The bucket/folder name         |
| `file_id`      | string | The ID of the file to retrieve |

### Response

Returns the file content with `application/octet-stream` content type.

## Delete File

Deletes a file from storage.

```http
DELETE /api/v1/organisation/:organisationId/files/{storage_type}/{bucket}/{file_id}
```

### Parameters

| Parameter      | Type   | Description                    |
| -------------- | ------ | ------------------------------ |
| `storage_type` | string | Storage type (`db` or `local`) |
| `bucket`       | string | The bucket/folder name         |
| `file_id`      | string | The ID of the file to delete   |

### Response

Returns status code 204 on successful deletion.

### Error Responses

| Status Code | Description                                        |
| ----------- | -------------------------------------------------- |
| 400         | Invalid request (wrong content type, invalid type) |
| 405         | Method not allowed                                 |

### Notes

- All endpoints require authentication via JWT token in cookie
- Files can be stored in either database (`db`) or local disk storage (`local`)
- For local storage, file IDs include the file extension (e.g., `{file_id}.txt`)
