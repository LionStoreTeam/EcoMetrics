import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; //
import { ScrollArea } from '@/components/ui/scroll-area'; //
import { Button } from '@/components/ui/button'; //
import { ChevronLeft } from 'lucide-react';

// Reutilizamos el layout de la página de Términos y Condiciones
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
                        <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-green-700 prose-a:text-green-600 hover:prose-a:underline">
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

export default function AvisoDePrivacidadPage() {
    return (
        <LegalPageLayout title="Aviso de Privacidad">
            <p className="text-sm text-gray-500 mb-4">Fecha de última actualización: 30 de mayo de 2025</p>

            <h2>I. Identidad y Domicilio del Responsable</h2>
            <p>EcoMetrics (Plataforma Digital), en adelante "EcoMetrics" o "Nosotros", correo electrónico de contacto <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>, es el responsable del tratamiento de sus datos personales de conformidad con lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás normativa aplicable.</p>

            <h2>II. Datos Personales que Recabamos</h2>
            <p>EcoMetrics podrá recabar los siguientes datos personales de los Usuarios:</p>
            <ul>
                <li><strong>Datos de identificación:</strong> Nombre completo, correo electrónico, contraseña (encriptada).</li>
                <li><strong>Datos de perfil (opcionales):</strong> Biografía, dirección, ciudad, estado, código postal, teléfono, fotografía de perfil (avatar).</li>
                <li><strong>Datos de uso de la plataforma:</strong> Actividades ecológicas registradas (título, descripción, tipo, cantidad, unidad, fecha), evidencia de actividades (fotografías, videos, documentos que usted decida subir), puntos obtenidos, nivel alcanzado, insignias obtenidas, interacciones con contenido educativo (valoraciones).</li>
                <li><strong>Datos de contacto y ubicación (para promoción de negocios/productos):</strong> Nombre del negocio, logo, descripción del negocio/producto, tipo de negocio, dirección física, ciudad, estado, código postal, teléfono, correo electrónico de contacto, sitio web, coordenadas geográficas (latitud y longitud), horarios de atención, enlaces a redes sociales.</li>
                <li><strong>Datos de pago (para promoción de negocios/productos):</strong> Información relacionada con la transacción de pago procesada a través de nuestro proveedor externo (Stripe), como el ID de la transacción y estado del pago. EcoMetrics no almacena directamente los datos completos de su tarjeta de crédito o débito.</li>
                <li><strong>Datos técnicos y de navegación:</strong> Dirección IP, tipo de navegador, sistema operativo, páginas visitadas dentro de la Plataforma, tiempo de permanencia, e información recopilada a través de cookies y tecnologías similares (ver sección correspondiente).</li>
            </ul>
            <p>No recabamos datos personales sensibles de forma predeterminada.</p>

            <h2>III. Finalidades del Tratamiento de sus Datos Personales</h2>
            <p>Los datos personales que recabamos serán utilizados para las siguientes finalidades:</p>
            <p><strong>A. Finalidades Primarias (necesarias para el servicio):</strong></p>
            <ul>
                <li>Identificarlo y registrarlo como Usuario en la Plataforma.</li>
                <li>Gestionar su cuenta y perfil de Usuario.</li>
                <li>Permitirle registrar sus actividades ambientales y la evidencia correspondiente.</li>
                <li>Operar el sistema de gamificación (asignación de puntos, niveles e insignias).</li>
                <li>Mostrar su progreso y el de otros usuarios en tablas de clasificación (scores).</li>
                <li>Permitirle acceder y participar en el contenido educativo y valorarlo.</li>
                <li>Mostrar el mapa de centros de acopio.</li>
                <li>Procesar y gestionar las solicitudes de promoción de negocios y productos, incluyendo la verificación de pagos.</li>
                <li>Brindarle soporte técnico y atender sus consultas.</li>
                <li>Cumplir con obligaciones legales y requerimientos de autoridades competentes.</li>
                <li>Garantizar la seguridad de la Plataforma y prevenir fraudes.</li>
            </ul>
            <p><strong>B. Finalidades Secundarias (requieren su consentimiento, el cual puede revocar):</strong></p>
            <ul>
                <li>Enviarle notificaciones sobre novedades, actualizaciones o eventos relacionados con EcoMetrics (distintas a las notificaciones transaccionales o de sistema).</li>
                <li>Realizar encuestas de satisfacción y estudios para mejorar nuestros servicios.</li>
                <li>Generar estadísticas agregadas y anonimizadas para análisis interno y para mostrar tendencias ambientales a la comunidad.</li>
            </ul>
            <p>Usted podrá manifestar su negativa para el tratamiento de sus datos personales para las finalidades secundarias enviando un correo a <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>.</p>

            <h2>IV. Transferencia de Datos Personales</h2>
            <p>EcoMetrics podrá transferir sus datos personales, sin requerir su consentimiento, en los siguientes casos:</p>
            <ul>
                <li>A autoridades competentes en los casos legalmente previstos.</li>
                <li>A sociedades controladoras, subsidiarias o afiliadas bajo el control común de EcoMetrics, o a una sociedad matriz o a cualquier sociedad del mismo grupo del responsable que opere bajo los mismos procesos y políticas internas (si aplica).</li>
                <li>A terceros proveedores de servicios necesarios para el cumplimiento de las finalidades descritas en este Aviso (ej. proveedores de servicios de hosting como AWS S3 para almacenamiento de evidencia y archivos, procesadores de pago como Stripe para las promociones). Estos terceros están obligados contractualmente a mantener la confidencialidad y seguridad de sus datos personales y a no utilizarlos para fines distintos a los establecidos.</li>
            </ul>
            <p>Fuera de estos casos, EcoMetrics no transferirá sus datos personales a terceros sin su consentimiento previo, salvo las excepciones previstas en la LFPDPPP.</p>

            <h2>V. Derechos ARCO y Revocación del Consentimiento</h2>
            <p>Usted tiene derecho a Acceder a sus datos personales que poseemos y a los detalles del tratamiento de los mismos, así como a Rectificarlos en caso de ser inexactos o incompletos; Cancelarlos cuando considere que no se requieren para alguna de las finalidades señaladas, estén siendo utilizados para finalidades no consentidas o haya finalizado la relación contractual o de servicio; u Oponerse al tratamiento de los mismos para fines específicos (Derechos ARCO).</p>
            <p>Asimismo, usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el tratamiento de sus datos personales. Sin embargo, es importante que tenga en cuenta que no en todos los casos podremos atender su solicitud o concluir el uso de forma inmediata, ya que es posible que por alguna obligación legal requiramos seguir tratando sus datos personales.</p>
            <p>Para el ejercicio de cualquiera de los Derechos ARCO o la revocación del consentimiento, deberá presentar la solicitud respectiva a través del correo electrónico <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>, acompañando la información y documentación que acredite su identidad o, en su caso, la representación legal del titular.</p>

            <h2>VI. Uso de Cookies y Tecnologías Similares</h2>
            <p>EcoMetrics utiliza cookies y otras tecnologías de seguimiento para mejorar su experiencia en la Plataforma, recordar sus preferencias, analizar el tráfico y para fines de seguridad. Puede consultar nuestra Política de Cookies (si aplica) para obtener más información sobre las cookies que utilizamos y cómo puede gestionarlas.</p>

            <h2>VII. Medidas de Seguridad</h2>
            <p>EcoMetrics ha implementado medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado. Estas medidas incluyen el uso de contraseñas seguras, encriptación de información sensible (como contraseñas) y acceso restringido a la información personal.</p>

            <h2>VIII. Cambios al Aviso de Privacidad</h2>
            <p>El presente Aviso de Privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales; de nuestras propias necesidades por los productos o servicios que ofrecemos; de nuestras prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas.</p>
            <p>Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente Aviso de Privacidad, a través de la Plataforma o mediante notificación por correo electrónico. La versión actualizada estará siempre disponible en nuestra Plataforma.</p>

            <h2>IX. Consentimiento</h2>
            <p>Al utilizar la Plataforma EcoMetrics, usted consiente el tratamiento de sus datos personales de acuerdo con los términos y condiciones establecidos en el presente Aviso de Privacidad.</p>

            <h2>X. Contacto</h2>
            <p>Si tiene alguna duda o comentario respecto al tratamiento de sus datos personales, puede contactarnos a través de nuestro correo electrónico: <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>.</p>
        </LegalPageLayout>
    );
}