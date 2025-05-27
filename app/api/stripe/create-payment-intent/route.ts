// // lionstoreteam/ecometrics/EcoMetrics-9cdd9112192325b6fafd06b5945494aa18f69ba4/app/api/stripe/create-payment-intent/route.ts
// import { NextResponse, type NextRequest } from "next/server";
// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2025-04-30.basil", // Usa la última versión de API disponible
// });

// const PROMOTION_COST_MXN = 50; // 50 MXN
// const PROMOTION_COST_CENTS = PROMOTION_COST_MXN * 100; // Stripe espera el monto en la menor unidad monetaria

// export async function POST(request: NextRequest) {
//   try {
//     // Podrías recibir metadata adicional del negocio si es necesario para el PaymentIntent
//     // const { businessName } = await request.json(); // Ejemplo

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: PROMOTION_COST_CENTS,
//       currency: "mxn",
//       automatic_payment_methods: {
//         enabled: true,
//       },
//       // metadata: {
//       //   businessName: businessName || "Promoción de Negocio EcoMetrics",
//       // }
//       description: "Cargo por promoción de negocio en EcoMetrics",
//     });

//     return NextResponse.json({
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id, // Devolver también el ID para guardarlo después
//     });
//   } catch (error: any) {
//     console.error("Error creando PaymentIntent:", error);
//     return NextResponse.json(
//       { error: "Error al procesar el pago: " + error.message },
//       { status: 500 }
//     );
//   }
// }
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
