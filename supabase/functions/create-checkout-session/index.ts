import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutRequest {
  booking_id: string;
  gear_name: string;
  total_price: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe configuration not available" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody: CheckoutRequest = await req.json();
    const { booking_id, gear_name, total_price } = requestBody;

    if (!booking_id || !total_price) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const params = new URLSearchParams({
      payment_method_types: "card",
      line_items: JSON.stringify([
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: gear_name || "Camera Equipment Rental",
              description: `Booking ID: ${booking_id}`,
            },
            unit_amount: Math.round(total_price * 100),
          },
          quantity: 1,
        },
      ]),
      mode: "payment",
      success_url: `${new URL(req.url).origin}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: new URL(req.url).origin,
      metadata: {
        booking_id,
      },
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      console.error("Stripe error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});