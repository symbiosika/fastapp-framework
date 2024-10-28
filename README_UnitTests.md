# Helper to create Unit Tests:

write a unit test in JEST syntax.
All imports will be bun like:

```ts
import { describe, it, expect } from "bun:test";
import { myFunction } from ".";
```

The test file will have the function name in kebap-case plus ".test.ts" in the same folder.
