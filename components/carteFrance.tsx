"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import dynamic from "next/dynamic"
import { v4 as uuidv4 } from 'uuid';

const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster"), { ssr: false })

const FRANCE_CENTER: [number, number] = [46.603354, 1.888334]
const ZOOM_LEVEL = 6
const MAX_VISIBLE_MARKERS = 500 // Limite maximale de marqueurs à afficher à la fois

// Define the type for our data from the API
type JPOData = {
    id: number,
    id_jpo: number
    date: string
    heure: string
    id_composante: number
    nom_composante: string
    adresse: string
    coordonnees: {
        x: number | string,
        y: number | string
    } | string
    id_ville: number
    nom_ville: string
    code_postal: string
    nom_region: string
    id_etablissement: number
    nom_etablissement: string
    tel: string
    site_web: string
    nom_diplome: string
    duree: number
    intitule: string
}

// Type for our processed marker data
type MarkerData = {
    id: string
    formation: string
    etablissement: string
    ville: string
    region: string
    telephone: string
    siteWeb: string
    duree: number
    date: string
    heure: string
    adresse: string
    coordinates: [number, number]
}

// Composant qui gère le chargement des marqueurs en fonction de la vue
function ViewportMarkers({ allMarkers, onUpdateVisibleMarkers }) {
    const map = useMap()

    // Fonction pour filtrer les marqueurs visibles dans la vue actuelle
    const updateVisibleMarkers = () => {
        const bounds = map.getBounds()
        const zoom = map.getZoom()

        // Filtrer les marqueurs qui sont dans les limites de la carte
        let visibleMarkers = allMarkers.filter((marker) => bounds.contains(marker.coordinates))

        // Si trop de marqueurs sont visibles, prioriser en fonction du zoom
        if (visibleMarkers.length > MAX_VISIBLE_MARKERS) {
            // À faible zoom, échantillonner les marqueurs de façon déterministe
            if (zoom < 8) {
                const step = Math.ceil(visibleMarkers.length / MAX_VISIBLE_MARKERS)
                visibleMarkers = visibleMarkers.filter((_, index) => index % step === 0)
            } else {
                // À zoom élevé, prendre les premiers MAX_VISIBLE_MARKERS
                visibleMarkers = visibleMarkers.slice(0, MAX_VISIBLE_MARKERS)
            }
        }

        onUpdateVisibleMarkers(visibleMarkers)
    }

    // Mettre à jour les marqueurs visibles lors des événements de carte
    useMapEvents({
        moveend: updateVisibleMarkers,
        zoomend: updateVisibleMarkers,
        load: updateVisibleMarkers,
    })

    return null
}

