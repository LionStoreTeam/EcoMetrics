"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Recycle, TreePine, Droplets, Lightbulb, Leaf, BookOpen, HelpCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import DashboardLayout from "@/components/dashboard-layout"
import { z } from "zod"
import toast from 'react-hot-toast';

// For evidence
import { MIN_FILES, MAX_FILES } from "@/lib/s3-service" // Asegúrate que este path sea correcto y exporte MIN_FILES y MAX_FILES


// Definimos los puntos fijos para cada tipo de actividad
const ACTIVITY_POINTS = {
  RECYCLING: 5, // 5 puntos por kg
  TREE_PLANTING: 5, // 5 puntos por árbol
  WATER_SAVING: 2, // 2 puntos por litro
  ENERGY_SAVING: 2, // 2 puntos por kWh
  COMPOSTING: 5, // 5 puntos por kg
  EDUCATION: 5, // 5 puntos por hora
  OTHER: 2, // 2 puntos por unidad
}

// Definimos el esquema de validación con Zod
const activitySchema = z.object({
  title: z.string().min(10, { message: "El título debe tener al menos 10 caracteres" }).max(100, { message: "El título no puede tener más de 100 caracteres" }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres" })
    .max(100, {
      message: "La descripción no puede tener más de 100 caracteres",
    }),
  type: z.enum(["RECYCLING", "TREE_PLANTING", "WATER_SAVING", "ENERGY_SAVING", "COMPOSTING", "EDUCATION", "OTHER"], {
    message: "Selecciona un tipo de actividad válido",
  }),
  quantity: z
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .positive({ message: "La cantidad debe ser mayor a 0" })
    .min(1, { message: "La cantidad mínima es 1" })
    .max(20, { message: "La cantidad máxima permitida es 20" }),
  unit: z.string().min(1, { message: "La unidad es requerida" }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha inválida",
  }),
})

// Tipo para los errores de validación
type FormErrors = {
  [K in keyof z.infer<typeof activitySchema>]?: string
}

