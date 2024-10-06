import type {
  StripeDefinition,
  StripeItem,
} from "src/lib/types/shared/payment";

const paymentOptions: StripeItem[] = [
  {
    group: "demo",
    priceName: "Demo Produkt",
    prodId: "prod_QynV5YVsN21LGl",
    priceId: "price_1Q6pu5ISOodfhgtvu8CwC67J",
    type: "payment",
  },
  {
    group: "demo",
    priceName: "Demo Abo",
    prodId: "prod_QynUUx4dtRklIE",
    priceId: "price_1Q6ptJISOodfhgtv4h8JIZ8r",
    type: "subscription",
  },
];

export default <StripeDefinition>{
  stripeItems: paymentOptions,
  paymentMethodTypes: ["card"],
};
