import { type VisualMaterialItem as VisualMaterialItemType } from "@/types/types";
import { ImageOff } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

export const VisualContentImages = ({ visualContent }: { visualContent: VisualMaterialItemType["images"] }) => {
    const [showAll, setShowAll] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    // Asegurarse de que 'evidence' sea un array antes de usar slice o length
    const validVisualContentImages = Array.isArray(visualContent) ? visualContent : [];
    const visibleVisualContentImages = showAll ? validVisualContentImages : validVisualContentImages.slice(0, 3);


    const handleImageClick = (url: string) => {
        setSelectedImage(url);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    if (validVisualContentImages.length === 0) {
        return <p className="text-xs text-muted-foreground mt-2">Sin archivos disponibles</p>;
    }

    return (
        <div className="mt-2">
            <div className="relative flex flex-wrap gap-2 items-center justify-center lg:justify-evenly">
                {visibleVisualContentImages.map((ev) => (
                    <motion.div
                        key={ev.id}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-64 h-64 rounded-md overflow-hidden shadow-sm cursor-pointer bg-gray-100 lg:w-52 lg:h-52"
                        onClick={() => {
                            // Asegurarse de que publicDisplayUrl exista y sea una imagen
                            if (ev.url) {
                                handleImageClick(ev.url);
                            } else if (ev.url) {
                                // Para otros tipos de archivo, se podría abrir en una nueva pestaña o manejar diferente
                                window.open(ev.url, "_blank");
                            }
                        }}
                    >
                        {ev.url ? (

                            <Image
                                src={ev.url}
                                alt={ev.id || "Contenido Visual"}
                                layout="fill"
                                objectFit="cover" // cover puede ser mejor para miniaturas
                                priority={false} // No todas necesitan ser priority
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/placeholder.svg"; // Placeholder genérico
                                    target.alt = "Error al cargar imagen";
                                }}
                            />

                        ) : (
                            <div className="flex flex-col items-center justify-center bg-gray-200 text-gray-500 h-full w-full p-1 text-center">
                                <ImageOff className="h-6 w-6 mb-0.5" />
                                <span className="text-xs">No disponible</span>
                            </div>
                        )}
                    </motion.div>
                ))}
                {validVisualContentImages.length > 3 && !showAll && (
                    <button onClick={() => setShowAll(true)} className="text-xs text-blue-500 hover:underline self-end">
                        Ver más ({validVisualContentImages.length - 3})
                    </button>
                )}
                {validVisualContentImages.length > 3 && showAll && (
                    <button onClick={() => setShowAll(false)} className="text-xs text-blue-500 hover:underline self-end">
                        Ver menos
                    </button>
                )}

                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-0 left-0 w-full h-full bg-black/80 z-[100] flex items-center justify-center cursor-pointer p-4" // Aumentado z-index
                        onClick={handleCloseModal}
                    >
                        <motion.img
                            src={selectedImage}
                            alt="Evidencia ampliada"
                            className="max-w-full max-h-full object-contain rounded-md"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()} // Evitar que el clic en la imagen cierre el modal
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
};