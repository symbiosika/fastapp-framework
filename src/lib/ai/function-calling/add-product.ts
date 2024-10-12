import type { FunctionCalling } from "./function-calls";

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
      id: "L7F5S0D95",
      args,
    };
  },
  uiResponse: {
    type: "render_text",
    content: "Product added",
  },
};

export default item;
