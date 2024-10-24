import type { FunctionCalling } from "./function-calls";

const item: FunctionCalling = {
  functionDefinitionAsJson: {
    type: "function",
    function: {
      name: "add_product",
      description: "Add a product to the database",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the item to add",
          },
          type: {
            type: "string",
            description:
              "The type of the item to add. Can be 'product' or 'feature'",
          },
          description: {
            type: "string",
            description: "The description of the item to add",
          },
          price: {
            type: "number",
            description: "The price of the item to add",
          },
        },
        required: ["name", "type", "description", "price"],
        additionalProperties: false,
      },
    },
  },
  action: async (args: Record<string, any>) => {
    console.log("add product", args);
    return {
      message: `Product added (${args})`,
      data: {
        id: "L7F5S0D95",
        args,
      },
    };
  },
  // uiResponse: {
  //   type: "render_text",
  //   content: "Product added",
  // },
  QAExamples: [
    {
      q: `I want to create a new product with the name "My best T-Shirt"`,
      a: ` \`\`\`json
          {
            "functionName": "add_product",
            "missingFields": [ "type", "description", "price" ],
            "knownFields": {
              "name": "My best T-Shirt"
            }
          }
        \`\`\` `,
    },
  ],
};

export default item;