export default function FranceMap() {
    const [isMounted, setIsMounted] = useState(false)
    const [L, setL] = useState<any>(null)
    const [allMarkers, setAllMarkers] = useState<MarkerData[]>([])
    const [visibleMarkers, setVisibleMarkers] = useState<MarkerData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "dark">("standard")
    const mapRef = useRef(null)

    // Function to convert coordinates from the database format to [lat, lng]
    const convertCoordinates = (coord: any): [number, number] => {
        try {
            // Handle string format (some APIs return coordinates as strings)
            if (typeof coord === "string") {
                try {
                    coord = JSON.parse(coord)
                } catch (e) {
                    // If not valid JSON, it might be another format
                    const parts = coord.split(',').map(part => parseFloat(part.trim()))
                    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        return [parts[0], parts[1]]
                    }
                    throw new Error("Format de coordonnées non reconnu")
                }
            }

            // Handle object format
            if (typeof coord === "object" && coord !== null) {
                const lat = typeof coord.y === "string" ? parseFloat(coord.y) : coord.y
                const lng = typeof coord.x === "string" ? parseFloat(coord.x) : coord.x

                if (!isNaN(lat) && !isNaN(lng)) {
                    return [lng, lat]
                }
            }

            throw new Error("Format de coordonnées invalide")
        } catch (error) {
            console.error("Erreur lors de la conversion des coordonnées:", error)
            return FRANCE_CENTER // Coordonnées par défaut (centre France)
        }
    }

    useEffect(() => {
        setIsMounted(true)

        // Import Leaflet dynamically
        import("leaflet").then((leaflet) => {
            setL(leaflet)
            leaflet.Icon.Default.mergeOptions({
                iconUrl: "/leaflet/marker-icon.png",
                iconRetinaUrl: "/leaflet/marker-icon-2x.png",
                shadowUrl: "/leaflet/marker-shadow.png",
            })
        })

        // Fetch data from the API
        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await fetch("/api/data")

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`)
                }

                const data: JPOData[] = await response.json()

                // Process the data and convert coordinates
                const processedData: MarkerData[] = data
                    .filter((item) => item.coordonnees)
                    .map((item) => {
                        try {
                            return {
                                id: uuidv4(),
                                formation: item.intitule || item.nom_diplome,
                                etablissement: item.nom_etablissement,
                                ville: item.nom_ville,
                                region: item.nom_region,
                                telephone: item.tel || "",
                                siteWeb: item.site_web || "",
                                duree: item.duree || 0,
                                date: item.date,
                                heure: item.heure || "",
                                adresse: item.adresse || "",
                                coordinates: convertCoordinates(item.coordonnees),
                            }
                        } catch (e) {
                            // Skip this item if coordinates conversion fails
                            console.warn("Impossible de traiter un élément:", e)
                            return null
                        }
                    })
                    .filter(Boolean) as MarkerData[] // Remove null entries and assert type

                setAllMarkers(processedData)
            } catch (err) {
                console.error("Error fetching data:", err)
                setError(err instanceof Error ? err.message : "Une erreur est survenue lors du chargement des données")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <p className="text-gray-500 animate-pulse">Chargement de la carte...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <p className="text-red-500">Erreur: {error}</p>
            </div>
        )
    }

    if (loading || !L) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <p className="text-gray-500 animate-pulse">Chargement des données...</p>
            </div>
        )
    }

    const customIcon = L.icon({
        iconUrl: "/leaflet/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    })

    // Sélection du style de carte
    const mapTiles = {
        standard: {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        },
        dark: {
            url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
            attribution:
                '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        },
    }

    const selectedTile = mapTiles[mapStyle]

    return (
        <div className="w-full max-w-5xl mx-auto bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4 text-center">Carte des JPO en France</h2>

            {/* Contrôles de style de carte */}
            <div className="flex justify-center mb-4 space-x-2">
                <button
                    onClick={() => setMapStyle("standard")}
                    className={`px-3 py-1 rounded ${mapStyle === "standard" ? "bg-primary text-white" : "bg-gray-200"}`}
                >
                    Standard
                </button>
                <button
                    onClick={() => setMapStyle("satellite")}
                    className={`px-3 py-1 rounded ${mapStyle === "satellite" ? "bg-primary text-white" : "bg-gray-200"}`}
                >
                    Satellite
                </button>
                <button
                    onClick={() => setMapStyle("dark")}
                    className={`px-3 py-1 rounded ${mapStyle === "dark" ? "bg-primary text-white" : "bg-gray-200"}`}
                >
                    Sombre
                </button>
            </div>

            <MapContainer center={FRANCE_CENTER} zoom={ZOOM_LEVEL} className="h-[600px] w-full rounded-md" ref={mapRef}>
                <TileLayer url={selectedTile.url} attribution={selectedTile.attribution} />
                <ViewportMarkers allMarkers={allMarkers} onUpdateVisibleMarkers={setVisibleMarkers} />
                <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={10} maxClusterRadius={80} spiderfyOnMaxZoom={true}>
                    {visibleMarkers.map((marker) => (
                        <Marker key={marker.id} position={marker.coordinates} icon={customIcon}>
                            <Popup>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg">{marker.formation}</h3>
                                    <p className="text-gray-700">{marker.etablissement}</p>
                                    <p className="text-gray-600">
                                        {marker.ville}, {marker.region}
                                    </p>
                                    {marker.adresse && <p className="text-gray-600">{marker.adresse}</p>}
                                    <p className="text-gray-500">Date: {new Date(marker.date).toLocaleDateString("fr-FR")}</p>
                                    {marker.heure && <p className="text-gray-500">Heure: {marker.heure}</p>}
                                    {marker.telephone && <p className="text-gray-500">Téléphone: {marker.telephone}</p>}
                                    {marker.siteWeb && (
                                        <p className="text-gray-500">
                                            <strong>Site Web:</strong>{" "}
                                            <a
                                                href={marker.siteWeb.startsWith("http") ? marker.siteWeb : `https://${marker.siteWeb}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                {marker.siteWeb}
                                            </a>
                                        </p>
                                    )}
                                    {marker.duree > 0 && <p className="text-gray-500">Durée: {marker.duree} ans</p>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
            <div className="mt-4 text-center text-sm text-gray-500">
                {visibleMarkers.length} points affichés sur {allMarkers.length} au total
                <p className="text-xs text-gray-400 mt-1">Déplacez la carte ou zoomez pour voir plus de points</p>
            </div>
        </div>
    )
}