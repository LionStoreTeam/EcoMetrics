"use client"

import { useState } from "react"
import { Loader2, X } from "lucide-react"

interface Evidence {
    id: string
    fileUrl: string
    fileType: string
    fileName: string
    format: string
}

interface EvidenceViewerProps {
    evidence: Evidence[]
}

export default function EvidenceViewer({ evidence }: EvidenceViewerProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [loading, setLoading] = useState<boolean[]>(evidence.map(() => true))

    const handleImageLoad = (index: number) => {
        setLoading((prev) => {
            const newLoading = [...prev]
            newLoading[index] = false
            return newLoading
        })
    }

    const openModal = (index: number) => {
        setSelectedIndex(index)
    }

    const closeModal = () => {
        setSelectedIndex(null)
    }

    if (evidence.length === 0) {
        return <div className="text-gray-500 text-sm">No hay evidencias disponibles</div>
    }

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {evidence.map((item, index) => (
                    <div
                        key={item.id}
                        className="relative border rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => openModal(index)}
                    >
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                            {loading[index] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                </div>
                            )}

                            {item.fileType === "image" || item.format === "gif" ? (
                                <img
                                    src={item.fileUrl || "/placeholder.svg"}
                                    alt={`Evidencia ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onLoad={() => handleImageLoad(index)}
                                    onError={() => handleImageLoad(index)}
                                />
                            ) : item.fileType === "video" ? (
                                <video
                                    src={item.fileUrl}
                                    className="w-full h-full object-cover"
                                    onLoadedData={() => handleImageLoad(index)}
                                    onError={() => handleImageLoad(index)}
                                />
                            ) : (
                                <div className="text-gray-500 text-sm">Archivo no compatible</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal para vista ampliada */}
            {selectedIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl w-full max-h-screen">
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="bg-white rounded-lg overflow-hidden">
                            {evidence[selectedIndex].fileType === "image" || evidence[selectedIndex].format === "gif" ? (
                                <img
                                    src={evidence[selectedIndex].fileUrl || "/placeholder.svg"}
                                    alt={`Evidencia ${selectedIndex + 1}`}
                                    className="w-full h-auto max-h-[80vh] object-contain"
                                />
                            ) : evidence[selectedIndex].fileType === "video" ? (
                                <video src={evidence[selectedIndex].fileUrl} controls autoPlay className="w-full h-auto max-h-[80vh]" />
                            ) : (
                                <div className="p-4 text-center">Archivo no compatible</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
