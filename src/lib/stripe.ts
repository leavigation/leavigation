import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function getCheckoutModeForPrice(priceId: string): Promise<"subscription" | "payment"> {
  const price = await stripe.prices.retrieve(priceId);
  if (price.type === "recurring") return "subscription";
  if (price.type === "one_time") return "payment";
  throw new Error(`Unsupported Stripe price type: ${price.type}`);
}
