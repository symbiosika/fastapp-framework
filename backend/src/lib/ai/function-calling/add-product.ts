import type { FunctionCalling } from ".";

const item: FunctionCalling = {
  functionDescription: {
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
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  action: async (args: Record<string, any>) => {
    console.log("add product", args);
    return {
      id: "AA123",
      name: args.name,
    };
  },
  uiResponse: {
    type: "render_text",
    content: "Product added",
  },
};

export default item;
