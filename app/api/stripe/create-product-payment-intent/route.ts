// app/api/stripe/create-product-payment-intent/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

const PRODUCT_PROMOTION_AMOUNT_MXN = 3000; // 30.00 MXN en centavos

export async function POST(request: Request) {
  try {
    // Podrías recibir el ID del producto o nombre si quieres asociarlo al PaymentIntent en metadata
    // const { productId, productName } = await request.json(); // Opcional

    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRODUCT_PROMOTION_AMOUNT_MXN,
      currency: "mxn",
      automatic_payment_methods: {
        enabled: true,
      },
      description: "Pago por promoción de producto en EcoMetrics",
      metadata: {
        service: "Promociona tu Producto",
        // productId: productId || undefined, // Opcional
        // productName: productName || undefined, // Opcional
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error al crear PaymentIntent para producto:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: `Error al crear la intención de pago para el producto: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
