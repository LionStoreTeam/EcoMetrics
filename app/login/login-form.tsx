"use client";

import type React from "react"; // Asegúrate de importar React si usas tipos de React
import { useState, Suspense } from "react"; // Suspense no es necesario aquí, sino en el que lo llama
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Este hook es el que requiere Suspense en el componente padre
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const callbackUrlLoginFailed = searchParams.get("callbackUrl") || "/login"; // Considera si esto debería ser siempre /login

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error("Correo electrónico y contraseña son obligatorios");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Los datos ingresados son incorrectos"); // Usar el mensaje de error de la API si está disponible
                // No redirigir aquí si la URL de callback es la misma página de login,
                // podría causar un bucle si el error persiste.
                // router.push(callbackUrlLoginFailed); 
            } else {
                toast.success("Bienvenido");
                router.push(callbackUrl);
            }
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            toast.error("Error al iniciar sesión. Intenta de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
                <CardDescription>Ingresa tus credenciales para acceder a la plataforma</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@ejemplo.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Tu contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 px-3 flex items-center focus:outline-none text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <Link href="/recuperar-password" /* Idealmente, esta ruta también debería usar Suspense si usa useSearchParams */ className="text-sm text-green-600 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando sesión...</> : "Iniciar sesión"}
                    </Button>
                    <div className="text-center text-sm">
                        ¿No tienes una cuenta?{" "}
                        <Link href="/registro" className="text-green-600 hover:underline">
                            Registrarse
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
