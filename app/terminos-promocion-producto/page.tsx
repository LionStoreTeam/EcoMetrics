import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Package } from 'lucide-react';

// Layout similar al de las otras páginas legales
const LegalPageLayout = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: React.ElementType }) => (
    <div className="flex flex-col min-h-screen bg-gray-50 ">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col container h-24 items-center justify-center gap-2 md:flex-row md:justify-between md:h-16">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="EcoMetrics Logo" width={40} height={40} priority />
                    <span className="text-xl font-bold text-gray-800">EcoMetrics</span>
                </Link>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/promociona-tu-producto">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Volver a Promocionar Producto
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
            <Card className="w-full max-w-4xl mx-auto shadow-lg">
                <CardHeader className="border-b">
                    <div className="flex flex-col items-center text-center">
                        {Icon && <Icon className="h-10 w-10 text-sky-600 mb-3" />}
                        <CardTitle className="text-3xl font-bold text-sky-700">{title}</CardTitle>
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
                © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados. Contacto: <a href="mailto:ecosoporte@ecometricsmx.com" className="hover:underline text-sky-600">ecosoporte@ecometricsmx.com</a>
            </div>
        </footer>
    </div>
);

export default function TerminosPromocionProductoPage() {
    return (
        <LegalPageLayout title="Términos y Condiciones para Promoción de Productos/Servicios" icon={Package}>
            <p className="text-sm text-gray-500">Última actualización: 30 de mayo de 2025</p>

            <h2>1. Introducción y Aceptación</h2>
            <p>Estos Términos y Condiciones para la Promoción de Productos/Servicios ("Términos de Promoción de Producto") complementan los <Link href="/terminos">Términos y Condiciones Generales</Link> de EcoMetrics y rigen el uso del servicio de promoción de productos o servicios específicos ("Servicio de Promoción de Producto") ofrecido en nuestra Plataforma. Al enviar una solicitud para promocionar su producto/servicio, usted ("Anunciante") acepta estar sujeto a estos Términos de Promoción de Producto y a los Términos y Condiciones Generales.</p>
            <br />
            <h2>2. Elegibilidad</h2>
            <p>Para ser elegible para el Servicio de Promoción de Producto, el Anunciante y el producto/servicio deben cumplir con lo siguiente:</p>
            <ul>
                <li>El Anunciante debe ser un negocio o emprendedor que ofrece productos o servicios.</li>
                <li>Los productos o servicios promocionados deben tener un componente de sostenibilidad, ser ecológicos, artesanales, promover el desarrollo comunitario o estar alineados con los valores de EcoMetrics.</li>
                <li>El Anunciante debe proporcionar información veraz, completa y precisa sobre el producto/servicio, incluyendo imágenes claras y representativas.</li>
            </ul>
            <p>EcoMetrics se reserva el derecho de determinar la elegibilidad a su entera discreción.</p>
            <br />
            <h2>3. Proceso de Solicitud y Contenido</h2>
            <p>El Anunciante debe completar el formulario de solicitud disponible en la página "Promociona tu Producto", proporcionando toda la información requerida, incluyendo nombre del negocio, nombre del producto/servicio, descripción, tipo de negocio, imágenes del producto, precio o promoción, y detalles de contacto y ubicación.</p>
            <p>El Anunciante es el único responsable de la exactitud, legalidad y adecuación de toda la información y materiales proporcionados. El contenido de la promoción, incluyendo las imágenes, no debe:</p>
            <ul>
                <li>Ser falso, engañoso, o prometer resultados no verificables.</li>
                <li>Infringir derechos de propiedad intelectual de terceros (incluyendo derechos de autor de las imágenes).</li>
                <li>Ser difamatorio, obsceno o ilegal.</li>
            </ul>
            <p>EcoMetrics se reserva el derecho de rechazar o remover cualquier promoción que no cumpla con estos criterios.</p>
            <br />
            <h2>4. Revisión y Aprobación</h2>
            <p>Todas las solicitudes de promoción de productos/servicios están sujetas a un proceso de revisión y aprobación por parte de EcoMetrics. Nos reservamos el derecho de aprobar o rechazar cualquier solicitud.</p>
            <br />
            <h2>5. Pago del Servicio</h2>
            <p>La publicación de una promoción de producto/servicio en EcoMetrics tiene un costo de $30.00 MXN (Treinta pesos 00/100 Moneda Nacional). Este pago se realiza a través de nuestro proveedor de servicios de pago Stripe.</p>
            <p>El pago debe completarse para que la solicitud sea considerada para revisión y publicación. Una vez que una promoción ha sido aprobada y publicada, la tarifa de promoción no es reembolsable, salvo que EcoMetrics decida lo contrario.</p>
            <br />
            <h2>6. Información del Producto y "Válido Hasta"</h2>
            <p>El Anunciante es responsable de asegurar que toda la información del producto, incluyendo precio, promoción y la fecha de "Válido Hasta" (si aplica), sea precisa y se mantenga actualizada. Si una promoción tiene una fecha de vencimiento, esta se mostrará en la Plataforma. Es responsabilidad del Anunciante informar a EcoMetrics si una promoción ya no es válida antes de su fecha de expiración indicada, o si desea extenderla (sujeto a posibles nuevas tarifas).</p>
            <br />
            <h2>7. Responsabilidad y Garantías</h2>
            <p>EcoMetrics actúa únicamente como una plataforma para la difusión de promociones de productos/servicios. No somos parte de ninguna transacción entre el Anunciante y los Usuarios. No ofrecemos garantías sobre los productos o servicios promocionados, ni sobre la veracidad de la información proporcionada por el Anunciante.</p>
            <p>El Anunciante es el único responsable de la calidad, seguridad, legalidad, entrega y cualquier otro aspecto relacionado con los productos o servicios que promociona. El Anunciante se compromete a indemnizar a EcoMetrics por cualquier reclamación relacionada con su promoción.</p>
            <br />
            <h2>8. Uso de Imágenes y Contenido</h2>
            <p>Al subir imágenes y descripciones, el Anunciante garantiza que posee los derechos necesarios para utilizar y publicar dicho contenido, o que tiene el permiso explícito del titular de los derechos. El Anunciante otorga a EcoMetrics una licencia para mostrar este contenido en la Plataforma y en materiales promocionales relacionados.</p>
            <br />
            <h2>9. Modificación y Terminación</h2>
            <p>EcoMetrics se reserva el derecho de modificar o descontinuar el Servicio de Promoción de Producto. También podemos remover o suspender promociones que violen estos Términos.</p>
            <p>El Anunciante puede solicitar la eliminación de su promoción contactando a <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>.</p>
            <br />
            <h2>10. Contacto</h2>
            <p>Para cualquier duda sobre estos Términos de Promoción de Producto, contáctenos en: <a href="mailto:ecosoporte@ecometricsmx.com">ecosoporte@ecometricsmx.com</a>.</p>
        </LegalPageLayout>
    );
}