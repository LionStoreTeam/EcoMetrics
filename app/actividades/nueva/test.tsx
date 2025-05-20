"use client"

import type React from "react"

import { useState, useRef, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { MIN_FILES, MAX_FILES } from "@/lib/s3-service"

export default function NuevaActividad() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [evidenceError, setEvidenceError] = useState("")
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const formRef = useRef<HTMLFormElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) return

        // Validar que no exceda el número máximo de archivos
        if (selectedFiles.length + files.length > MAX_FILES) {
            setEvidenceError(`No puedes subir más de ${MAX_FILES} archivos.`)
            return
        }

        setEvidenceError("")

        // Crear URLs de vista previa
        const newPreviews = files.map((file) => URL.createObjectURL(file))

        setSelectedFiles((prev) => [...prev, ...files])
        setPreviews((prev) => [...prev, ...newPreviews])
    }

    const removeFile = (index: number) => {
        // Liberar URL de objeto para evitar fugas de memoria
        URL.revokeObjectURL(previews[index])

        setSelectedFiles((prev) => {
            const updated = [...prev]
            updated.splice(index, 1)
            return updated
        })

        setPreviews((prev) => {
            const updated = [...prev]
            updated.splice(index, 1)
            return updated
        })
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setEvidenceError("")

        try {
            // Validar que haya al menos un archivo
            if (selectedFiles.length < MIN_FILES) {
                setEvidenceError(`Debes subir al menos ${MIN_FILES} archivo como evidencia`)
                setLoading(false)
                return
            }

            // Crear FormData para enviar archivos
            const formData = new FormData(formRef.current!)

            // Eliminar los archivos existentes y agregarlos manualmente
            // para asegurarnos de que se envíen correctamente
            formData.delete("evidence")

            // Agregar cada archivo individualmente
            selectedFiles.forEach((file) => {
                formData.append("evidence", file)
            })

            console.log(
                "Enviando formulario con archivos:",
                selectedFiles.map((f) => f.name),
            )

            // Enviar datos al servidor
            const response = await fetch("/api/activities", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Error al crear la actividad")
            }

            // Redireccionar a la lista de actividades
            router.push("/actividades")
            router.refresh()
        } catch (err) {
            console.error("Error al crear actividad:", err)
            setError(err instanceof Error ? err.message : "Error al crear la actividad")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 text-green-400">
            <h1 className="text-2xl font-bold mb-6">Nueva Actividad</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                        minLength={10}
                        maxLength={30}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                        minLength={10}
                        maxLength={100}
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Actividad
                    </label>
                    <select
                        id="type"
                        name="type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                    >
                        <option value="">Selecciona un tipo</option>
                        <option value="RECYCLING">Reciclaje</option>
                        <option value="TREE_PLANTING">Plantación de árboles</option>
                        <option value="WATER_SAVING">Ahorro de agua</option>
                        <option value="ENERGY_SAVING">Ahorro de energía</option>
                        <option value="COMPOSTING">Compostaje</option>
                        <option value="EDUCATION">Educación ambiental</option>
                        <option value="OTHER">Otro</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        max="20"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad
                    </label>
                    <input
                        type="text"
                        id="unit"
                        name="unit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="kg, litros, árboles, etc."
                    />
                </div>

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                    </label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Evidencia <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${evidenceError ? "border-red-500" : "border-gray-300"
                            }`}
                        onClick={() => document.getElementById("evidence")?.click()}
                    >
                        <input
                            type="file"
                            id="evidence"
                            name="evidence"
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.webp,.mp4,.gif"
                            multiple
                        />
                        <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar archivos o arrastra y suelta aquí</p>
                        <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, JPEG, WEBP, MP4, GIF • Máximo {MAX_FILES} archivos • 5MB por archivo
                        </p>
                    </div>

                    {/* Mostrar error de evidencia */}
                    {evidenceError && <div className="mt-2 text-red-500 text-sm">{evidenceError}</div>}

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
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-12 w-12 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                    />
                                                </svg>
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
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="p-2 text-sm truncate">
                                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => router.push("/actividades")}
                        className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar"
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
