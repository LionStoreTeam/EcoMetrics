// app/api/stripe/create-payment-intent/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil", // Asegúrate de usar una versión de API compatible
});

const PROMOTION_AMOUNT_MXN = 5000; // 50.00 MXN en centavos

export async function POST(request: Request) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PROMOTION_AMOUNT_MXN,
      currency: "mxn",
      automatic_payment_methods: {
        enabled: true,
      },
      description: "Pago por promoción de negocio en EcoMetrics",
      metadata: {
        service: "Promociona tu Negocio",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error al crear PaymentIntent:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al crear la intención de pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
