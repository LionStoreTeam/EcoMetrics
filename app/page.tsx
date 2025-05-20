"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"
import { BackgroundLines } from "@/components/ui/background-lines"
import { TypeAnimation } from 'react-type-animation';
import Image from "next/image"
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col h-16 items-center justify-between md:flex-row">
          <div className="mt-4 mb-4 flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">EcoTrack MX</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 mt-10 md:mt-0">
        <BackgroundLines>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:from-green-950/20 dark:to-background">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col justify-center items-center lg:flex-row gap-3 lg:mx-10 lg:gap-5">
                <div className="space-y-4 lg:mx-10">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Eco Track MX - Gestión y educación ambiental comunitaria
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Una plataforma para que escuelas, comunidades y gobiernos locales lleven un seguimiento y educación
                    sobre hábitos ambientales sostenibles.
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row font-semibold text-[#53c932]">
                    <TypeAnimation
                      sequence={[
                        // Same substring at the start will only be typed out once, initially
                        'Inicia Sesión',
                        1000, // wait 1s before replacing "Mice" with "Hamsters"
                        'Registrate',
                        1000,
                        'EcoTrack MX',
                        1000,
                      ]}
                      wrapper="span"
                      speed={50}
                      style={{ fontSize: '2em', display: 'inline-block' }}
                      repeat={Infinity}
                    />
                  </div>
                </div>


                <div className="mt-16 w-[320px] sm:w-[500px] md:w-[600px] lg:w-[900px] lg:mt-0 xl:w-[1200px]">
                  <Image src="/hero.svg" alt="hero" width={1000} height={1000} priority className="animate-heartbeat" />
                </div>
              </div>
            </div>
          </section>
        </BackgroundLines>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">¿Cómo funciona?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Registra tus actividades ecológicas, gana puntos y contribuye a un futuro más sostenible.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Registra actividades</h3>
                <p className="text-center text-muted-foreground">
                  Documenta tus acciones ecológicas como reciclaje, ahorro de agua o plantación de árboles.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" x2="9.01" y1="9" y2="9" />
                    <line x1="15" x2="15.01" y1="9" y2="9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Gana puntos</h3>
                <p className="text-center text-muted-foreground">
                  Acumula puntos por cada actividad que registres y sube de nivel.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Obtén recompensas</h3>
                <p className="text-center text-muted-foreground">
                  Canjea tus puntos por beneficios locales, descuentos y reconocimientos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 EcoTrack MX. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/terminos" className="text-sm text-muted-foreground hover:underline">
              Términos
            </Link>
            <Link href="/privacidad" className="text-sm text-muted-foreground hover:underline">
              Privacidad
            </Link>
            <Link href="/contacto" className="text-sm text-muted-foreground hover:underline">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
