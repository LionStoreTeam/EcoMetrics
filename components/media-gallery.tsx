"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface MediaGalleryProps {
    evidence: Array<{
        id: string
        fileUrl: string
        fileType: string
        fileName: string
        format: string
    }>
}

export default function MediaGallery({ evidence }: MediaGalleryProps) {
    const [mediaUrls, setMediaUrls] = useState<{ url: string; type: string, format: any }[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMediaUrls = async () => {
            try {
                setLoading(true)

                // Si las URLs ya son accesibles, usarlas directamente
                const urls = evidence.map((item) => ({
                    url: item.fileUrl,
                    type: item.fileType,
                    format: item.format,
                }))

                setMediaUrls(urls)
            } catch (err) {
                console.error("Error al obtener URLs de medios:", err)
                setError("No se pudieron cargar los archivos multimedia")
            } finally {
                setLoading(false)
            }
        }

        if (evidence.length > 0) {
            fetchMediaUrls()
        } else {
            setLoading(false)
        }
    }, [evidence])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>
    }

    if (mediaUrls.length === 0) {
        return <div className="text-gray-500 text-center p-4">No hay archivos multimedia disponibles</div>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
            {mediaUrls.map((media, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        {media.type === "image" ? (
                            <img
                                src={media.url || "/placeholder.svg"}
                                alt={`Evidencia ${index + 1}`}
                                className="w-full h-full object-contain"
                            />
                        ) : media.format === "gif" ? (
                            <img
                                src={media.url || "/placeholder.svg"}
                                alt={`GIF ${index + 1}`}
                                className="w-full h-full object-contain"
                            />
                        ) : media.type === "video" ? (
                            <video src={media.url} controls className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-gray-500">Archivo no compatible</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
