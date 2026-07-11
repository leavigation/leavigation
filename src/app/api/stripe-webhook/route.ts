import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as { customer: string; status: string };
    await supabaseAdmin.from("users").update({ stripe_subscription_status: sub.status }).eq("stripe_customer_id", sub.customer);
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { customer: string };
    await supabaseAdmin.from("users").update({ stripe_subscription_status: "free" }).eq("stripe_customer_id", sub.customer);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { customer: string | null; mode: string; payment_status: string };
    if (session.mode === "payment" && session.payment_status === "paid" && session.customer) {
      await supabaseAdmin
        .from("users")
        .update({ stripe_subscription_status: "active" })
        .eq("stripe_customer_id", session.customer);
    }
  }
  return NextResponse.json({ received: true });
}
