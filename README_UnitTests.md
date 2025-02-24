# Helper to create Unit Tests:

## Setup

You will write unit tests in JEST syntax for the given functions.
All imports will be bun like:

```ts
import { describe, it, expect } from "bun:test";
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

If you are testing API endpoints you need to setup the routes as simple Hono app like this:

```ts
import { testFetcher } from "../../test/fetcher.test";

const TEST_USER_1_TOKEN = await getJwtTokenForTesting(0);

describe("User API Endpoints", () => {
  const app: FastAppHono = new Hono();

  beforeAll(async () => {
    defineMyEndpoints(app, "/api"); // "defineMyEndpoints" function comes from the file that is tested
  });

  it("some test", async () => {
    const response = await testFetcher.post(
      app,
      "/api/users",
      TEST_USER_1_TOKEN,
      {
        some: "jsoo",
      }
    );
  });
});
```

The test file will have the function name in kebap-case plus ".test.ts" in the same folder.
If you are working on the database you will do CRUD operations and delete all your test data afterwards.
