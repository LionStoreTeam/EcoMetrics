"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart3, Gift, Map, PlusCircle, Leaf, Recycle, Droplets, TreePine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import DashboardLayout from "@/components/dashboard-layout"
import { UserStats } from "@/types/types"
import Image from "next/image"
import { playpen } from "../fonts/font"


export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    level: 1,
    activityCount: 0,
    recentActivities: [],
  })

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setIsLoading(true)

        // Obtener estadísticas del usuario
        const statsResponse = await fetch("/api/stats")
        if (!statsResponse.ok) {
          throw new Error("Error al obtener estadísticas")
        }
        const statsData = await statsResponse.json()

        // Obtener actividades recientes
        const activitiesResponse = await fetch("/api/activities?limit=3")
        if (!activitiesResponse.ok) {
          throw new Error("Error al obtener actividades")
        }
        const activitiesData = await activitiesResponse.json()

        // Obtener datos del usuario (incluye nivel)
        const userResponse = await fetch("/api/auth/session")
        if (!userResponse.ok) {
          throw new Error("Error al obtener datos del usuario")
        }
        const userData = await userResponse.json()

        setStats({
          totalPoints: statsData.totalPoints || 0,
          level: userData.user?.level || 1,
          activityCount: statsData.activityCount || 0,
          recentActivities: activitiesData.activities || [],
        })
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStats()
  }, [])

  // Función para obtener el icono según el tipo de actividad
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "RECYCLING":
        return <Recycle className="h-4 w-4 text-green-600" />
      case "TREE_PLANTING":
        return <TreePine className="h-4 w-4 text-amber-600" />
      case "WATER_SAVING":
        return <Droplets className="h-4 w-4 text-blue-600" />
      default:
        return <Leaf className="h-4 w-4 text-green-600" />
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  // Calcular progreso hacia el siguiente nivel
  // Nivel 1: 0-500, Nivel 2: 500-1000, Nivel 3: 1000-1500, etc.
  const pointsPerLevel = 500
  const currentLevelMinPoints = (stats.level - 1) * pointsPerLevel
  const nextLevelMinPoints = stats.level * pointsPerLevel
  const pointsInCurrentLevel = stats.totalPoints - currentLevelMinPoints
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 m-5">
        <div className="mt-10 lg:mt-0 p-5 flex flex-col gap-2 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="">Bienvenido a tu panel de control de EcoMetrics</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="flex flex-col justify-center items-center border-4 border-blue-100 rounded-xl transition-all ease-linear hover:border-blue-700">
            <CardHeader className="flex flex-col items-center justify-between space-y-0 pb-2">
              {/* <TrendingUp className="h-4 w-4 text-muted-foreground" /> */}
              <CardTitle className="text-sm font-medium text-center">Puntos Totales</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
              <p className="text-xs text-muted-foreground">Nivel: {stats.level}</p>
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
              <Image src="/Success factors-rafiki.svg" alt="vector_pts" width={500} height={500} priority />
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-around items-center border-4 border-green-100 rounded-xl transition-all ease-linear hover:border-green-500">
            <Link href="/actividades">
              <CardHeader className="flex flex-col items-center justify-between space-y-0 pb-2">
                {/* <PlusCircle className="h-4 w-4 text-muted-foreground" /> */}
                <CardTitle className="text-center">
                  <p className={`mb-7 text-green-500 text-3xl font-light lg:text-2xl`}>
                    Registra Nuevas Actividades Ecológicas
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full flex justify-center items-center text-center transition-all ease-linear duration-300 hover:scale-95">
                {/* <div className="text-2xl font-bold">{stats.activityCount}</div> */}
                {/* <p className="text-xs text-muted-foreground">
                {stats.activityCount === 0 ? "Registra tu primera actividad" : "Sigue registrando tus actividades"}
              </p> */}
                <Image src="/Success factors-bro.svg" alt="" width={500} height={500} priority />
              </CardContent>
            </Link>
          </Card>
          <Card className="flex flex-col justify-around items-center border-4 border-amber-100 rounded-xl transition-all ease-linear hover:border-amber-400">
            <Link href="/recompensas">
              <CardHeader className="flex flex-col items-center justify-between space-y-0 pb-2">
                {/* <Gift className="h-4 w-4 text-muted-foreground" /> */}
                <CardTitle className="text-center">
                  <p className={`mb-7 text-amber-400 text-3xl font-light lg:text-2xl`}>
                    Cajea increibles Recompensas
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full flex justify-center items-center transition-all ease-linear duration-300 hover:scale-95">
                <Image src="/Investment data-cuate.svg" width={500} height={500} priority alt="green dash rewards" />
                {/* <p className="text-xs text-muted-foreground">
                {stats.totalPoints < 500
                ? "Necesitas más puntos para canjear"
                : `Puedes canjear ${Math.floor(stats.totalPoints / 500)} recompensas`}
                </p> */}
              </CardContent>
            </Link>
          </Card>
          <Card className="flex flex-col justify-around items-center border-4 border-cyan-100 rounded-xl transition-all ease-linear hover:border-cyan-500">
            <Link href="/mapa">
              <CardHeader className="flex flex-col items-center justify-between space-y-0 pb-2">
                {/* <Map className="h-4 w-4 text-muted-foreground" /> */}
                <CardTitle className="text-center">
                  <p className={`mb-7 text-cyan-500 text-3xl font-light lg:text-2xl`}>
                    Encuentra Centros de Acopio cercanos
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full flex justify-center items-center text-center transition-all ease-linear duration-300 hover:scale-95">
                <Image src="/Location search-bro.svg" width={1000} height={1000} alt="vector_map" priority />
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Actividades Recientes</CardTitle>
              <CardDescription>Tus últimas actividades ecológicas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : stats.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex flex-col justify-start text-center xl:flex-row"
                    >
                      <Card className="flex flex-col items-center text-center justify-center gap-4 xl:flex-row xl:w-full xl:px-10 xl:justify-between xl:items-center xl:text-center p-3 hover:bg-blue-700 hover:text-white transition-all ease-linear duration-300">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm">{formatDate(activity.date)}</div>
                        </div>
                        <div className="gap-1 text-blue-600 font-medium">+{activity.points} pts</div>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-muted-foreground mb-4">Aún no has registrado actividades</p>
                  <Link href="/actividades/nueva">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Registrar primera actividad
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            {stats.recentActivities.length > 0 && (
              <CardFooter>
                <Link href="/actividades">
                  <Button variant="outline" className="hover:bg-blue-700 hover:text-white transition-all ease-linear duration-300">Ver todas las actividades</Button>
                </Link>
              </CardFooter>
            )}
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link href="/actividades/nueva">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar nueva actividad
                </Button>
              </Link>
              <Link href="/recompensas">
                <Button variant="outline" className="w-full">
                  <Gift className="mr-2 h-4 w-4" />
                  Explorar recompensas
                </Button>
              </Link>
              <Link href="/mapa">
                <Button variant="outline" className="w-full">
                  <Map className="mr-2 h-4 w-4" />
                  Ver mapa de centros
                </Button>
              </Link>
              <Link href="/estadisticas">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver mis estadísticas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
