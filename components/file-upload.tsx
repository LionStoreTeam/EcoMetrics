"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { X, Upload, Film } from "lucide-react"
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILES } from "@/lib/s3-service"

interface FileUploadProps {
    onFilesChange: (files: File[]) => void
    maxFiles?: number
    error?: string
}

export default function FileUpload({ onFilesChange, maxFiles = MAX_FILES, error }: FileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [fileErrors, setFileErrors] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) return

        // Validar que no exceda el número máximo de archivos
        if (selectedFiles.length + files.length > maxFiles) {
            setFileErrors([`No puedes subir más de ${maxFiles} archivos.`])
            return
        }

        const newFiles: File[] = []
        const newErrors: string[] = []
        const newPreviews: string[] = []

        // Validar cada archivo
        files.forEach((file) => {
            // Validar tipo de archivo
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                newErrors.push(`${file.name}: Tipo de archivo no permitido. Solo se permiten JPG, PNG, JPEG, WEBP, MP4 y GIF.`)
                return
            }

            // Validar tamaño de archivo
            if (file.size > MAX_FILE_SIZE) {
                newErrors.push(`${file.name}: El archivo excede el tamaño máximo permitido de 5MB.`)
                return
            }

            newFiles.push(file)
            // Crear URL de vista previa
            const previewUrl = URL.createObjectURL(file)
            newPreviews.push(previewUrl)
        })

        if (newErrors.length > 0) {
            setFileErrors(newErrors)
        } else {
            setFileErrors([])
        }

        // Actualizar archivos seleccionados y vistas previas
        const updatedFiles = [...selectedFiles, ...newFiles]
        const updatedPreviews = [...previews, ...newPreviews]

        setSelectedFiles(updatedFiles)
        setPreviews(updatedPreviews)
        onFilesChange(updatedFiles)
    }

    const removeFile = (index: number) => {
        const updatedFiles = [...selectedFiles]
        const updatedPreviews = [...previews]

        // Liberar URL de objeto para evitar fugas de memoria
        URL.revokeObjectURL(updatedPreviews[index])

        updatedFiles.splice(index, 1)
        updatedPreviews.splice(index, 1)

        setSelectedFiles(updatedFiles)
        setPreviews(updatedPreviews)
        onFilesChange(updatedFiles)
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="w-full">
            <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${error ? "border-red-500" : "border-gray-300"
                    }`}
                onClick={triggerFileInput}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.gif"
                    multiple
                    max={maxFiles}
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar archivos o arrastra y suelta aquí</p>
                <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, JPEG, WEBP, MP4, GIF • Máximo {maxFiles} archivos • 5MB por archivo
                </p>
            </div>

            {/* Mostrar errores */}
            {(fileErrors.length > 0 || error) && (
                <div className="mt-2 text-red-500 text-sm">
                    {error && <p>{error}</p>}
                    {fileErrors.map((err, i) => (
                        <p key={i}>{err}</p>
                    ))}
                </div>
            )}

            {/* Mostrar vista previa de archivos */}
            {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                {file.type.startsWith("image/") ? (
                                    <img
                                        src={previews[index] || "/placeholder.svg"}
                                        alt={`Vista previa ${index + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                ) : file.type.startsWith("video/") || file.type === "image/gif" ? (
                                    file.type === "image/gif" ? (
                                        <img
                                            src={previews[index] || "/placeholder.svg"}
                                            alt={`Vista previa GIF ${index + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <video src={previews[index]} controls className="w-full h-full object-contain" />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <Film className="h-12 w-12 text-gray-400" />
                                        <span className="mt-2 text-sm text-gray-500">{file.name}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                aria-label="Eliminar archivo"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="p-2 text-sm truncate">
                                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
