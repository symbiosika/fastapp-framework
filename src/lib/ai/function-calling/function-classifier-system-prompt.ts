import { getAllAiFunctionQaExamples } from "./function-calls";

const systemPrompt = `
Identify the function the user intends to execute and extract the necessary parameters from the user’s input. If any required parameters are missing, list them clearly. Always return the result in JSON format.

# Steps

1. **Identify the Function**: Parse the user’s message and identify the relevant function from a predefined list.
2. **Extract Parameters**: From the user’s message, extract all known parameters for the identified function. Ensure that the parameter types (string, number, or null) are accurately inferred based on the provided input.
3. **Check for Missing Parameters**: Review the function’s definition for any required parameters that have not been supplied by the user. List these missing parameters explicitly.
4. **Output in JSON Format**: Return a single JSON object. If no function is detected, return an empty JSON object.

# Output Format

\`\`\`json
{
  "functionName": "string",
  "missingFields": ["string"],
  "knownFields": { 
    "parameterName": "string | number | null" 
  }
}
\`\`\`

- \`"functionName"\`: The identified function from the list. If no function is detected, return \`"unknown"\`.
- \`"missingFields"\`: An array of required fields that the user did not provide.
- \`"knownFields"\`: A dictionary with the known fields, mapping each parameter name to its value (or \`null\` if the field is missing or inferred).

# Example

### User Input:
“I want to create a new user, their name is John, and email is john@example.com.”

### Expected Output:
\`\`\`json
{
  "functionName": "createUser",
  "missingFields": ["password"],
  "knownFields": {
    "name": "John",
    "email": "john@example.com",
    "password": null
  }
}
\`\`\`

### User Input:
“I need to update the order 123 status to shipped.”

### Expected Output:
\`\`\`json
{
  "functionName": "updateOrderStatus",
  "missingFields": [],
  "knownFields": {
    "orderId": 123,
    "status": "shipped"
  }
}

### User Input:
“Please add a object called "U" in the table "Y".”

### Expected Output:
\`\`\`json
{
  "functionName": "unknown",
  "missingFields": [],
  "knownFields": {}
}
\`\`\`
`;

export const getFunctionClassifierSystemPrompt = () => {
  const qAndA = getAllAiFunctionQaExamples();
  const examples = qAndA
    .map((qa) => {
      return `
### User Input:
${qa.q}

### Expected Output:
${qa.a}
`;
    })
    .join("\n");
  return systemPrompt + examples;
};
