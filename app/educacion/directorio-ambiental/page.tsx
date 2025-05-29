"use client";

import React from 'react';
import DashboardLayout from '@/components/dashboard-layout'; //
import { Compass } from 'lucide-react';
import ResourceSection from './components/ResourceSection';
import AccordionMedia from './components/AccordionMedia';
import { directoryData } from './data';

export default function DirectorioAmbientalPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="mt-10 lg:top-0 p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-green-600 to-teal-700 rounded-xl shadow-2xl">
                    <div className="flex items-center gap-3">
                        <Compass className="h-10 w-10" />
                        <h1 className="text-4xl font-bold tracking-tight">Directorio de Recursos Ambientales</h1>
                    </div>
                    <p className="text-teal-100 text-lg">
                        Explora organizaciones, entidades y materiales educativos clave para la sostenibilidad en México y Morelos.
                    </p>
                </div>

                {directoryData.sections.map(section => (
                    <ResourceSection key={section.id} section={section} cardType={section.id === "ngos-mexico" ? "organization" : "organization"} />
                ))}

                <AccordionMedia
                    title={directoryData.mediaSection.title}
                    items={directoryData.mediaSection.accordionItems}
                />

            </div>
        </DashboardLayout>
    );
}