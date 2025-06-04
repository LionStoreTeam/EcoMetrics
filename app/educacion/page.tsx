"use client"

import DashboardLayout from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, Eye } from 'lucide-react'
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'

interface EducationSectionContentType {
    imageCard: string;
    badgeContent: string;
    title: string;
    description: string;
    url: string
}


export const EducationSectionsContente: EducationSectionContentType[] = [
    {
        imageCard: "/education/robot.svg",
        badgeContent: "EcoMetrics Education",
        title: 'Artículos y guías',
        description: "Explora distintos artículos y guias sobre, sostenibilidad, medio ambiente, entre otros temas.",
        url: "/educacion/articulos/"
    },
    {
        imageCard: "/education/cactus.svg",
        badgeContent: "EcoMetrics Education",
        title: 'Material Visual',
        description: "Explora distintos elementos visuales como infografías, diagramas, entre otros",
        url: "/educacion/visual/"
    },
    {
        imageCard: "/education/recording.svg",
        badgeContent: "EcoMetrics Education",
        title: 'Videos Cortos',
        description: "Explora distintos videos educativos sobre medio ambiente, sostenibilidad, recomendaciones y mucho más.",
        url: "/educacion/videos/"
    },
    {
        imageCard: "/education/monitor.svg",
        badgeContent: "EcoMetrics Education",
        title: 'Directorio Ambiental',
        description: "Enlaces a organizaciones gubernamentales relevantes (SEMARNAT, PROFEPA, secretarías de medio ambiente estatales), ONGs, Documentales, libros, sitios web recomendados y mucho más.",
        url: "/educacion/directorio-ambiental/"
    }
]


export default function EducationPage() {
    const [contentEducation, setContentEducation] = useState<EducationSectionContentType[]>([])

    React.useEffect(() => {
        setContentEducation(EducationSectionsContente)
    }, [])



    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="mt-16 lg:mt-5 p-8 flex flex-col gap-2 text-white bg-gradient-to-r from-pink-700 to-teal-500 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <BookText className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Educación Ambiental</h1>
                    </div>
                    <p className="text-pink-100">
                        Aprende y explora artículos, guías, material visual y mucho más para un futuro más sostenible.
                    </p>
                </div>
                <div className="flex flex-col gap-8 m-5 sm:m-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contentEducation.map((item, index) => (
                            <Card key={index} className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all ease-linear duration-300 hover:scale-105">
                                <Link href={item.url}>
                                    <CardHeader className="p-0">
                                        <div className="relative w-full h-48 bg-pink-50">
                                            {item.imageCard ? (
                                                <Image src={item.imageCard} alt="Card Image" layout="fill" objectFit="contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-teal-100">
                                                    <BookText className="h-16 w-16 text-green-400 opacity-70" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow flex flex-col">
                                        <Badge variant="outline" className="mb-2 text-xs self-start bg-gradient-to-r from-pink-100 to-teal-100 text-teal-500 border-2 border-teal-200">
                                            <p>{item.badgeContent}</p>
                                        </Badge>
                                        <CardTitle className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-green-600 transition-colors line-clamp-2" title="Title">
                                            <h2>{item.title}</h2>
                                        </CardTitle>
                                        <CardDescription className="text-xs text-gray-500 line-clamp-3 mb-2 flex-grow">
                                            <span>{item.description}</span>
                                        </CardDescription>

                                    </CardContent>
                                    <CardFooter className="p-3 border-t bg-gray-50 flex items-center justify-center md:justify-between">
                                        <div className="flex items-center gap-2">
                                            <Link href={item.url} passHref legacyBehavior>
                                                <Button variant="outline" size="sm" className="h-auto px-2 py-1 text-xs border-teal-400 hover:border-pink-500 hover:text-pink-700">
                                                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver Contenido
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardFooter>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
