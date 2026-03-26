export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/supabase-server";

// Webhook Stripe handler
export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover" as any,
  });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  let event: Stripe.Event;

  // 1. Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`[Stripe Webhook Signature Error]: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const session = event.data.object as any;
  const userId = session.metadata?.user_id;
  let processingError: string | null = null;

  try {
    // 2. Handle business logic: checkout.session.completed
    // Requirement: atomic-credit-increment
    if (event.type === "checkout.session.completed") {
      if (userId) {
        const creditsToAdd = 5; // Standard pack defined in Phase 5 proposal

        // Atomic increment using RPC (Requirement: atomic-credit-increment)
        const { error: rpcError } = await supabaseAdmin.rpc("increment_user_credits", {
          p_user_id: userId,
          p_amount: creditsToAdd,
        });

        if (rpcError) {
          processingError = `RPC Error: ${rpcError.message}`;
          console.error(`🚨 [Stripe Webhook RPC Error]: Failed to increment credits for user ${userId}:`, rpcError);
        } else {
          console.log(`✅ [Stripe Webhook]: Successfully added ${creditsToAdd} credits to user ${userId}`);
        }
      } else {
        processingError = "No user_id found in metadata";
        console.error(`🚨 [Stripe Webhook Data Error]: No user_id found in metadata for session ${session.id}`);
      }
    }
  } catch (err: any) {
    processingError = `Unexpected Error: ${err.message}`;
    console.error(`🚨 [Stripe Webhook Processing Exception]:`, err);
  }

  // 3. Log the event for audit AFTER processing (Requirement: stripe-event-logging)
  // According to Design, we log it after. We include processingError in raw_event if it exists.
  const { error: logError } = await supabaseAdmin.from("stripe_events").insert({
    event_type: event.type,
    user_id: userId || null,
    amount_total: session.amount_total || null,
    stripe_session_id: session.id || null,
    raw_event: processingError 
      ? { ...event, _processing_error: processingError } 
      : event
  });

  if (logError) {
    console.error(`🚨 [Stripe Webhook Log Error]: Failed to log event ${event.id}:`, logError);
    // If we failed to log, but business logic succeeded, we still return 200.
    // If business logic failed AND logging failed, we're in trouble, but 200 prevents Stripe retry-loops for bugs.
  }

  // Return 200 to Stripe to acknowledge receipt
  return NextResponse.json({ received: true, processed: !processingError });
}
