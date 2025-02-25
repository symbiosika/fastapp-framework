# Helper to create Unit Tests:

## Setup

You will write unit tests in JEST syntax for the given functions.
All imports will be bun like:

```ts
import { describe, test, expect } from "bun:test";
import { myFunction } from ".";
```

## Database Connection

IF you are working with database data you will need to be sure you have a DB connection.

```ts
import { beforeAll } from "bun:test";
import {
  createDatabaseClient,
  getDb,
  waitForDbConnection,
} from "src/lib/db/db-connection";

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();
});
```

This is only needed if a database connection is needed.

## API endpoints

If you are testing API endpoints you need to setup the routes as simple Hono app like this.
The testFetcher is a helper to test the API endpoints. It will always respond with the "status",
"testResponse" and "jsonResponse" (can be undefined).
It will take the Hono app, the path, the token and the body (can be undefined).
Possible methods are: get, post, put, delete.

```ts
import { testFetcher } from "../../test/fetcher.test";

const TEST_USER_1_TOKEN = await getJwtTokenForTesting(0);

describe("User API Endpoints", () => {
  const app: FastAppHono = new Hono();

  beforeAll(async () => {
    defineMyEndpoints(app, "/api"); // "defineMyEndpoints" function comes from the file that is tested
  });

  test("some test", async () => {
    const response = await testFetcher.post(
      app,
      "/api/users",
      TEST_USER_1_TOKEN,
      {
        some: "jsoo",
      }
    );
  });
  expect(response.status).toBe(200);
  expect(response.jsonResponse?.someNum).toBe(2);
});
```

The test file will have the function name in kebap-case plus ".test.ts" in the same folder.
If you are working on the database you will do CRUD operations and delete all your test data afterwards.

## Sequence

Test that will test CRUD etc. needs to be run in sequence.
That means they need to be in the same "test" or "it" block.

## Security checks

You can check the necessary rejection of unauthorized requests with the rejectUnauthorized function.
It takes an array of [method, path] and will check if the request is rejected with a 401 status code.

```ts
import { rejectUnauthorized } from "../../test/reject-unauthorized.test";

describe("Security checks", () => {
  const app: FastAppHono = new Hono();
  defineMyEndpoints(app, "/api");
  rejectUnauthorized(app, [["GET", "/api/users"]]);
});
```
