import { NextRequest, NextResponse } from "next/server";
import { getCheckoutModeForPrice, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { clerkId, email, priceId } = await req.json();
    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const price = priceId ?? process.env.STRIPE_PLANNER_PRICE_ID;
    if (!price) {
      return NextResponse.json({ error: "Missing price ID" }, { status: 400 });
    }

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("clerk_id", clerkId)
      .maybeSingle();

    let customerId = userData?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: email ?? undefined });
      customerId = customer.id;
      const { error: upsertError } = await supabaseAdmin
        .from("users")
        .upsert(
          { clerk_id: clerkId, email: email ?? null, stripe_customer_id: customerId },
          { onConflict: "clerk_id" }
        );
      if (upsertError) {
        console.error("create-checkout upsert error:", upsertError);
        return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
      }
    }

    const mode = await getCheckoutModeForPrice(price);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price, quantity: 1 }],
      mode,
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { clerk_id: clerkId },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error:", err);
    const message =
      err instanceof Error && err.message.includes("No such price")
        ? "Invalid Stripe price ID. Check your Stripe product configuration."
        : err instanceof Error && err.message.includes("recurring price")
          ? "This Stripe price must be set up as a recurring subscription or one-time payment."
          : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