export default function NewActivityPage() {
  // Estados para la subida de archivos
  const [evidenceError, setEvidenceError] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null) // Se mantiene por si tiene otros usos, no esencial para la lógica de subida de archivos actual

  // Estado para errores generales del formulario (no específico de la subida de archivos)
  const [error, setError] = useState("")


  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "RECYCLING",
    quantity: "",
    unit: "kg",
    date: new Date().toISOString().split("T")[0],
    // Se elimina 'evidence' de aquí, se gestiona con selectedFiles
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Manejador para la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Validar que no exceda el número máximo de archivos
    if (selectedFiles.length + files.length > MAX_FILES) {
      setEvidenceError(`No puedes subir más de ${MAX_FILES} archivos.`)
      if (e.target) e.target.value = ""; // Limpiar input para permitir nueva selección
      return
    }

    // Validar tamaño de cada archivo (ejemplo: 5MB por archivo)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (file.size > maxSizeInBytes) {
        setEvidenceError(`El archivo "${file.name}" excede el tamaño máximo de 5MB.`);
        if (e.target) e.target.value = ""; // Limpiar input
        return;
      }
    }

    setEvidenceError("")

    const newPreviews = files.map((file) => URL.createObjectURL(file))

    setSelectedFiles((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...newPreviews])

    // Limpiar el valor del input para permitir seleccionar el mismo archivo si se elimina y se vuelve a agregar
    if (e.target) {
      e.target.value = "";
    }
  }

  // Manejador para eliminar un archivo seleccionado
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]) // Liberar URL de objeto

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

    // Si se estaba mostrando un error de MAX_FILES y ahora estamos por debajo, limpiarlo.
    if (selectedFiles.length - 1 < MAX_FILES && evidenceError.includes(`más de ${MAX_FILES} archivos`)) {
      setEvidenceError("");
    }
    // Si después de borrar, la cantidad de archivos es menor que MIN_FILES, y había un error de MIN_FILES, se podría limpiar
    // pero la validación de MIN_FILES se hace principalmente en el submit.
    // Si ya no hay archivos y antes había error de MIN_FILES, podemos limpiarlo.
    if (selectedFiles.length - 1 === 0 && evidenceError.includes(`al menos ${MIN_FILES}`)) {
      setEvidenceError("");
    }

  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleTypeChange = (value: string) => {
    let defaultUnit = ""
    switch (value) {
      case "RECYCLING":
      case "COMPOSTING":
        defaultUnit = "kg"
        break
      case "TREE_PLANTING":
        defaultUnit = "árboles"
        break
      case "WATER_SAVING":
        defaultUnit = "litros"
        break
      case "ENERGY_SAVING":
        defaultUnit = "kWh"
        break
      case "EDUCATION":
        defaultUnit = "horas"
        break
      default:
        defaultUnit = "unidades"
    }
    setFormData((prev) => ({
      ...prev,
      type: value,
      unit: defaultUnit,
    }))
  }

  const validateForm = () => {
    try {
      const dataToValidate = {
        ...formData,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
      }
      activitySchema.parse(dataToValidate)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormErrors
          newErrors[path] = err.message
        })
        setErrors(newErrors)
        const firstError = error.errors[0]?.message
        if (firstError) {
          toast.error("Error de validación, verifica los datos ingresados")
        }
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("") // Limpiar errores generales
    setEvidenceError("") // Limpiar errores de evidencia

    // Validar formulario con Zod (campos de texto)
    if (!validateForm()) {
      setIsLoading(false) // Detener carga si la validación de Zod falla
      return
    }

    // Validar archivos de evidencia
    if (selectedFiles.length < MIN_FILES) {
      setEvidenceError(`Debes subir al menos ${MIN_FILES} archivo como evidencia.`)
      setIsLoading(false)
      return
    }
    // MAX_FILES ya se valida en handleFileChange, pero una doble comprobación no hace daño.
    if (selectedFiles.length > MAX_FILES) {
      setEvidenceError(`No puedes subir más de ${MAX_FILES} archivos.`);
      setIsLoading(false);
      return;
    }

    try {
      const quantity = Number.parseFloat(formData.quantity)
      const pointsPerUnit = ACTIVITY_POINTS[formData.type as keyof typeof ACTIVITY_POINTS] || ACTIVITY_POINTS.OTHER
      const points = Math.floor(quantity * pointsPerUnit)

      // Preparar FormData para enviar a la API
      const apiFormData = new FormData();

      // Añadir campos de texto al FormData
      apiFormData.append("title", formData.title);
      apiFormData.append("description", formData.description);
      apiFormData.append("type", formData.type);
      apiFormData.append("quantity", quantity.toString());
      apiFormData.append("unit", formData.unit);
      apiFormData.append("date", formData.date);
      // Opcional: apiFormData.append("points", points.toString()); si la API lo espera

      // Añadir archivos al FormData
      selectedFiles.forEach((file) => {
        apiFormData.append("evidence", file); // El backend recibirá un array de archivos bajo la clave "evidence"
      });

      console.log(
        "Enviando formulario con archivos:",
        selectedFiles.map((f) => f.name)
      );
      // Para depuración: iterar sobre FormData
      // for (let [key, value] of apiFormData.entries()) {
      //   console.log(`${key}:`, value);
      // }

      // Enviar datos a la API
      const response = await fetch("/api/activities", {
        method: "POST",
        // NO establecer Content-Type manualmente, el navegador lo hará por FormData
        body: apiFormData,
      })

      if (!response.ok) {
        let errorData = { error: "Error al registrar actividad. Intenta de nuevo." };
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Si la respuesta no es JSON o está vacía, usa el error genérico
          console.error("La respuesta de error no es JSON:", await response.text());
        }
        throw new Error(errorData.error || "Error desconocido al registrar actividad");
      } else {
        toast.success(`Tu actividad ha sido registrada correctamente y has ganado ${points} puntos`)
        router.push("/actividades")
        router.refresh()
      }

    } catch (err: any) {
      console.error("Error al registrar actividad:", err)
      setError(err.message || "Ocurrió un error inesperado.") // Mostrar error general
      toast.error(err.message || "Error al registrar actividad")
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    // ... (código sin cambios)
    switch (type) {
      case "RECYCLING": return <Recycle className="h-5 w-5" />;
      case "TREE_PLANTING": return <TreePine className="h-5 w-5" />;
      case "WATER_SAVING": return <Droplets className="h-5 w-5" />;
      case "ENERGY_SAVING": return <Lightbulb className="h-5 w-5" />;
      case "COMPOSTING": return <Leaf className="h-5 w-5" />;
      case "EDUCATION": return <BookOpen className="h-5 w-5" />;
      default: return <HelpCircle className="h-5 w-5" />;
    }
  }

  const calculateEstimatedPoints = () => {
    // ... (código sin cambios)
    if (!formData.quantity) return 0;
    const quantity = Number.parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > 20) return 0; // Ajustado para que sea > 0
    const pointsPerUnit = ACTIVITY_POINTS[formData.type as keyof typeof ACTIVITY_POINTS] || ACTIVITY_POINTS.OTHER;
    return Math.floor(quantity * pointsPerUnit);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 m-2 sm:m-10">
        <div className="p-5 flex flex-col gap-2 text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl">
          <h1 className="text-3xl font-bold tracking-tight m-2">Nueva Actividad</h1>
          <p className="">Registra una nueva actividad ecológica</p>
        </div>

        <Card>
          {/* El formRef se asigna aquí, aunque no es crítico para la subida de archivos con el enfoque actual */}
          <form onSubmit={handleSubmit} ref={formRef}>
            <CardHeader>
              <CardTitle>Detalles de la actividad</CardTitle>
              <CardDescription>Ingresa la información sobre la actividad que realizaste</CardDescription>
              <CardDescription>
                Considera que:
                <p>Cantidad mínima de caracteres para el Título: 10 - máxima: 100.</p>
                <p>Cantidad mínima de caracteres para la Descripción: 10 - máxima: 100.</p>
                <p>Cantidad máxima de acuerdo al Tipo de actividad: 20. ejemplo: 20 árboles - 20 kg</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ... (resto del JSX para campos del formulario sin cambios) ... */}
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" placeholder="Ej. Reciclaje de papel" value={formData.title} onChange={handleChange} disabled={isLoading} className={errors.title ? "border-red-500" : ""} />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" placeholder="Describe brevemente la actividad realizada" value={formData.description} onChange={handleChange} disabled={isLoading} className={errors.description ? "border-red-500" : ""} />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="grid gap-2">
                <Label>Tipo de actividad</Label>
                <RadioGroup value={formData.type} onValueChange={handleTypeChange} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { value: "RECYCLING", label: "Reciclaje" }, { value: "TREE_PLANTING", label: "Plantación" },
                    { value: "WATER_SAVING", label: "Ahorro de agua" }, { value: "ENERGY_SAVING", label: "Ahorro de energía" },
                    { value: "COMPOSTING", label: "Compostaje" }, { value: "EDUCATION", label: "Educación" },
                    { value: "OTHER", label: "Otro" },
                  ].map((type) => (
                    <div key={type.value} className="flex items-center space-x-1 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer sm:space-x-2">
                      <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                      <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer w-full">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${formData.type === type.value ? "bg-green-100 text-green-600 dark:bg-green-900/20" : "bg-muted"}`}>
                          {getActivityIcon(type.value)}
                        </div>
                        <span>{type.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad <span className="text-xs text-muted-foreground">(máx. 20)</span></Label>
                  <Input id="quantity" name="quantity" type="number" min="0.01" max="20" step="0.01" placeholder="Ej. 5" value={formData.quantity} onChange={handleChange} disabled={isLoading} className={errors.quantity ? "border-red-500" : ""} />
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input id="unit" name="unit" placeholder="Ej. kg, litros, árboles" value={formData.unit} onChange={handleChange} disabled={isLoading} className={errors.unit ? "border-red-500" : ""} />
                  {errors.unit && <p className="text-sm text-red-500">{errors.unit}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} disabled={isLoading} className={errors.date ? "border-red-500" : ""} />
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>

              {/* Sección de subida de archivos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidencia <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">(al menos {MIN_FILES}, máximo {MAX_FILES})</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${evidenceError ? "border-red-500" : "border-gray-300"}`}
                  onClick={() => document.getElementById("evidence-input")?.click()} // Cambiado id para evitar conflicto con el name="evidence" del input
                >
                  <input
                    type="file"
                    id="evidence-input" // ID único para el input
                    name="evidence" // El 'name' es importante si usaras un form nativo, pero aquí lo manejamos con JS
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.gif"
                    multiple
                    disabled={isLoading}
                  />
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Upload className="h-full w-full" /> {/* Usando el icono de Lucide */}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar archivos o arrastra y suelta aquí</p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, JPEG, WEBP, MP4, GIF • Máximo {MAX_FILES} archivos • 5MB por archivo
                  </p>
                </div>

                {evidenceError && <div className="mt-2 text-red-500 text-sm">{evidenceError}</div>}

                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          {file.type.startsWith("image/") ? (
                            <img src={previews[index]} alt={`Vista previa ${index + 1}`} className="w-full h-full object-contain" />
                          ) : file.type.startsWith("video/") ? (
                            <video src={previews[index]} controls className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2">
                              <HelpCircle className="h-12 w-12 text-gray-400" />
                              <span className="mt-2 text-sm text-gray-500 truncate">{file.name}</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          aria-label="Eliminar archivo"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {/* <div className="p-2 text-sm truncate bg-white dark:bg-gray-300">
                          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </div> */}
                        <div className="p-2 text-sm truncate bg-white dark:bg-gray-300">
                          Tamaño del archivo: ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Mensaje de error general del formulario */}
              {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}


              {/* ... (resto del JSX para puntos estimados, etc. sin cambios) ... */}
              {formData.quantity && !errors.quantity && calculateEstimatedPoints() > 0 && (
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Puntos estimados: {calculateEstimatedPoints()} pts</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    {formData.type === "RECYCLING" && `${ACTIVITY_POINTS.RECYCLING} pts por kg de material reciclado`}
                    {formData.type === "TREE_PLANTING" && `${ACTIVITY_POINTS.TREE_PLANTING} pts por árbol plantado`}
                    {formData.type === "WATER_SAVING" && `${ACTIVITY_POINTS.WATER_SAVING} pts por litro de agua ahorrado`}
                    {formData.type === "ENERGY_SAVING" && `${ACTIVITY_POINTS.ENERGY_SAVING} pts por kWh de energía ahorrado`}
                    {formData.type === "COMPOSTING" && `${ACTIVITY_POINTS.COMPOSTING} pts por kg de material compostado`}
                    {formData.type === "EDUCATION" && `${ACTIVITY_POINTS.EDUCATION} pts por hora de educación ambiental`}
                    {formData.type === "OTHER" && `${ACTIVITY_POINTS.OTHER} pts por unidad`}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar actividad"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}