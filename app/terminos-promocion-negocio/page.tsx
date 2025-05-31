import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Briefcase } from 'lucide-react';

// Layout similar al de las otras páginas legales
const LegalPageLayout = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: React.ElementType }) => (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col container h-24 items-center justify-center gap-2 md:flex-row md:justify-between md:h-16">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="EcoMetrics Logo" width={40} height={40} priority />
                    <span className="text-xl font-bold text-gray-800">EcoMetrics</span>
                </Link>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/promociona-tu-negocio">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Volver a Promocionar Negocio
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
            <Card className="w-full max-w-4xl mx-auto shadow-lg">
                <CardHeader className="border-b">
                    <div className="flex flex-col items-center text-center">
                        {Icon && <Icon className="h-10 w-10 text-green-600 mb-3" />}
                        <CardTitle className="text-3xl font-bold text-green-700">{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="py-6 px-4 md:px-8">
                    <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-280px)] pr-4">
                        <div className="prose prose-sm sm:prose-base max-w-none">
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

export default function TerminosPromocionNegocioPage() {
    return (
        <LegalPageLayout title="Términos y Condiciones para Promoción de Negocios" icon={Briefcase}>
            <p className="text-sm text-gray-500">Última actualización: 30 de mayo de 2025</p>

            <h2>1. Introducción y Aceptación</h2>
            <p>Estos Términos y Condiciones para la Promoción de Negocios ("Términos de Promoción de Negocio") complementan los <Link href="/terminos">Términos y Condiciones Generales</Link> de EcoMetrics y rigen el uso del servicio de promoción de negocios ("Servicio de Promoción") ofrecido en nuestra Plataforma. Al enviar una solicitud para promocionar su negocio, usted ("Anunciante") acepta estar sujeto a estos Términos de Promoción de Negocio y a los Términos y Condiciones Generales.</p>
            <br />
            <h2>2. Elegibilidad del Negocio</h2>
            <p>Para ser elegible para el Servicio de Promoción, su negocio debe:</p>
            <ul>
                <li>Estar legalmente constituido y operar de acuerdo con las leyes mexicanas.</li>
                <li>Ofrecer productos, servicios o iniciativas que estén alineados con los valores de sostenibilidad y protección ambiental promovidos por EcoMetrics.</li>
                <li>Proporcionar información veraz y completa durante el proceso de solicitud.</li>
            </ul>
            <p>EcoMetrics se reserva el derecho de determinar la elegibilidad a su entera discreción.</p>
            <br />
            <h2>3. Proceso de Solicitud y Contenido</h2>
            <p>El Anunciante debe completar el formulario de solicitud disponible en la página "Promociona tu Negocio", proporcionando toda la información requerida, incluyendo nombre del negocio, descripción, tipo, dirección, información de contacto y, opcionalmente, un logo.</p>
            <p>El Anunciante es el único responsable de la exactitud, legalidad y adecuación de toda la información y materiales proporcionados, incluyendo el logo. El contenido de la promoción no debe:</p>
            <ul>
                <li>Ser falso, engañoso o fraudulento.</li>
                <li>Infringir derechos de propiedad intelectual de terceros.</li>
                <li>Ser difamatorio, obsceno o ilegal.</li>
                <li>Promover actividades ilegales o contrarias a los principios de sostenibilidad.</li>
            </ul>
            <p>EcoMetrics se reserva el derecho de rechazar o remover cualquier promoción que no cumpla con estos criterios, a su entera discreción y sin previo aviso.</p>
            <br />
            <h2>4. Revisión y Aprobación</h2>
            <p>Todas las solicitudes de promoción están sujetas a un proceso de revisión y aprobación por parte del equipo de EcoMetrics. Nos reservamos el derecho de aprobar o rechazar cualquier solicitud sin necesidad de justificación. El proceso de revisión puede tomar algunos días hábiles. Posterior a ello la promoción de su negocio se verá reflejada en la Plataforma.</p>
            <br />
            <h2>5. Pago del Servicio</h2>
            <p>La publicación de una promoción de negocio en EcoMetrics tiene un costo de $50.00 MXN (Cincuenta pesos 00/100 Moneda Nacional). Este pago se realiza a través de nuestro proveedor de servicios de pago Stripe.</p>
            <p>El pago debe completarse para que la solicitud sea considerada para revisión y publicación. Una vez que una promoción ha sido aprobada y publicada, la tarifa de promoción no es reembolsable, salvo que EcoMetrics decida lo contrario en circunstancias excepcionales.</p>
            <p>EcoMetrics no almacena la información completa de su tarjeta de crédito o débito. Todas las transacciones son procesadas de forma segura por Stripe.</p>
            <br />
            <h2>6. Duración de la Promoción</h2>
            <p>Salvo que se especifique lo contrario, las promociones de negocios aprobadas y publicadas permanecerán visibles en la Plataforma por un período indefinido, sujeto a la continuidad del Servicio de Promoción y al cumplimiento de estos Términos por parte del Anunciante. EcoMetrics se reserva el derecho de modificar la duración o remover promociones si lo considera necesario.</p>
            <br />
            <h2>7. Responsabilidad del Anunciante</h2>
            <p>El Anunciante es el único responsable de los productos, servicios, ofertas y la información proporcionada en su promoción. EcoMetrics actúa únicamente como una plataforma para la difusión de estas promociones y no respalda, garantiza ni se responsabiliza por la calidad, seguridad, legalidad o cualquier otro aspecto de los negocios promocionados o sus ofertas.</p>
            <p>Cualquier transacción, acuerdo o disputa entre un Usuario de EcoMetrics y un Anunciante es responsabilidad exclusiva de dichas partes. El Anunciante se compromete a indemnizar y eximir de responsabilidad a EcoMetrics por cualquier reclamación derivada de su promoción o de los productos/servicios ofrecidos.</p>
            <br />
            <h2>8. Uso de Datos del Negocio</h2>
            <p>Al enviar una solicitud de promoción, el Anunciante otorga a EcoMetrics el derecho de utilizar la información y el logo proporcionados con el fin de mostrar la promoción en la Plataforma y en materiales de marketing relacionados con EcoMetrics. El tratamiento de cualquier dato personal asociado se rige por nuestro <Link href="/privacidad">Aviso de Privacidad</Link>.</p>
            <br />
            <h2>9. Modificación y Terminación</h2>
            <p>EcoMetrics se reserva el derecho de modificar o descontinuar el Servicio de Promoción, o cualquier parte del mismo, con o sin previo aviso. También nos reservamos el derecho de remover o suspender cualquier promoción que viole estos Términos o que consideremos inapropiada.</p>
            <p>El Anunciante puede solicitar la eliminación de su promoción contactando a <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>. La eliminación se procesará en un tiempo razonable.</p>
            <br />
            <h2>10. Contacto</h2>
            <p>Para cualquier duda o aclaración sobre estos Términos de Promoción de Negocio, por favor contáctenos a través de <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>.</p>
        </LegalPageLayout>
    );
}