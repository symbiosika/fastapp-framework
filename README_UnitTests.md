# Helper to create Unit Tests:

You will write unit tests in JEST syntax for the given functions.
All imports will be bun like:

```ts
import { describe, it, expect } from "bun:test";
import { myFunction } from ".";
```

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

The test file will have the function name in kebap-case plus ".test.ts" in the same folder.
If you are working on the database you will do CRUD operations and delete all your test data afterwards.
