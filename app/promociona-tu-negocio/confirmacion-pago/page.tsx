// app/promociona-tu-negocio/confirmacion-pago/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; //
import toast from 'react-hot-toast';
import Stripe from 'stripe'; // Necesario para el tipo PaymentIntent
import Image from 'next/image';

// Carga Stripe.js de forma asíncrona
const stripePromise = import('@stripe/stripe-js').then(module => module.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""));


export default function PaymentConfirmationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error" | "requires_action">("loading");
    const [message, setMessage] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

    useEffect(() => {
        const clientSecret = searchParams.get('payment_intent_client_secret');
        const pi_id = searchParams.get('payment_intent');
        setPaymentIntentId(pi_id);

        if (!clientSecret || !pi_id) {
            setStatus("error");
            setMessage("Parámetros de pago inválidos o faltantes.");
            toast.error("No se pudo procesar la confirmación del pago.");
            return;
        }

        stripePromise.then(stripe => {
            if (!stripe) {
                setStatus("error");
                setMessage("Error al cargar Stripe. Intenta de nuevo.");
                toast.error("Error al cargar Stripe.");
                return;
            }

            stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent, error }) => {
                if (error) {
                    setStatus("error");
                    setMessage(error.message || "Error al recuperar la intención de pago.");
                    toast.error(error.message || "Error al verificar el pago.");
                    return;
                }

                if (!paymentIntent) {
                    setStatus("error");
                    setMessage("No se pudo encontrar la intención de pago.");
                    toast.error("Intención de pago no encontrada.");
                    return;
                }

                switch (paymentIntent.status) {
                    case 'succeeded':
                        setStatus("success");
                        setMessage('¡Pago confirmado! Tu solicitud de promoción se está procesando.');
                        // Aquí es donde idealmente ya habrías enviado el formulario
                        // y solo estarías mostrando un mensaje de éxito final.
                        // Si el envío del formulario se hace *después* de esta página (no recomendado),
                        // necesitarías lógica adicional.
                        // Por ahora, asumimos que el formulario ya se envió en la página anterior tras la confirmación client-side.
                        toast.success("Pago confirmado exitosamente.");
                        // Podrías redirigir a una página de "gracias" o de vuelta al home.
                        // router.push("/promociona-tu-negocio/gracias?payment_intent_id=" + pi_id);
                        break;
                    case 'processing':
                        setStatus("loading");
                        setMessage('Tu pago se está procesando. Te notificaremos cuando se complete.');
                        toast.loading("Pago en procesamiento...");
                        break;
                    case 'requires_payment_method':
                        setStatus("error");
                        setMessage('Pago fallido. Por favor, intenta con otro método de pago.');
                        toast.error("Pago fallido. Intenta de nuevo.");
                        break;
                    case 'requires_action':
                        setStatus("requires_action");
                        setMessage('Se requiere acción adicional para completar el pago.');
                        toast.error("Acción adicional requerida para el pago.");
                        break;
                    default:
                        setStatus("error");
                        setMessage('Algo salió mal con el pago. Estado: ' + paymentIntent.status);
                        toast.error('Error en el pago. Estado: ' + paymentIntent.status);
                        break;
                }
            });
        });
    }, [searchParams, router]);

    const renderContent = () => {
        switch (status) {
            case "loading":
                return (
                    <div className="flex flex-col items-center text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
                        <p className="text-lg font-medium">Verificando estado del pago...</p>
                        <p className="text-sm text-gray-500">{message || "Por favor, espera."}</p>
                    </div>
                );
            case "success":
                return (
                    <div className="flex flex-col items-center text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <CardTitle className="text-2xl mb-2">¡Pago Exitoso!</CardTitle>
                        <CardDescription>{message || "Tu pago ha sido confirmado."}</CardDescription>
                        {paymentIntentId && <p className="text-xs text-gray-400 mt-2">ID de Transacción: {paymentIntentId}</p>}
                        <Button asChild className="mt-6 bg-green-600 hover:bg-green-700">
                            <Link href="/promociona-tu-negocio">Enviar otra promoción</Link>
                        </Button>
                        <Button asChild variant="link" className="mt-2">
                            <Link href="/">Volver al inicio</Link>
                        </Button>
                    </div>
                );
            case "requires_action":
                return (
                    <div className="flex flex-col items-center text-center">
                        <Loader2 className="h-16 w-16 text-yellow-500 mb-4 animate-pulse" />
                        <CardTitle className="text-2xl mb-2">Acción Requerida</CardTitle>
                        <CardDescription>{message || "Tu banco puede requerir autenticación adicional."}</CardDescription>
                        <p className="text-xs text-gray-500 mt-2">Sigue las instrucciones de tu banco. Si la ventana emergente no aparece, intenta de nuevo el pago o contacta a tu banco.</p>
                        <Button asChild className="mt-6">
                            <Link href="/promociona-tu-negocio">Volver al formulario</Link>
                        </Button>
                    </div>
                );
            case "error":
            default:
                return (
                    <div className="flex flex-col items-center text-center">
                        <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        <CardTitle className="text-2xl mb-2">Error en el Pago</CardTitle>
                        <CardDescription>{message || "No se pudo completar el pago."}</CardDescription>
                        {paymentIntentId && <p className="text-xs text-gray-400 mt-2">Intento de Pago ID: {paymentIntentId}</p>}
                        <Button asChild className="mt-6">
                            <Link href="/promociona-tu-negocio">Intentar de nuevo</Link>
                        </Button>
                    </div>
                );
        }
    };
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <header className="absolute top-8 left-8">
                <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
                    <Image src="/logo.png" alt="EcoMetrics Logo" width={50} height={50} priority />
                    <span className="text-xl font-bold">EcoMetrics</span>
                </Link>
            </header>
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader />
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
            <footer className="absolute bottom-8 text-center text-xs text-gray-500 w-full px-4">
                © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados.
            </footer>
        </div>
    );
}