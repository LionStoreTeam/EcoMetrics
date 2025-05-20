"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

// Asegúrate de tener instalada la librería dotenv si planeas usar variables de entorno en el cliente.
// Sin embargo, para el código del cliente, considera exponer variables a través de Next.js runtimeConfig.
// Para este ejemplo, asumiremos que la variable de entorno está accesible de alguna manera.

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    userType: "INDIVIDUAL",
    cct: "",
    cretmx: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCCT, setShowCCT] = useState(false)
  const [showCRETMX, setShowCRETMX] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [confirmEmailError, setConfirmEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [cctError, setCCTError] = useState<string | null>(null)
  const [cretmxError, setCRETMXError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar errores al cambiar el valor
    if (name === 'name') setNameError(null)
    if (name === 'email') setEmailError(null)
    if (name === 'confirmEmail') setConfirmEmailError(null)
    if (name === 'password') setPasswordError(null)
    if (name === 'confirmPassword') setConfirmPasswordError(null)
    if (name === 'cct') setCCTError(null)
    if (name === 'cretmx') setCRETMXError(null)
  }

  const handleUserTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, userType: value, cct: "", cretmx: "" }))
    setShowCRETMX(value === "SCHOOL" || value === "COMMUNITY" || value === "GOVERNMENT")
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const validateForm = () => {
    let isValid = true

    // Validar Nombre
    if (formData.name.length < 10 || formData.name.length > 50) {
      setNameError("El nombre debe tener entre 10 y 50 caracteres")
      isValid = false
    }

    // Validar Correo
    if (!formData.email) {
      setEmailError("El correo electrónico es obligatorio")
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError("El formato del correo electrónico no es válido")
      isValid = false
    }

    // Validar Confirmar Correo
    if (formData.email !== formData.confirmEmail) {
      setConfirmEmailError("Los correos electrónicos no coinciden")
      isValid = false
    }

    // Validar Contraseña
    if (formData.password.length < 6 || formData.password.length > 100) {
      setPasswordError("La contraseña debe tener entre 6 y 100 caracteres")
      isValid = false
    }

    // Validar Confirmar Contraseña
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden")
      isValid = false
    }

    // Validar el CLAVE DE CENTRO DE TRABAJO (CCT)
    if (formData.userType !== "INDIVIDUAL" && !showCCT && !formData.cct) {
      setCCTError("El Código (CCT) es obligatorio para este tipo de usuario")
      isValid = false
    } else if (formData.userType !== "INDIVIDUAL" && formData.cct.length < 6 || formData.password.length > 30) {
      setCCTError("El código CCT debe tener entre 6 y 30 caracteres")
      isValid = false
    }

    // Validar CRETMX si es necesario
    if (formData.userType !== "INDIVIDUAL" && showCRETMX && !formData.cretmx) {
      setCRETMXError("El Código de Registro es obligatorio para este tipo de usuario")
      isValid = false
    } else if (formData.userType !== "INDIVIDUAL" && showCRETMX && formData.cretmx !== process.env.NEXT_PUBLIC_CRETMX_CODE) {
      setCRETMXError("El Código de Registro es incorrecto")
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
          ...(showCRETMX && { cretmx: formData.cretmx }),
          ...(formData.userType !== "INDIVIDUAL" && { cct: formData.cct }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error("Error al registrarse")
      } else {
        toast.success("Registro exitoso")
        toast.success("Tu cuenta ha sido creada correctamente")

        // Redirigir al dashboard
        router.push("/dashboard")
        router.refresh()
      }

    } catch (error) {
      console.error("Error al registrarse:", error)
      toast.error("Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2">
        <Leaf className="h-6 w-6 text-green-600" />
        <span className="font-bold">EcoTrack MX</span>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>Ingresa tus datos para registrarte en la plataforma</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
            </div>
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
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmEmail">Comprueba tu correo</Label>
              <Input
                id="confirmEmail"
                name="confirmEmail"
                type="email"
                placeholder="Confirma tu correo electrónico"
                value={formData.confirmEmail}
                onChange={handleChange}
                disabled={isLoading}
              />
              {confirmEmailError && <p className="text-red-500 text-sm">{confirmEmailError}</p>}
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña segura"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 top-8 rounded-md p-1 text-gray-500 hover:text-gray-700"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="confirmPassword">Comprueba tu contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 top-8 rounded-md p-1 text-gray-500 hover:text-gray-700"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Tipo de usuario</Label>
              <RadioGroup
                defaultValue={formData.userType}
                onValueChange={handleUserTypeChange}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INDIVIDUAL" id="individual" />
                  <Label htmlFor="individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SCHOOL" id="school" />
                  <Label htmlFor="school">Escuela</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COMMUNITY" id="community" />
                  <Label htmlFor="community">Comunidad</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GOVERNMENT" id="government" />
                  <Label htmlFor="government">Gobierno</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.userType !== "INDIVIDUAL" && (
              <div className="grid gap-2">
                <Label htmlFor="cct">CLAVE DE CENTRO DE TRABAJO (CCT)</Label>
                <Input
                  id="cct"
                  name="cct"
                  placeholder="Ej. 15DTV0001A"
                  value={formData.cct}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {cctError && <p className="text-red-500 text-sm">{cctError}</p>}
              </div>
            )}

            {showCRETMX && (
              <div className="grid gap-2">
                <Label htmlFor="cretmx">Código de Registro (CRETMX)</Label>
                <Input
                  id="cretmx"
                  name="cretmx"
                  placeholder="Ingresa el código proporcionado"
                  value={formData.cretmx}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {cretmxError && <p className="text-red-500 text-sm">{cretmxError}</p>}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
            <div className="text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-green-600 hover:underline">
                Iniciar sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}