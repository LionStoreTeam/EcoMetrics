import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const HeroBussines = () => {
    return (



        <section className="w-full py-12 md:py-24 px-5 md:px-10 xl:px-0">
            <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
                <Navbar />
                <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80">
                    <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
                </div>
                <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80">
                    <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80">
                    <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                </div>
                <div className="px-4 py-10 md:py-20">
                    {/* View Bussines-Products */}
                    <h1 className="relative z-10 mx-auto max-w-full text-center text-2xl font-bold text-slate-800 md:text-4xl lg:text-6xl">
                        {"Encuentra Cientos de Productos y Negocios Sostenibles con EcoMetrics."
                            .split(" ")
                            .map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.1,
                                        ease: "easeInOut",
                                    }}
                                    className="mr-2 inline-block"
                                >
                                    {word}
                                </motion.span>
                            ))}
                    </h1>
                    <motion.p
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: 0.8,
                        }}
                        className="relative z-10 mx-auto max-w-2xl py-4 text-center text-lg font-normal text-neutral-600"
                    >
                        <span className="text-[20px] lg:text-[25px] text-slate-500">
                            Descubre increibles Productos, Servicios, Negocios y mucho más cerca de tu localidad con EcoMetrics.
                        </span>
                        <br />
                    </motion.p>
                    <motion.div
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: 1,
                        }}
                        className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
                    >
                        <Link href="/negocios-disponibles" className="text-center w-60 transform rounded-lg bg-white border-2 border-green-700 px-6 py-2 font-medium text-green-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:text-white">
                            Ver Negocios
                        </Link>
                        <Link href="/productos-disponibles" className="text-center w-60 transform rounded-lg bg-white border-2 border-cyan-500 px-6 py-2 font-medium text-cyan-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-500 hover:text-white">
                            Ver Productos
                        </Link>
                    </motion.div>
                    {/* Pomotion Bussines-Products */}
                    <h1 className="mt-16 relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-800 md:text-4xl lg:text-6xl">
                        {"Promociona tu Producto o Negocio con EcoMetrics."
                            .split(" ")
                            .map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.1,
                                        ease: "easeInOut",
                                    }}
                                    className="mr-2 inline-block"
                                >
                                    {word}
                                </motion.span>
                            ))}
                    </h1>
                    <motion.p
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: 0.8,
                        }}
                        className="relative z-10 mx-auto max-w-2xl py-4 text-center text-lg font-normal text-neutral-600"
                    >
                        <span className="text-[20px] lg:text-[25px] text-slate-500">
                            No necesitas tener una cuenta en EcoMetrics para publicar tu negocio o producto. Aumenta tus ventas y tus ingresos llegando a nuevos clientes a través de nuestra plataforma.
                        </span>
                    </motion.p>
                    <motion.div
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: 1,
                        }}
                        className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
                    >
                        <Link href="/promociona-tu-negocio" className="text-center w-60 transform rounded-lg bg-green-600 hover:bg-green-700 px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5">
                            Publicar Negocio
                        </Link>
                        <Link href="/promociona-tu-producto" className="text-center w-60 transform rounded-lg bg-cyan-500 hover:bg-cyan-600 px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5">
                            Publicar Producto
                        </Link>
                    </motion.div>
                    <motion.div
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: 1,
                        }}
                    >
                        <span className="mt-5 text-[12px] text-slate-300 flex flex-col w-full text-center items-center justify-center">
                            <a href="/terminos-promocion-negocio" className="transition-all ease-linear duration-300 hover:text-green-600">
                                Terminos y Condiciones para promocionar un Negocio.
                            </a>
                            <a href="/terminos-promocion-producto" className="transition-all ease-linear duration-300 hover:text-cyan-500">
                                Terminos y Condiciones para promocionar un Producto.
                            </a>
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: 1.2,
                        }}
                        className="relative z-10 mt-20 rounded-3xl border-8 border-blue-950 p-4 shadow-md"
                    >
                        <div className="w-full overflow-hidden rounded-xl border border-gray-300">
                            <Image
                                src="/artboard2.png"
                                alt="Landing page preview"
                                className="aspect-[16/9] h-auto w-full object-cover"
                                height={1000}
                                width={1000}
                                priority
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
export default HeroBussines;

const Navbar = () => {
    return (
        <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4">
            <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="logo" width={70} height={70} priority />
                <h1 className="text-base font-bold md:text-2xl">Bussines</h1>
            </div>
            {/* <button className="w-24 transform rounded-lg bg-green-600 hover:bg-green-700 px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 md:w-32">
        Login
      </button> */}
        </nav>
    );
};