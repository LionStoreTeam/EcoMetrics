"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Filter, MapPin, Clock, Phone, Mail, Globe, XCircle, Loader2,
  AlertTriangle, Building2, LocateFixed, Users,
  Recycle
} from "lucide-react";
import dynamic from 'next/dynamic';

import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { MEXICAN_STATES, type MexicanState, MATERIAL_CATEGORIES_ES } from "@/lib/constants";

// Importar useMap directamente, pero los componentes de Leaflet dinámicamente
import { useMap } from 'react-leaflet';
// Tipos de Leaflet
import type { LatLngExpression, Icon as LeafletIcon } from 'leaflet';
import { Label } from "@radix-ui/react-label";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


// Coordenadas aproximadas del centro de los estados
const STATE_COORDINATES: Record<string, LatLngExpression> = {
  "Aguascalientes": [21.8853, -102.2916],
  "Baja California": [30.8406, -115.2838],
  "Baja California Sur": [26.0444, -111.6623],
  "Campeche": [19.8301, -90.5349],
  "Chiapas": [16.7569, -93.1292],
  "Chihuahua": [28.6329, -106.0691],
  "Coahuila": [27.0587, -101.7068],
  "Colima": [19.2433, -103.7247],
  "Ciudad de México": [19.4326, -99.1332],
  "Durango": [24.0277, -104.6532],
  "Guanajuato": [21.1250, -101.2570],
  "Guerrero": [17.5667, -99.5000],
  "Hidalgo": [20.1276, -98.7347],
  "Jalisco": [20.6597, -103.3496],
  "México": [19.2879, -99.6531],
  "Michoacán": [19.7028, -101.1921],
  "Morelos": [18.9211, -99.2340],
  "Nayarit": [21.5000, -104.8948],
  "Nuevo León": [25.6866, -100.3161],
  "Oaxaca": [17.0732, -96.7266],
  "Puebla": [19.0414, -98.2063],
  "Querétaro": [20.5888, -100.3899],
  "Quintana Roo": [19.6500, -88.0500],
  "San Luis Potosí": [22.1565, -100.9855],
  "Sinaloa": [24.8093, -107.3938],
  "Sonora": [29.0729, -110.9559],
  "Tabasco": [17.9869, -92.9303],
  "Tamaulipas": [23.7550, -99.1400],
  "Tlaxcala": [19.3167, -98.2333],
  "Veracruz": [19.1738, -96.1342],
  "Yucatán": [20.9674, -89.5926],
  "Zacatecas": [22.7709, -102.5833],
};

// Carga dinámica de componentes de react-leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface RecyclingCenterFE {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zipCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude: number;
  longitude: number;
  openingHours?: string | null;
  socialMedia?: string | null;
  materials: { id: string; name: string; category: string; }[];
}
interface CentersApiResponse {
  centers: RecyclingCenterFE[];
  pagination: { total: number; page: number; limit: number; totalPages: number; };
}

const ITEMS_PER_PAGE = 10;
const DEFAULT_CENTER: LatLngExpression = [19.4326, -99.1332];
const DEFAULT_ZOOM = 11;

// Componente para cambiar la vista del mapa dinámicamente
function ChangeMapView({ coords, zoom }: { coords: LatLngExpression, zoom: number }) {
  const map = useMap(); // Hook de react-leaflet
  useEffect(() => {
    if (map) {
      map.setView(coords, zoom);
    }
  }, [map, coords, zoom]);
  return null;
}

