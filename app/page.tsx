"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"
import { BackgroundLines } from "@/components/ui/background-lines"
import { TypeAnimation } from 'react-type-animation';
import Image from "next/image"
import { GlobeDemo } from "@/components/GlobeDemo"
import { motion } from "motion/react"
import HeroBussines from "@/components/home/hero-business"
import { TabsHero } from "@/components/home/TabsHero"
export default function Home() {
  return (
    <div className="home flex flex-col min-h-screen">
      <header className="top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col h-16 items-center justify-between md:flex-row">
          <div className="mt-4 mb-4 flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={70} height={70} priority />
            <span className="text-xl font-bold">EcoMetrics</span>
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
        <motion.span
          initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.1,
            ease: "easeInOut",
          }}
          className=""
        >
          <BackgroundLines>
            <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col justify-center items-center lg:flex-row gap-3 lg:mx-10 lg:gap-5">
                  <div className="space-y-4 lg:mx-10">
                    <h1 className="mx-auto max-w-full text-start text-2xl font-bold text-slate-800 md:text-4xl lg:text-6xl">
                      EcoMetrics
                      <br />
                      Gestión y Educación Ambiental Comunitaria
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Una plataforma para que ciudadanos, escuelas, comunidades y gobiernos locales lleven un seguimiento y educación
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
                          'EcoMetrics',
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
          {/* Hero Tabs */}
          <section className="p-10">
            <h1 className="mx-auto max-w-full text-center text-2xl font-bold text-slate-800 md:text-4xl lg:text-6xl">
              ¿Cómo Funciona EcoMetrics?
            </h1>
            <TabsHero />
          </section>
          {/* Hero Bussines */}
          <HeroBussines />
          {/* Global */}
          <GlobeDemo />
        </motion.span>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 EcoMetrics. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/terminos" className="text-sm text-muted-foreground hover:underline">
              Términos
            </Link>
            <Link href="/privacidad" className="text-sm text-muted-foreground hover:underline">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

