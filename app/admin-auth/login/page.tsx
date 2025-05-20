"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validaciones básicas
        if (!formData.email || !formData.password) {
            toast.error("Todos los campos son obligatorios")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al iniciar sesión")
            } else {
                toast.success("Inicio de sesión exitoso")
                toast.success("Bienvenido al panel de administración")
                // Redirigir al panel de administración
                router.push("/admin")
                router.refresh()
            }

        } catch (error) {
            console.error("Error al iniciar sesión:", error)
            toast.error("Los datos ingresados son incorrectos")
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
                    <CardTitle className="text-2xl">Acceso de Administrador</CardTitle>
                    <CardDescription>Inicia sesión para acceder al panel de administración de EcoTrack MX</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link href="/admin-auth/recuperar" className="text-xs text-green-600 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm">
                        ¿No tienes una cuenta de administrador?{" "}
                        <Link href="/admin-auth/registro" className="text-green-600 hover:underline">
                            Registrarse
                        </Link>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                        Este portal es exclusivo para administradores del sistema
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