export default function MapPage() {
  const [centers, setCenters] = useState<RecyclingCenterFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState<MexicanState | "all">("all");
  const [selectedCenter, setSelectedCenter] = useState<RecyclingCenterFE | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [isUserLocationLoading, setIsUserLocationLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();


  // Estado para controlar si el componente se ha montado en el cliente
  const [hasMounted, setHasMounted] = useState(false);
  const [recyclingIcon, setRecyclingIcon] = useState<LeafletIcon | undefined>(undefined);
  const [userLocationIcon, setUserLocationIcon] = useState<LeafletIcon | undefined>(undefined);

  useEffect(() => {
    setHasMounted(true); // Se ejecuta solo en el cliente después del montaje inicial
  }, []);

  useEffect(() => {
    // Inicializar iconos de Leaflet solo después de que el componente se haya montado y estemos en el cliente
    if (hasMounted && typeof window !== 'undefined') {
      import('leaflet').then(LModule => { // LModule es el módulo 'leaflet' importado
        setRecyclingIcon(new LModule.Icon({
          iconUrl: '/gradient.png', // Asegúrate que esta ruta sea correcta
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        }));
        setUserLocationIcon(new LModule.Icon({
          iconUrl: '/person.png', // Asegúrate que esta ruta sea correcta
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        }));
      });
    }
  }, [hasMounted]); // Depende de hasMounted


  const fetchCenters = useCallback(async (page = 1, newSearchTerm = searchTerm, newMaterialCategory = materialCategoryFilter, newState = stateFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      if (newSearchTerm) params.append("search", newSearchTerm);
      if (newMaterialCategory !== "all") params.append("materialCategory", newMaterialCategory);
      if (newState !== "all") params.append("state", newState);

      const response = await fetch(`/api/centers?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener los centros de acopio");
      }
      const data: CentersApiResponse = await response.json();
      setCenters(data.centers);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);

      if (data.centers.length > 0) {
        if (newState !== "all" && STATE_COORDINATES[newState]) {
          setMapCenter(STATE_COORDINATES[newState]);
          setMapZoom(9);
        } else if (newState !== "all" && data.centers[0]) {
          setMapCenter([data.centers[0].latitude, data.centers[0].longitude]);
          setMapZoom(12);
        }
      } else if (newState !== "all" && STATE_COORDINATES[newState]) {
        setMapCenter(STATE_COORDINATES[newState]);
        setMapZoom(8);
      } else if (!userLocation) {
        setMapCenter(DEFAULT_CENTER);
        setMapZoom(DEFAULT_ZOOM);
      }
    } catch (err) {
      console.error("Error al cargar centros:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
      setCenters([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (hasMounted) { // Solo llamar a fetchCenters si el componente está montado
      fetchCenters(1, searchTerm, materialCategoryFilter, stateFilter);
    }
  }, [stateFilter, materialCategoryFilter, fetchCenters, hasMounted, searchTerm]);


  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchCenters(1, searchTerm, materialCategoryFilter, stateFilter);
  };

  const handleGetUserLocation = () => {
    setIsUserLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation: LatLngExpression = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newUserLocation);
          setMapCenter(newUserLocation);
          setMapZoom(13);
          toast.success("Ubicación Obtenida, Mapa centrado en tu ubicación actual")
          setIsUserLocationLoading(false);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          toast.error("Error de Ubicación, No se pudo obtener tu ubicación. Actualmente se muestra la ubicación por defecto.")
          router.refresh()
          setMapCenter(DEFAULT_CENTER);
          setMapZoom(DEFAULT_ZOOM);
          setIsUserLocationLoading(false);
        }
      );
    } else {
      toast.error("Error de Ubicación, Geolocalización no soportada por tu navegador")
      setIsUserLocationLoading(false);
    }
  };

  const handleCenterSelectionFromList = (center: RecyclingCenterFE) => {
    setSelectedCenter(center);
    setMapCenter([center.latitude, center.longitude]);
    setMapZoom(15);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCenters(newPage, searchTerm, materialCategoryFilter, stateFilter);
    }
  };

  const getMaterialColor = (category: string) => {
    switch (category) {
      case "PLASTIC": return "bg-blue-100 text-blue-800 border-blue-300";
      case "PAPER": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "GLASS": return "bg-green-100 text-green-800 border-green-300";
      case "METAL": return "bg-gray-200 text-gray-800 border-gray-400";
      case "ORGANIC": return "bg-lime-100 text-lime-800 border-lime-300";
      case "ELECTRONIC": return "bg-purple-100 text-purple-800 border-purple-300";
      case "HAZARDOUS": return "bg-red-100 text-red-800 border-red-300";
      case "TEXTILE": return "bg-pink-100 text-pink-800 border-pink-300";
      case "OIL": return "bg-orange-100 text-orange-800 border-orange-300";
      case "BATTERY": return "bg-indigo-100 text-indigo-800 border-indigo-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };
  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>1</PaginationLink>
        </PaginationItem>
      );
      if (currentPage > halfPagesToShow + 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
      let startPage = Math.max(2, currentPage - halfPagesToShow);
      let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);
      if (currentPage <= halfPagesToShow + 1) endPage = Math.min(totalPages - 1, maxPagesToShow - 1);
      if (currentPage >= totalPages - halfPagesToShow) startPage = Math.max(2, totalPages - maxPagesToShow + 2);
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      if (currentPage < totalPages - halfPagesToShow - 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 m-4 sm:m-8">
        <div className="p-5 flex flex-col gap-1 text-white bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-7 w-7" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mapa de Centros de Acopio</h1>
          </div>
          <p className="text-sm sm:text-base text-cyan-100">Encuentra centros de acopio y redes de apoyo ambiental.</p>
        </div>

        <Card className="shadow-md z-10">
          <CardHeader className="p-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 items-end">
              {/* <div className="relative sm:col-span-2 lg:col-span-1">
                <Label htmlFor="search-term" className="sr-only">Buscar</Label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search-term" type="search" placeholder="Nombre, dirección..." className="pl-9 py-2 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div> */}
              <div>
                <Label htmlFor="state-filter" className="sr-only">Estado</Label>
                <Select value={stateFilter} onValueChange={(value) => { setStateFilter(value as MexicanState | "all"); }}>
                  <SelectTrigger id="state-filter" className="py-2 text-sm"><Filter className="mr-1.5 h-4 w-4" /><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos los Estados</SelectItem>{MEXICAN_STATES.map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="material-filter" className="sr-only">Material</Label>
                <Select value={materialCategoryFilter} onValueChange={(value) => { setMaterialCategoryFilter(value); }}>
                  <SelectTrigger id="material-filter" className="py-2 text-sm"><Recycle className="mr-1.5 h-4 w-4" /><SelectValue placeholder="Material" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos los Materiales</SelectItem>{Object.entries(MATERIAL_CATEGORIES_ES).map(([key, value]) => (<SelectItem key={key} value={key}>{value}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              {/* <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white py-2 text-sm w-full sm:w-auto">Aplicar Filtros</Button> */}
            </form>
            <Button onClick={handleGetUserLocation} className="mt-3 w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700" disabled={isUserLocationLoading}>
              {isUserLocationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
              Obtener mi ubicación
            </Button>
          </CardHeader>
        </Card>

        <Tabs defaultValue="map" className="w-full z-50">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="map">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card className="h-[450px] md:h-[550px] overflow-hidden shadow-lg">
                  <CardContent className="p-0 h-full">
                    {!hasMounted ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
                        <p className="ml-3 text-muted-foreground">Cargando mapa...</p>
                      </div>
                    ) : (
                      <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                      // whenReady={(mapInstance: LeafletMapInstance) => { mapRef.current = mapInstance; }}
                      >
                        <ChangeMapView coords={mapCenter} zoom={mapZoom} />
                        <TileLayer
                          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {userLocation && userLocationIcon && (
                          <Marker position={userLocation} icon={userLocationIcon}>
                            <Popup>Estás aquí</Popup>
                          </Marker>
                        )}
                        {centers.map(center => (
                          recyclingIcon &&
                          <Marker
                            key={center.id}
                            position={[center.latitude, center.longitude]}
                            icon={recyclingIcon}
                            eventHandlers={{
                              click: () => {
                                setSelectedCenter(center);
                                setMapCenter([center.latitude, center.longitude]);
                                setMapZoom(15);
                              },
                            }}
                          >
                            <Popup>
                              <b>{center.name}</b><br />
                              {center.address.substring(0, 30)}... <br />
                              {/* <Button size="sm" variant="link" className="p-0 h-auto text-teal-600" onClick={() => handleCenterSelectionFromList(center)}>Ver detalles</Button> */}
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card className="h-[450px] md:h-[550px] overflow-hidden shadow-lg flex flex-col">
                  <CardHeader className="p-3 border-b bg-teal-600 text-white">
                    <CardTitle className="text-md flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Centros Encontrados:
                      <p className="border-b">
                        {centers.length}
                      </p>
                    </CardTitle>
                    {/* <CardDescription className="text-white">{isLoading ? "Cargando..." : `${centers.length} de ${totalPages * ITEMS_PER_PAGE < ITEMS_PER_PAGE ? centers.length : totalPages * ITEMS_PER_PAGE} centros`}</CardDescription> */}
                    <CardDescription className="text-white">Utiliza los filtros para encontrar el más cercano a tu zona actual.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow overflow-y-auto">
                    {isLoading && centers.length === 0 ? (<div className="flex items-center justify-center h-full p-4"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
                    ) : !isLoading && centers.length === 0 ? (<div className="text-center py-10 px-4"><MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-3" /><p className="text-muted-foreground font-medium text-sm">No se encontraron centros.</p><p className="text-xs text-muted-foreground">Intenta ajustar los filtros.</p></div>
                    ) : (<div className="space-y-0">{centers.map((center) => (<div key={center.id} className={`p-2.5 cursor-pointer hover:bg-gray-100 transition-colors border-b ${selectedCenter?.id === center.id ? "bg-teal-50 border-l-4 border-teal-500" : ""}`} onClick={() => handleCenterSelectionFromList(center)}><h3 className="font-bold text-xl text-cyan-700">{center.name}</h3><p className="text-muted-foreground truncate">{center.address}</p><p className="text-muted-foreground">{center.city}, {center.state}</p></div>))}</div>)}
                  </CardContent>
                  {totalPages > 1 && (<div className="p-2 border-t"><Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>{renderPaginationItems()}<PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem></PaginationContent></Pagination></div>)}
                </Card>
              </div>
            </div>

            {selectedCenter && (
              <Card className="mt-4 shadow-xl">
                <CardHeader className="bg-gray-50 p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl text-cyan-700 font-bold">{selectedCenter.name}
                      </CardTitle>{selectedCenter.description && <CardDescription className="mt-1 text-xl">{selectedCenter.description}</CardDescription>}</div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div className="space-y-2.5">
                      <div><h4 className="text-2xl font-bold flex items-center gap-1.5 text-cyan-800"><MapPin className="h-5 w-5 text-teal-500" /> Dirección</h4><p className="text-lg text-muted-foreground pl-5">{selectedCenter.address}<br />{selectedCenter.city}, {selectedCenter.state} {selectedCenter.zipCode && `, C.P. ${selectedCenter.zipCode}`}</p></div>
                      {selectedCenter.openingHours && (<div><h4 className="text-2xl font-bold text-cyan-800 flex items-center gap-1.5"><Clock className="h-5 w-5 text-teal-500" /> Horario</h4><p className="text-lg text-muted-foreground pl-5">{selectedCenter.openingHours}</p></div>)}
                      {selectedCenter.phone && (<div><h4 className="text-2xl flex items-center gap-1.5 text-cyan-700 font-bold"><Phone className="h-5 w-5 text-teal-500" /> Teléfono</h4><p className="text-lg text-muted-foreground pl-5">{selectedCenter.phone}</p></div>)}
                    </div>
                    <div className="space-y-2.5">
                      {selectedCenter.email && (<div><h4 className="text-2xl font-bold flex items-center gap-1.5 text-cyan-700"><Mail className="h-5 w-5 text-teal-500" /> Correo</h4><p className="text-md md:text-xl text-muted-foreground pl-5">{selectedCenter.email}</p></div>)}
                      {selectedCenter.website && (<div><h4 className="text-2xl font-bold flex items-center gap-1.5 text-cyan-700"><Globe className="h-5 w-5 text-teal-500" /> Sitio Web</h4><a href={selectedCenter.website} target="_blank" rel="noopener noreferrer" className="text-md md:text-xl text-teal-600 hover:underline pl-5 block truncate">{selectedCenter.website}</a></div>)}
                      {selectedCenter.socialMedia && (<div><h4 className="font-medium flex items-center gap-1.5 text-gray-700"><Users className="h-5 w-5 text-teal-500" /> Redes</h4><p className="text-muted-foreground pl-5">{selectedCenter.socialMedia}</p></div>)}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-lg text-muted-foreground mb-2">Materiales Aceptados:</h4>
                    <div className="flex flex-wrap gap-1.5">{selectedCenter.materials.map((material) => (<Badge key={material.id} variant="outline" className={`${getMaterialColor(material.category)} text-xs px-1.5 py-0.5`}>{material.name}</Badge>))}</div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => setSelectedCenter(null)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-3 py-1.5 h-auto"
                    >
                      <XCircle className="h-4 w-4" />Cerrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list">
            {isLoading ? (<div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-teal-600" /></div>
            ) : error ? (<Card className="bg-red-50 border-red-200"><CardHeader><CardTitle className="text-red-700 flex items-center gap-2"><AlertTriangle className="h-6 w-6" />Error</CardTitle></CardHeader><CardContent><p className="text-red-600">{error}</p><Button onClick={() => fetchCenters(currentPage)} variant="outline" className="mt-4">Reintentar</Button></CardContent></Card>
            ) : centers.length > 0 ? (
              <div className="space-y-4">
                {centers.map((center) => (
                  <Card key={center.id} className="shadow-md hover:shadow-lg transition-shado">
                    <CardContent className="p-4 md:p-5">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-cyan-700">{center.name}</h3>
                          {center.description && <p className="text-muted-foreground text-lg mt-1">{center.description}</p>}
                          <div className="mt-2 space-y-3 text-xs">
                            <span className="text-lg flex flex-col items-start justify-start text-start gap-1.5 md:flex-row"><p className="text-cyan-600 border-b-2 border-b-cyan-400">Dirección: </p> {center.address}, {center.city}, {center.state}</span>
                            {center.openingHours && <p className="text-lg flex items-center gap-1.5"><Clock className="h-5 w-5 text-muted-foreground" /> {center.openingHours}</p>}
                            {center.phone && <p className="text-lg flex items-center gap-1.5"><Phone className="h-5 w-5 text-muted-foreground" /> {center.phone}</p>}
                          </div>
                        </div>
                        <div className="md:w-2/5 lg:w-1/3 space-y-2.5">
                          <div><h4 className="text-xl text-muted-foreground mb-1">Materiales aceptados:</h4><div className="flex flex-wrap gap-1">{center.materials.map((material) => (<Badge key={material.id} variant="outline" className={`${getMaterialColor(material.category)} text-xs px-1 py-0.5`}>{material.name}</Badge>))}</div></div>
                          <Button
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-1.5 h-auto" onClick={() => { setSelectedCenter(center); document.querySelector<HTMLButtonElement>('button[data-state="active"][value="list"]')?.click(); setTimeout(() => document.querySelector<HTMLButtonElement>('button[data-state="inactive"][value="map"]')?.click(), 0); setMapCenter([center.latitude, center.longitude]); setMapZoom(15); toast.success("Ubicación actualizada. Ya puedes ver en el Mapa la ubicación del Centro de Acopio seleccionado") }}>
                            Ver en Mapa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {totalPages > 1 && (<Pagination className="mt-5"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>{renderPaginationItems()}<PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem></PaginationContent></Pagination>)}
              </div>
            ) : (
              <div className="text-center py-16"><Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold text-gray-700">No se encontraron centros</h3><p className="text-muted-foreground mt-2 text-sm">Intenta ajustar los filtros o la búsqueda.</p></div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
