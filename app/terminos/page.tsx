import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; //
import { ScrollArea } from '@/components/ui/scroll-area'; //
import { Button } from '@/components/ui/button'; //
import { ChevronLeft } from 'lucide-react';

const LegalPageLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col container h-24 items-center justify-center gap-2 md:flex-row md:justify-between md:h-16">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="EcoMetrics Logo" width={40} height={40} priority />
                    <span className="text-xl font-bold text-gray-800">EcoMetrics</span>
                </Link>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Volver al Inicio
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
            <Card className="w-full max-w-4xl mx-auto shadow-lg">
                <CardHeader className="border-b">
                    <CardTitle className="text-3xl font-bold text-center text-green-700">{title}</CardTitle>
                </CardHeader>
                <CardContent className="py-6 px-4 md:px-8">
                    <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-250px)] pr-4">
                        <div className="prose prose-sm sm:prose-base max-w-none prose-a:text-green-600 hover:prose-a:underline">
                            {children}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </main>
        <footer className="border-t py-6 md:py-8">
            <div className="container text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados. Contacto: <a href="mailto:ecosoporte@ecometricsmx.com" className="hover:underline text-green-600">ecosoporte@ecometricsmx.com</a>
            </div>
        </footer>
    </div>
);


export default function TerminosYCondicionesPage() {
    return (
        <LegalPageLayout title="Términos y Condiciones de Uso">
            <p className="text-sm text-gray-500 mb-4">Última actualización: 30 de mayo de 2025</p>

            <h2>1. Aceptación de los Términos</h2>
            <p>Bienvenido/a a EcoMetrics (en adelante, la "Plataforma"). Estos Términos y Condiciones de Uso (en adelante, los "Términos") rigen el acceso y uso de la Plataforma y todos los servicios ofrecidos a través de ella. Al acceder o utilizar la Plataforma, usted (en adelante, "Usuario") acepta estar sujeto a estos Términos. Si no está de acuerdo con alguna parte de estos Términos, no deberá utilizar la Plataforma.</p>
            <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Le notificaremos los cambios importantes a través de la Plataforma o por correo electrónico. El uso continuado de la Plataforma después de dichas modificaciones constituirá su aceptación de los nuevos Términos.</p>
            <br />
            <h2>2. Descripción del Servicio</h2>
            <p>EcoMetrics es una plataforma web diseñada para promover y gestionar prácticas ambientales sostenibles en escuelas, comunidades y gobiernos locales. Ofrece herramientas para el registro de actividades ecológicas, un sistema de gamificación (puntos, niveles, insignias), contenido educativo, un mapa de centros de acopio, y la posibilidad de que negocios locales promocionen sus productos o servicios sostenibles.</p>
            <br />
            <h2>3. Cuentas de Usuario</h2>
            <p>Para acceder a ciertas funcionalidades de la Plataforma, deberá crear una cuenta. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Se compromete a notificar inmediatamente a EcoMetrics sobre cualquier uso no autorizado de su cuenta.</p>
            <p>La elegibilidad para ciertos tipos de cuenta (Escuela, Comunidad, Gobierno) puede requerir verificación adicional y el cumplimiento de criterios específicos establecidos por EcoMetrics.</p>
            <br />
            <h2>4. Conducta del Usuario</h2>
            <p>El Usuario se compromete a utilizar la Plataforma de manera legal, ética y de acuerdo con estos Términos. Queda prohibido:</p>
            <ul>
                <li>Publicar contenido ilegal, dañino, amenazante, abusivo, difamatorio, obsceno o de cualquier otra forma objetable.</li>
                <li>Suplantar la identidad de cualquier persona o entidad.</li>
                <li>Cargar o transmitir virus, malware o cualquier otro código malicioso.</li>
                <li>Intentar obtener acceso no autorizado a la Plataforma o a las cuentas de otros Usuarios.</li>
                <li>Utilizar la Plataforma para fines comerciales no autorizados explícitamente por EcoMetrics (excepto las funcionalidades de promoción de negocios provistas).</li>
                <li>Proporcionar información falsa o engañosa, especialmente en el registro de actividades o la carga de evidencia.</li>
            </ul>
            <p>EcoMetrics se reserva el derecho de suspender o cancelar cuentas que infrinjan estos Términos.</p>
            <br />
            <h2>5. Contenido del Usuario y Evidencia de Actividades</h2>
            <p>Usted es el único responsable del contenido que publica en la Plataforma, incluyendo la información de las actividades registradas y la evidencia proporcionada (fotos, videos, documentos).</p>
            <p>Al subir contenido, usted otorga a EcoMetrics una licencia mundial, no exclusiva, libre de regalías, transferible y sublicenciable para usar, reproducir, distribuir, preparar trabajos derivados, mostrar y ejecutar dicho contenido en conexión con la Plataforma y los negocios de EcoMetrics (y sus sucesores y afiliados), incluyendo sin limitación para la promoción y redistribución de parte o toda la Plataforma.</p>
            <p>La evidencia de las actividades será revisada por administradores. EcoMetrics se reserva el derecho de rechazar o invalidar actividades si la evidencia no es suficiente, es fraudulenta o no cumple con los criterios establecidos. La asignación de puntos es discrecional de EcoMetrics basada en su sistema de calificación.</p>
            <br />
            <h2>6. Propiedad Intelectual</h2>
            <p>La Plataforma y todo su contenido original, características y funcionalidades (incluyendo, sin limitación, todo el software, texto, gráficos, logotipos, iconos de botones, imágenes, clips de audio y video) son y seguirán siendo propiedad exclusiva de EcoMetrics y sus licenciantes. La Plataforma está protegida por derechos de autor, marcas registradas y otras leyes de México y países extranjeros.</p>
            <br />
            <h2>7. Privacidad</h2>
            <p>Su privacidad es importante para nosotros. Por favor, revise nuestro <Link href="/privacidad">Aviso de Privacidad</Link> para entender cómo recopilamos, usamos y protegemos su información personal.</p>
            <br />
            <h2>8. Sistema de Puntos, Niveles y Recompensas</h2>
            <p>Los puntos, niveles, insignias y recompensas ofrecidos en la Plataforma son parte de un sistema de gamificación diseñado para incentivar la participación. Estos elementos no tienen valor monetario real fuera de la Plataforma y no son transferibles ni canjeables por dinero en efectivo. EcoMetrics se reserva el derecho de modificar, suspender o terminar el sistema de puntos y recompensas en cualquier momento, con o sin previo aviso.</p>
            <br />
            <h2>9. Promoción de Negocios y Productos</h2>
            <p>Los Usuarios o entidades que deseen promocionar sus negocios o productos a través de la Plataforma deben cumplir con los términos específicos para anunciantes, incluyendo el pago de las tarifas correspondientes. EcoMetrics actúa como un intermediario y no se responsabiliza por la calidad, legalidad o veracidad de los productos o servicios promocionados, ni por las transacciones entre Usuarios y anunciantes.</p>
            <p>Todas las promociones están sujetas a revisión y aprobación por parte de EcoMetrics.</p>
            <br />
            <h2>10. Limitación de Responsabilidad</h2>
            <p>En la máxima medida permitida por la ley aplicable, en ningún caso EcoMetrics, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios, datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de (i) su acceso o uso o incapacidad de acceder o usar la Plataforma; (ii) cualquier conducta o contenido de cualquier tercero en la Plataforma; (iii) cualquier contenido obtenido de la Plataforma; y (iv) el acceso no autorizado, uso o alteración de sus transmisiones o contenido, ya sea basado en garantía, contrato, agravio (incluyendo negligencia) o cualquier otra teoría legal, ya sea que hayamos sido informados o no de la posibilidad de dicho daño.</p>
            <br />
            <h2>11. Indemnización</h2>
            <p>Usted acepta defender, indemnizar y eximir de responsabilidad a EcoMetrics y a sus licenciatarios y licenciantes, y a sus empleados, contratistas, agentes, funcionarios y directores, de y contra todas y cada una de las reclamaciones, daños, obligaciones, pérdidas, responsabilidades, costos o deudas, y gastos (incluidos, entre otros, los honorarios de abogados), resultantes o derivados de a) su uso y acceso a la Plataforma, por usted o cualquier persona que utilice su cuenta y contraseña; o b) un incumplimiento de estos Términos.</p>
            <br />
            <h2>12. Ley Aplicable y Jurisdicción</h2>
            <p>Estos Términos se regirán e interpretarán de acuerdo con las leyes de los Estados Unidos Mexicanos, sin tener en cuenta sus disposiciones sobre conflicto de leyes. Para cualquier disputa relacionada con estos Términos, las partes se someten irrevocablemente a la jurisdicción exclusiva de los tribunales competentes en la ciudad de Cuernavaca, Morelos, México.</p>
            <br />
            <h2>13. Contacto</h2>
            <p>Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en: <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a></p>
        </LegalPageLayout>
    );
}