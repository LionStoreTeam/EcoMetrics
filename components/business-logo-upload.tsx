// lionstoreteam/ecometrics/EcoMetrics-9cdd9112192325b6fafd06b5945494aa18f69ba4/components/business-logo-upload.tsx
"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE } from "@/lib/s3-service"; // Reutilizamos validaciones de avatar por simplicidad
import { Button } from "./ui/button";

interface BusinessLogoUploadProps {
    onFileChange: (file: File | null) => void;
    error?: string;
    currentLogoUrl?: string | null; // Para mostrar un logo existente si se está editando (no aplica ahora, pero útil para el futuro)
}

export default function BusinessLogoUpload({ onFileChange, error, currentLogoUrl }: BusinessLogoUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileError(null); // Limpiar error anterior

        if (!file) {
            setPreview(currentLogoUrl || null); // Restaurar si se cancela
            onFileChange(null);
            return;
        }

        // Validar tipo de archivo
        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            setFileError("Tipo de archivo no permitido. Solo se permiten JPG, PNG, WEBP.");
            onFileChange(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Limpiar input
            setPreview(currentLogoUrl || null);
            return;
        }

        // Validar tamaño de archivo
        if (file.size > MAX_AVATAR_SIZE) {
            setFileError(`El archivo excede el tamaño máximo permitido de ${MAX_AVATAR_SIZE / (1024 * 1024)}MB.`);
            onFileChange(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setPreview(currentLogoUrl || null);
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        onFileChange(file);
    };

    const removeFile = () => {
        if (preview && !currentLogoUrl) { // Solo revocar si es una URL de objeto creada
            URL.revokeObjectURL(preview);
        }
        setPreview(currentLogoUrl || null);
        setSelectedFile(null); // Asegurar que el archivo seleccionado se limpie
        onFileChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Resetear el input para permitir seleccionar el mismo archivo
        }
        setFileError(null);
    };

    const [selectedFile, setSelectedFile] = useState<File | null>(null); // Necesario para el reset

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors w-full aspect-video flex flex-col items-center justify-center ${(fileError || error) ? "border-red-500" : "border-gray-300"
                    }`}
                onClick={!preview ? triggerFileInput : undefined} // Solo permitir clic si no hay preview
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={ALLOWED_AVATAR_TYPES.join(",")}
                />
                {preview ? (
                    <>
                        <Image src={preview} alt="Vista previa del logo" layout="fill" objectFit="contain" className="rounded-md" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 z-10 h-7 w-7"
                            onClick={removeFile}
                            aria-label="Eliminar logo"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Sube el logo de tu negocio</p>
                        <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, WEBP • Máx. {MAX_AVATAR_SIZE / (1024 * 1024)}MB
                        </p>
                        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={triggerFileInput}>
                            <Upload className="mr-2 h-4 w-4" /> Seleccionar archivo
                        </Button>
                    </>
                )}
            </div>
            {(fileError || error) && <p className="mt-2 text-red-500 text-sm">{fileError || error}</p>}
        </div>
    );
}