// lionstoreteam/ecometrics/EcoMetrics-9cdd9112192325b6fafd06b5945494aa18f69ba4/components/multi-image-upload.tsx
"use client";

import { useState, useRef, type ChangeEvent, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { ALLOWED_IMAGE_TYPES, MAX_FILES, MIN_FILES } from "@/types/types-s3-service";
// Usaremos ALLOWED_AVATAR_TYPES para ser consistentes con el logo y evitar GIFs para imágenes de producto.
// Si se necesitaran tipos diferentes, se crearía una nueva constante.

interface ProductImageFile {
    id: string;
    file: File;
    previewUrl: string;
}

interface MultiImageUploadProps {
    onFilesChange: (files: File[]) => void;
    minFiles?: number;
    maxFiles?: number;
    formError?: string;
    triggerReset?: number; // Nueva prop para forzar reseteo
}

export default function MultiImageUpload({
    onFilesChange,
    minFiles = MIN_FILES,
    maxFiles = MAX_FILES,
    formError,
    triggerReset // Recibir la prop
}: MultiImageUploadProps) {
    const [selectedProductImages, setSelectedProductImages] = useState<ProductImageFile[]>([]);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Efecto para resetear cuando triggerReset cambie
    useEffect(() => {
        if (triggerReset && triggerReset > 0) { // Solo actuar si triggerReset es un número positivo
            selectedProductImages.forEach(imgFile => URL.revokeObjectURL(imgFile.previewUrl));
            setSelectedProductImages([]);
            onFilesChange([]);
            setFieldError(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [triggerReset, onFilesChange]); // selectedProductImages no es necesario como dependencia aquí

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        let currentErrors: string[] = [];
        let newValidFiles: ProductImageFile[] = [];

        if (selectedProductImages.length + files.length > maxFiles) {
            currentErrors.push(`No puedes subir más de ${maxFiles} imágenes para el producto.`);
        } else {
            files.forEach((file, index) => {
                // Usar ALLOWED_PRODUCT_IMAGE_TYPES (que ahora es alias de ALLOWED_AVATAR_TYPES)
                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    currentErrors.push(`Archivo '${file.name}': Tipo no permitido (solo JPG, PNG, WEBP).`);
                    return;
                }
                if (file.size > MAX_FILES) {
                    currentErrors.push(`Archivo '${file.name}': Excede 5MB.`);
                    return;
                }
                newValidFiles.push({
                    id: `${file.name}-${Date.now()}-${index}`,
                    file: file,
                    previewUrl: URL.createObjectURL(file),
                });
            });
        }

        if (currentErrors.length > 0) {
            setFieldError(currentErrors.join(" "));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setFieldError(null);
        const updatedFiles = [...selectedProductImages, ...newValidFiles];
        setSelectedProductImages(updatedFiles);
        onFilesChange(updatedFiles.map(f => f.file));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = useCallback((idToRemove: string) => {
        setSelectedProductImages((prevFiles) => {
            const fileToRemove = prevFiles.find(f => f.id === idToRemove);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            const updated = prevFiles.filter((imageFile) => imageFile.id !== idToRemove);
            onFilesChange(updated.map(f => f.file));
            if (updated.length >= minFiles && fieldError?.includes(`Debes subir al menos ${minFiles}`)) {
                setFieldError(null);
            }
            if (updated.length <= maxFiles && fieldError?.includes(`más de ${maxFiles}`)) {
                setFieldError(null);
            }
            return updated;
        });
    }, [minFiles, maxFiles, onFilesChange, fieldError]);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const totalError = fieldError || formError;

    return (
        <div className="w-full space-y-3">
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${totalError ? "border-red-500" : "border-gray-300"
                    }`}
                onClick={triggerFileInput}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") triggerFileInput(); }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={ALLOWED_IMAGE_TYPES.join(",")} // Usar la constante correcta
                    multiple
                />
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    Sube entre {minFiles} y {maxFiles} imágenes del producto
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP • Máx. 5MB por imagen
                </p>
            </div>

            {totalError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {totalError}
                </p>
            )}

            {selectedProductImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedProductImages.map((imageFile) => (
                        <div key={imageFile.id} className="relative group aspect-square border rounded-md overflow-hidden shadow-sm">
                            <NextImage
                                src={imageFile.previewUrl}
                                alt={`Vista previa ${imageFile.file.name}`}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform group-hover:scale-105"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1.5 right-1.5 z-10 h-6 w-6 opacity-80 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(imageFile.id)}
                                aria-label="Eliminar imagen"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5 text-center">
                                <p className="text-xs text-white truncate" title={imageFile.file.name}>
                                    {(imageFile.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}