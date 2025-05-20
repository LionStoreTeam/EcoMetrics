"use client"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { UserStats } from "@/types/types"


const LevelUserCard = () => {
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

    // Calcular progreso hacia el siguiente nivel
    // Nivel 1: 0-500, Nivel 2: 500-1000, Nivel 3: 1000-1500, etc.
    const pointsPerLevel = 500
    const currentLevelMinPoints = (stats.level - 1) * pointsPerLevel
    const nextLevelMinPoints = stats.level * pointsPerLevel
    const pointsInCurrentLevel = stats.totalPoints - currentLevelMinPoints
    const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100

    return (
        <>
            <Card className="border-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </>
    );
}

export default LevelUserCard;