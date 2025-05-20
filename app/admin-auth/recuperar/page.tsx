"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function AdminRecuperarPage() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast({
                title: "Error",
                description: "Por favor, ingresa tu correo electrónico",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            // En una implementación real, aquí enviarías una solicitud a la API
            // para enviar un correo de recuperación de contraseña

            // Simulamos un retraso para mostrar el estado de carga
            await new Promise((resolve) => setTimeout(resolve, 1500))

            setSubmitted(true)

            toast({
                title: "Solicitud enviada",
                description:
                    "Si tu correo está registrado como administrador, recibirás instrucciones para restablecer tu contraseña",
            })
        } catch (error) {
            console.error("Error al solicitar recuperación:", error)
            toast({
                title: "Error",
                description: "No se pudo procesar tu solicitud. Inténtalo de nuevo más tarde.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <div className="absolute top-8 flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold">EcoTrack MX</span>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
                    <CardDescription>Ingresa tu correo electrónico para recibir instrucciones de recuperación</CardDescription>
                </CardHeader>
                <CardContent>
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? "Enviando..." : "Enviar instrucciones"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4 text-center">
                            <p className="text-sm">
                                Hemos enviado instrucciones para restablecer tu contraseña al correo electrónico proporcionado, si está
                                registrado como administrador.
                            </p>
                            <p className="text-sm">
                                Por favor, revisa tu bandeja de entrada y sigue las instrucciones para completar el proceso.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-center text-sm">
                        <Link href="/admin-auth/login" className="text-green-600 hover:underline">
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
