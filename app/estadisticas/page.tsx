"use client"

import { useState, useEffect } from "react"
import { PieChart, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/dashboard-layout"
import { StatsData } from "@/types/types"



export default function StatsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [period, setPeriod] = useState("month")
  const [userLevel, setUserLevel] = useState(1)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)

        // Obtener estadísticas
        const response = await fetch(`/api/stats?period=${period}`)
        if (!response.ok) {
          throw new Error("Error al obtener estadísticas")
        }
        const data = await response.json()

        // Obtener datos del usuario (incluye nivel)
        const userResponse = await fetch("/api/auth/session")
        if (!userResponse.ok) {
          throw new Error("Error al obtener datos del usuario")
        }
        const userData = await userResponse.json()

        setUserLevel(userData.user?.level || 1)
        setStats(data)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [period])

  // Función para obtener el nombre del tipo de actividad
  const getActivityTypeName = (type: string) => {
    switch (type) {
      case "RECYCLING":
        return "Reciclaje"
      case "TREE_PLANTING":
        return "Plantación"
      case "WATER_SAVING":
        return "Ahorro de agua"
      case "ENERGY_SAVING":
        return "Ahorro de energía"
      case "COMPOSTING":
        return "Compostaje"
      case "EDUCATION":
        return "Educación"
      default:
        return "Otro"
    }
  }

  // Función para obtener el color según el tipo de actividad
  const getActivityColor = (type: string) => {
    switch (type) {
      case "RECYCLING":
        return "bg-blue-500"
      case "TREE_PLANTING":
        return "bg-green-500"
      case "WATER_SAVING":
        return "bg-cyan-500"
      case "ENERGY_SAVING":
        return "bg-yellow-500"
      case "COMPOSTING":
        return "bg-amber-500"
      case "EDUCATION":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
    }).format(date)
  }

  // Calcular el total de actividades
  const totalActivities = stats?.activityCount || 0

  // Calcular progreso hacia el siguiente nivel
  const pointsPerLevel = 500
  const currentLevelMinPoints = (userLevel - 1) * pointsPerLevel
  const nextLevelMinPoints = userLevel * pointsPerLevel
  const pointsInCurrentLevel = stats ? stats.totalPoints - currentLevelMinPoints : 0
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 m-5 sm:m-10">
        <div className="p-5 flex flex-col gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="">Visualiza el impacto de tus actividades ecológicas</p>
        </div>

        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card className="border-4 border-red-100 rounded-xl transition-all ease-linear hover:border-red-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPoints}</div>
                  <p className="text-xs text-muted-foreground">Nivel: {userLevel}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{currentLevelMinPoints} pts</span>
                      <span>{nextLevelMinPoints} pts</span>
                    </div>
                    <Progress value={levelProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {pointsPerLevel - pointsInCurrentLevel} puntos para el siguiente nivel
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-4 border-red-100 rounded-xl transition-all ease-linear hover:border-red-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actividades</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalActivities}</div>
                  <p className="text-xs text-muted-foreground">
                    En{" "}
                    {period === "week"
                      ? "la última semana"
                      : period === "month"
                        ? "el último mes"
                        : period === "year"
                          ? "el último año"
                          : "todo el tiempo"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-4 border-red-100 rounded-xl transition-all ease-linear hover:border-red-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Material Reciclado</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
                    <path d="m14 16-3 3 3 3" />
                    <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
                    <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
                    <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.impactMetrics.recycledMaterials.toFixed(1)} kg</div>
                  <p className="text-xs text-muted-foreground">
                    Equivalente a {Math.round(stats.impactMetrics.recycledMaterials * 0.5)} kg de CO₂ evitados
                  </p>
                </CardContent>
              </Card>
              <Card className="border-4 border-red-100 rounded-xl transition-all ease-linear hover:border-red-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Árboles Plantados</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M17 14v7a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 .4-.8l8-7a1 1 0 0 1 1.2 0l8 7a1 1 0 0 1 .4.8Z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.impactMetrics.treesPlanted}</div>
                  <p className="text-xs text-muted-foreground">
                    Capturarán aprox. {stats.impactMetrics.treesPlanted * 25} kg de CO₂ al año
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="activities" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="activities">Actividades</TabsTrigger>
                <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
                {/* <TabsTrigger value="impact">Impacto ambiental</TabsTrigger> */}
              </TabsList>

              <TabsContent value="activities">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de actividades</CardTitle>
                    <CardDescription>Desglose de tus actividades ecológicas por tipo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.activityStats.length > 0 ? (
                      <div className="space-y-4">
                        {stats.activityStats.map((stat) => (
                          <div key={stat.type} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getActivityColor(stat.type)}>{stat._count.id}</Badge>
                                <span>{getActivityTypeName(stat.type)}</span>
                              </div>
                              <span className="text-sm font-medium">{stat._sum.points} pts</span>
                            </div>
                            <Progress value={(stat._count.id / totalActivities) * 100} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {stat.type === "RECYCLING" && `${stat._sum.quantity.toFixed(1)} kg de material reciclado`}
                              {stat.type === "TREE_PLANTING" && `${stat._sum.quantity} árboles plantados`}
                              {stat.type === "WATER_SAVING" &&
                                `${stat._sum.quantity.toFixed(1)} litros de agua ahorrados`}
                              {stat.type === "ENERGY_SAVING" &&
                                `${stat._sum.quantity.toFixed(1)} kWh de energía ahorrados`}
                              {stat.type === "COMPOSTING" &&
                                `${stat._sum.quantity.toFixed(1)} kg de material compostado`}
                              {stat.type === "EDUCATION" &&
                                `${stat._sum.quantity.toFixed(1)} horas de educación ambiental`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">Aún no has registrado actividades</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de puntos</CardTitle>
                    <CardDescription>Progreso de tus puntos a lo largo del tiempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.timeSeries.length > 0 ? (
                      <>
                        <div className="h-[300px] w-full">
                          <div className="flex h-full items-end gap-2">
                            {stats.timeSeries.map((data, index) => {
                              // Encontrar el valor máximo para escalar el gráfico
                              const maxPoints = Math.max(...stats.timeSeries.map((d) => d.points))
                              const heightPercentage = maxPoints > 0 ? (data.points / maxPoints) * 100 : 0

                              return (
                                <div key={index} className="relative flex h-full w-full flex-col justify-end">
                                  <div
                                    className="bg-red-700 w-full rounded-md"
                                    style={{ height: `${heightPercentage}%` }}
                                  ></div>
                                  <span className="mt-1 text-xs text-muted-foreground text-center">
                                    {formatDate(data.date)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                          <div>Actividades: {stats.timeSeries.reduce((sum, data) => sum + data.count, 0)}</div>
                          <div>Puntos totales: {stats.timeSeries.reduce((sum, data) => sum + data.points, 0)}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">
                          No hay suficientes datos para mostrar la línea de tiempo
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <Card className="mt-10">
                <CardHeader>
                  <CardTitle>Impacto ambiental</CardTitle>
                  <CardDescription>Medición del impacto positivo de tus actividades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Material reciclado</h3>
                          <span className="font-bold">{stats.impactMetrics.recycledMaterials.toFixed(1)} kg</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Equivalente a:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>{Math.round(stats.impactMetrics.recycledMaterials * 0.5)} kg de CO₂ evitados</li>
                            <li>
                              {Math.round(stats.impactMetrics.recycledMaterials * 0.2)} litros de petróleo ahorrados
                            </li>
                            <li>{Math.round(stats.impactMetrics.recycledMaterials * 2)} kWh de energía ahorrados</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Árboles plantados</h3>
                          <span className="font-bold">{stats.impactMetrics.treesPlanted}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Beneficios:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Capturarán aprox. {stats.impactMetrics.treesPlanted * 25} kg de CO₂ al año</li>
                            <li>Producirán oxígeno para {stats.impactMetrics.treesPlanted * 2} personas</li>
                            <li>Ayudarán a prevenir la erosión del suelo</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Agua ahorrada</h3>
                          <span className="font-bold">{stats.impactMetrics.waterSaved.toFixed(1)} litros</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Equivalente a:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>{Math.round(stats.impactMetrics.waterSaved / 150)} duchas completas</li>
                            <li>{Math.round(stats.impactMetrics.waterSaved / 10)} cargas de lavadora</li>
                            <li>
                              Agua potable para {Math.round(stats.impactMetrics.waterSaved / 2)} personas por un día
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Energía ahorrada</h3>
                          <span className="font-bold">{stats.impactMetrics.energySaved.toFixed(1)} kWh</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Equivalente a:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>{Math.round(stats.impactMetrics.energySaved * 0.5)} kg de CO₂ evitados</li>
                            <li>
                              {Math.round(stats.impactMetrics.energySaved / 5)} días de consumo de un hogar promedio
                            </li>
                            <li>
                              {Math.round(stats.impactMetrics.energySaved * 0.1)} litros de combustible ahorrados
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">No se pudieron cargar las estadísticas</h3>
            <p className="text-muted-foreground mt-1">Intenta recargar la página</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
