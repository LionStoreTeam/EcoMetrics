import type React from "react"; // Necesario para Suspense
import Link from "next/link";
import LoginForm from "./login-form"; // Importa el nuevo componente cliente
import { Suspense } from "react"; // Importa Suspense
import Image from "next/image";

// Un componente simple para el fallback de Suspense
function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md animate-pulse">
      <div className="space-y-2 text-center">
        <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-300 rounded w-full mx-auto"></div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
        <div className="h-8 bg-green-300 rounded w-full mt-6"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mt-4"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
        <Image src="/logo.png" alt="logo" width={70} height={70} priority />
        <span className="font-bold">EcoMetrics</span>
      </Link>

      {/* Envuelve el componente que usa useSearchParams con Suspense */}
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>

      <footer className="bottom-0 text-center text-xs text-gray-500 w-full px-4 mt-10">
        © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados.
        <div className="mt-1">
          <Link href="/terminos" className="hover:underline">Términos</Link> | <Link href="/privacidad" className="hover:underline">Privacidad</Link>
        </div>
      </footer>
    </div>
  );
}
