import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Phone, Mail as MailIcon, Info, AlertTriangle } from 'lucide-react';
import type { BaseResource, MediaResource, WebsiteResource } from '../data'; // Asumiendo que ContactInfo está dentro de BaseResource o importado aquí
import { Badge } from '@/components/ui/badge';
import { LinkPreview } from "@/components/ui/link-preview";

interface ResourceCardProps {
    resource: BaseResource | MediaResource | WebsiteResource;
    type?: 'organization' | 'media' | 'website';
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, type = 'organization' }) => {
    const Icon = resource.icon;
    // Realizamos un type assertion o una verificación más robusta si es necesario para acceder a 'contact'
    const contactInfo = (resource as BaseResource).contact;

    return (
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    {Icon && <Icon className="h-7 w-7 text-green-600 mt-1 shrink-0" />}
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">{resource.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
                <CardDescription className="text-sm text-gray-600 line-clamp-4">
                    {resource.description}
                </CardDescription>

                {type === 'media' && (resource as MediaResource).whereToWatch && (
                    <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700">Dónde ver/encontrar:</p>
                        <p className="text-xs text-gray-500">{(resource as MediaResource).whereToWatch}</p>
                    </div>
                )}

                {/* Verificación de existencia para contactInfo y sus propiedades */}
                {contactInfo && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs">
                        <p className="font-medium text-gray-700 mb-1">Información de Contacto:</p>
                        {contactInfo.phone && (
                            <p className="flex items-center gap-1.5 text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-500" /> {contactInfo.phone}
                            </p>
                        )}
                        {contactInfo.email && (
                            <p className="flex items-center gap-1.5 text-gray-600">
                                <MailIcon className="h-3.5 w-3.5 text-gray-500" /> {contactInfo.email}
                            </p>
                        )}
                        {contactInfo.alternativeLink && (
                            <span className="flex items-center gap-1.5 text-gray-600">
                                <Info className="h-3.5 w-3.5 text-gray-500" />
                                <LinkPreview url={contactInfo.alternativeLink} openInNewTab={true} className="text-green-600 hover:underline">
                                    Sitio alternativo
                                </LinkPreview >
                            </span>
                        )}
                        {contactInfo.relevantAddresses && contactInfo.relevantAddresses.length > 0 && (
                            <div className="mt-1">
                                <p className="text-gray-500">Información Adicional:</p>
                                {contactInfo.relevantAddresses.map((addr, idx) => (
                                    <Badge key={idx} variant="outline" className="mr-1 mt-1 text-xs bg-amber-50 border-amber-200 text-amber-700">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> {addr}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {contactInfo.subDirectorates && contactInfo.subDirectorates.length > 0 && (
                            <div className="mt-1">
                                <p className="text-gray-500">Direcciones Internas:</p>
                                <ul className="list-disc list-inside pl-2">
                                    {contactInfo.subDirectorates.map((sd, idx) => (
                                        <li key={idx} className="text-gray-600">
                                            {sd.name} {sd.contact && <span className="text-gray-500 text-xs">({sd.contact})</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-3 mt-auto border-t">
                {/* Verificación para link y sourceLink */}
                {(resource.link || (type === 'media' && (resource as MediaResource).sourceLink)) && (
                    <Button variant="ghost" size="sm" asChild className="w-full text-green-600 hover:bg-green-50 hover:text-green-700">
                        <LinkPreview url={(resource.link || (resource as MediaResource).sourceLink)!} openInNewTab={true} >
                            Visitar Sitio <ExternalLink className="ml-2 h-4 w-4" />
                        </LinkPreview >
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default ResourceCard;