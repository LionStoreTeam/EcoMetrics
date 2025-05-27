// components/product-lightbox-viewer.tsx
"use client";

import React from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"; //
import { X, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button"; //
import Image from "next/image";

interface ProductImage {
    id: string;
    url: string | null;
}

interface ProductLightboxViewerProps {
    images: ProductImage[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    initialImageId?: string | null; // Para establecer la imagen inicial en el carrusel
    productName?: string;
}

export const ProductLightboxViewer: React.FC<ProductLightboxViewerProps> = ({
    images,
    isOpen,
    onOpenChange,
    initialImageId,
    productName,
}) => {
    if (!images || images.length === 0) {
        return null;
    }

    const validImages = images.filter(img => img.url);
    const initialImageIndex = initialImageId ? validImages.findIndex(img => img.id === initialImageId) : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-2 sm:p-4 flex flex-col bg-black/80 backdrop-blur-sm border-none shadow-2xl">
                <div className="flex justify-between items-center mb-2 px-2 pt-1">
                    {productName && <span className="text-white text-sm truncate">{productName}</span>}
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white h-8 w-8">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Cerrar</span>
                        </Button>
                    </DialogClose>
                    <DialogTitle>
                        Cerrar
                    </DialogTitle>
                </div>
                {validImages.length > 0 ? (
                    <Carousel
                        opts={{
                            align: "start",
                            loop: validImages.length > 1,
                            startIndex: initialImageIndex >= 0 ? initialImageIndex : 0,
                        }}
                        className="w-full h-full flex-grow flex items-center justify-center"
                    >
                        <CarouselContent className="-ml-2"> {/* Ajuste para espaciado si es necesario */}
                            {validImages.map((image, index) => (
                                <CarouselItem key={image.id || index} className="pl-2 w-full"> {/* Ajuste para espaciado */}
                                    <div className="relative h-[75vh] flex items-center justify-center">
                                        {image.url ? (
                                            <Image
                                                src={image.url}
                                                alt={`${productName || "Imagen de producto"} ${index + 1}`}
                                                width={500}
                                                height={500}
                                                objectFit="cover"
                                                className="rounded-md"
                                                priority={index === initialImageIndex}
                                                onError={(e) => {
                                                    console.warn(`Error al cargar imagen en lightbox: ${image.url}`);
                                                    e.currentTarget.style.display = 'none'; // Ocultar si falla
                                                    // Podrías mostrar un placeholder aquí dentro del div
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700 rounded-md">
                                                <ImageOff className="h-16 w-16 text-gray-400" />
                                                <p className="text-gray-400 mt-2">Imagen no disponible</p>
                                            </div>
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {validImages.length > 1 && (
                            <>
                                <CarouselPrevious className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none h-10 w-10 sm:h-12 sm:w-12" />
                                <CarouselNext className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none h-10 w-10 sm:h-12 sm:w-12" />
                            </>
                        )}
                    </Carousel>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white">
                        <ImageOff className="h-24 w-24 text-gray-500" />
                        <p className="mt-4">No hay imágenes válidas para mostrar.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};