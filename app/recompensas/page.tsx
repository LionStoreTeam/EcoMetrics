"use client"

import { useState, useEffect } from "react"
import { Gift, Search, Filter, Tag, Award, Ticket, ShoppingBag, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardLayout from "@/components/dashboard-layout"
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation"


interface Reward {
  id: string
  title: string
  description: string
  pointsCost: number
  available: boolean
  quantity?: number
  expiresAt?: string
  category: string // Esto ya está correcto, pero aseguramos que se use como string
}

interface Redemption {
  id: string
  rewardId: string
  userId: string
  createdAt: string
  reward: Reward
}

export default function RewardsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redeemedRewards, setRedeemedRewards] = useState<Redemption[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  // Cargar datos del usuario y recompensas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener puntos del usuario desde la sesión
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()

        if (sessionData && sessionData.user) {
          setUserPoints(sessionData.user.points || 0)
        }

        // Obtener recompensas disponibles
        const rewardsRes = await fetch("/api/rewards")
        const rewardsData = await rewardsRes.json()

        if (rewardsData) {
          setRewards(rewardsData)
        }

        // Obtener recompensas canjeadas por el usuario
        const redeemedRes = await fetch("/api/rewards/redeemed")
        const redeemedData = await redeemedRes.json()

        if (redeemedData) {
          setRedeemedRewards(redeemedData)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast.error("No se pudieron cargar los datos. Intenta de nuevo más tarde")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Función para obtener el icono según la categoría
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "discount":
        return <Tag className="h-5 w-5 text-blue-600" />
      case "workshop":
        return <Calendar className="h-5 w-5 text-amber-600" />
      case "product":
        return <ShoppingBag className="h-5 w-5 text-green-600" />
      case "recognition":
        return <Award className="h-5 w-5 text-purple-600" />
      case "experience":
        return <Ticket className="h-5 w-5 text-pink-600" />
      default:
        return <Gift className="h-5 w-5 text-green-600" />
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  // Filtrar recompensas
  const filteredRewards = rewards.filter((reward) => {
    const matchesSearch =
      reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "available" && reward.available) ||
      (filter === "affordable" && reward.pointsCost <= userPoints) ||
      reward.category === filter
    return matchesSearch && matchesFilter
  })

  const handleRedeem = async (reward: Reward) => {
    if (userPoints < reward.pointsCost) {
      toast.error("Puntos insuficientes")
      toast.error(`Necesitas ${reward.pointsCost - userPoints} puntos más para canjear esta recompensa`)
      return
    }

    try {
      // Llamar a la API para canjear la recompensa
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardId: reward.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al canjear la recompensa")
      }

      // Actualizar los puntos del usuario
      setUserPoints((prev) => prev - reward.pointsCost)

      // Actualizar la lista de recompensas canjeadas
      setRedeemedRewards((prev) => [
        {
          id: data.id,
          rewardId: reward.id,
          userId: data.userId,
          createdAt: new Date().toISOString(),
          reward: reward,
        },
        ...prev,
      ])

      // Actualizar la disponibilidad de la recompensa si es necesario
      // if (reward.quantity !== null && reward.quantity <= 1) {
      if (reward.quantity !== null) {
        setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, available: false, quantity: 0 } : r)))
      } else if (reward.quantity !== null) {
        setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, quantity: (r.quantity || 0) - 1 } : r)))
      } else {
        toast.success("Recompensa canjeada")
        toast.success(`Has canjeado "${reward.title}" por ${reward.pointsCost} puntos`)

        router.push("/actividades")
        router.refresh()
      }



    } catch (error) {
      console.error("Error al canjear recompensa:", error)
      toast.error("Error al canjear la recompensa")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 m-5 sm:m-10">
        <div className="p-5 flex flex-col gap-2 text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
          <h1 className="text-3xl font-bold tracking-tight">Recompensas</h1>
          <p className="">Canjea tus puntos por recompensas exclusivas</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar recompensas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="affordable">Puedo canjear</SelectItem>
                <SelectItem value="discount">Descuentos</SelectItem>
                <SelectItem value="workshop">Talleres</SelectItem>
                <SelectItem value="product">Productos</SelectItem>
                <SelectItem value="recognition">Reconocimientos</SelectItem>
                <SelectItem value="experience">Experiencias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 px-4 py-2 rounded-lg">
            <Gift className="h-5 w-5 text-green-600" />
            <span className="font-medium">Tus puntos:</span>
            <span className="font-bold">{userPoints}</span>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="available">Disponibles</TabsTrigger>
            <TabsTrigger value="redeemed">Canjeadas</TabsTrigger>
          </TabsList>
          <TabsContent value="available" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : filteredRewards.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRewards.map((reward) => (
                  <Card key={reward.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                          {getCategoryIcon(reward.category)}
                        </div>
                        <CardTitle className="text-lg">{reward.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground">{reward.description}</p>
                      {reward.quantity && (
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Disponibles:</span>{" "}
                          <span className="font-medium">{reward.quantity}</span>
                        </p>
                      )}
                      {reward.expiresAt && (
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Válido hasta:</span>{" "}
                          <span className="font-medium">{formatDate(reward.expiresAt)}</span>
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center border-t pt-4">
                      <div className="font-bold text-green-600">{reward.pointsCost} pts</div>
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={userPoints < reward.pointsCost || !reward.available}
                        className={
                          userPoints >= reward.pointsCost && reward.available ? "bg-green-600 hover:bg-green-700" : ""
                        }
                      >
                        Canjear
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No se encontraron recompensas</h3>
                <p className="text-muted-foreground mt-1">Intenta cambiar los filtros o vuelve más tarde</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="redeemed">
            <Card>
              <CardHeader>
                <CardTitle>Recompensas canjeadas</CardTitle>
                <CardDescription>Historial de recompensas que has canjeado</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : redeemedRewards.length > 0 ? (
                  <div className="space-y-4">
                    {redeemedRewards.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            {getCategoryIcon(redemption.reward.category)}
                          </div>
                          <div>
                            <h4 className="font-medium">{redemption.reward.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Canjeado el {formatDate(redemption.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="font-medium text-green-600">{redemption.reward.pointsCost} pts</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Aún no has canjeado ninguna recompensa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

