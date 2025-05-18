"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    MapPin,
    Calendar,
    Globe,
    BookOpen,
    Building,
    Share2,
    CalendarPlus,
    Facebook,
    Linkedin,
    Twitter,
    Navigation,
    Bookmark,
    Lightbulb,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Formation = {
    id_jpo: number
    date: string
    heure: string
    id_composante: number
    nom_composante: string
    adresse: string
    coordonnees: string
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
    stages: string
    stages_etranger: string
    debouches: string
    double_diplome: string
    relations_internationales: string
    relevanceScore?: number // Ajout du score de pertinence (optionnel)
    aiRecommended?: boolean // Indique si l'IA recommande spécialement cette formation
}

interface FormationCardProps {
    formation: Formation
}

export function FormationCard({ formation }: FormationCardProps) {
    // Au début de la fonction FormationCard, ajoutez cette vérification
    if (!formation) {
        console.error("Formation object is undefined or null")
        return <div className="p-4 border rounded-lg">Données de formation non disponibles</div>
    }
    // État pour gérer si la JPO est en favoris ou non
    const [isFavorite, setIsFavorite] = useState(false)

    useEffect(() => {
        const storedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]")

        // S'assurer que storedFavorites est bien un tableau
        if (!Array.isArray(storedFavorites)) {
            console.error("Favorites in localStorage is corrupted:", storedFavorites)
            localStorage.setItem("favorites", JSON.stringify([])) // Réinitialiser en cas d'erreur
            return
        }

        // Vérifier si formation est bien défini avant de l'utiliser
        if (!formation) {
            console.warn("Formation is undefined or null")
            return
        }

        // Vérifie si l'objet `{ id_jpo, intitule }` existe dans la liste en excluant les valeurs nulles
        const isFav = storedFavorites.some(
            (fav: { id_jpo?: number; intitule?: string } | null) =>
                fav && fav.id_jpo === formation.id_jpo && fav.intitule === formation.intitule,
        )

        setIsFavorite(isFav)
    }, [formation])

    const toggleFavorite = () => {
        const storedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]")

        if (!Array.isArray(storedFavorites)) {
            console.error("Invalid favorites format in localStorage.")
            return
        }

        let updatedFavorites
        if (isFavorite) {
            // Supprimer l'objet correspondant en vérifiant qu'il n'est pas null
            updatedFavorites = storedFavorites.filter(
                (fav: { id_jpo?: number; intitule?: string } | null) =>
                    fav && (fav.id_jpo !== formation.id_jpo || fav.intitule !== formation.intitule),
            )
        } else {
            // Ajouter un nouvel objet à la liste des favoris
            updatedFavorites = [...storedFavorites, { id_jpo: formation.id_jpo, intitule: formation.intitule }]
        }

        // Sauvegarde dans localStorage
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
        setIsFavorite(!isFavorite)

        // Déclencher un événement global pour informer les autres composants
        window.dispatchEvent(new Event("favoritesUpdated"))
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date)
    }

    const downloadICS = (jpo: { date: string; heure: string }) => {
        const formatICSDate = (dateStr: string, timeStr: string) => {
            const [year, month, day] = dateStr.split("-")
            const [hour, minute] = timeStr.split(":")
            return `${year}${month}${day}T${hour}${minute}00`
        }

        const startDate = formatICSDate(jpo.date, jpo.heure)
        const endDate = formatICSDate(
            jpo.date,
            `${Number.parseInt(jpo.heure.split(":")[0]) + 2}:${jpo.heure.split(":")[1]}`,
        )

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Journée Portes Ouvertes - ${formation.nom_composante}
DTSTART:${startDate}
DTEND:${endDate}
LOCATION:${formation.adresse}, ${formation.nom_ville} ${formation.code_postal}
DESCRIPTION:Journée Portes Ouvertes pour la formation ${formation.intitule || formation.nom_composante} à ${formation.nom_etablissement}. Tel: ${formation.tel}. Site web: ${formation.site_web}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `JPO_${formation.nom_composante.replace(/\s+/g, "_")}.ics`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const shareOnSocial = (network: string) => {
        const title = `Formation: ${formation.nom_composante} - ${formation.nom_etablissement}`
        const text = `Découvrez la formation ${formation.nom_composante} à ${formation.nom_etablissement}`
        const url = window.location.href

        let shareUrl = ""

        switch (network) {
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                break
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
                break
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
                break
            default:
                break
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400")
        }
    }

    const openGoogleMaps = () => {
        let destination = ""

        // Vérifier si les coordonnées sont disponibles
        if (formation.coordonnees) {
            try {
                // Extraire les coordonnées de la chaîne
                const coordsMatch = formation.coordonnees.match(/$$([^,]+),([^)]+)$$/)
                if (coordsMatch && coordsMatch.length === 3) {
                    destination = `${formation.adresse}, ${formation.nom_ville} ${formation.code_postal}`
                } else {
                    // Si le format ne correspond pas à ce qui est attendu, utiliser l'adresse
                    destination = `${formation.adresse}, ${formation.nom_ville} ${formation.code_postal}`
                }
            } catch (error) {
                console.error("Erreur lors du traitement des coordonnées:", error)
                destination = `${formation.adresse}, ${formation.nom_ville} ${formation.code_postal}`
            }
        } else {
            // Si pas de coordonnées, utiliser l'adresse
            destination = `${formation.adresse}, ${formation.nom_ville} ${formation.code_postal}`
        }

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
        window.open(googleMapsUrl, "_blank")
    }

    const isStage = formation.stages === "Oui"
    const isStageEtranger = formation.stages_etranger === "Oui"

    // Déterminer si cette formation est recommandée par l'IA
    const isRecommended = formation.aiRecommended || false

    // Déterminer la classe du bandeau en fonction du score de pertinence
    const getBadgeStyle = () => {
        if (formation.relevanceScore === undefined) return "";
        if (formation.relevanceScore > 4) return "bg-green-100 border-green-500 text-green-700";
        if (formation.relevanceScore > 3) return "bg-blue-100 border-blue-500 text-blue-700";
        return "bg-gray-100 border-gray-300 text-gray-700";
    }

    return (
        <Card className={`w-full max-w-md overflow-hidden transition-all hover:shadow-lg ${isRecommended ? 'ring-2 ring-primary/50' : ''}`}>
            {/* Bannière de recommandation IA si applicable */}
            {isRecommended && (
                <div className="bg-primary/10 py-1 px-2 text-xs flex items-center justify-center text-primary font-medium">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Recommandé par notre IA
                </div>
            )}

            {/* Score de pertinence si disponible */}
            {formation.relevanceScore !== undefined && (
                <div className={`py-1 px-2 text-xs border-l-4 ${getBadgeStyle()}`}>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Score de pertinence</span>
                        <span className="font-bold">{formation.relevanceScore}/5</span>
                    </div>
                </div>
            )}

            <CardHeader className="bg-primary/5 pb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="text-xl font-bold">
                            {formation.intitule || formation.nom_composante}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {formation.nom_diplome || "Diplôme non spécifié"}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary text-primary-foreground self-start sm:self-auto">
                            {formation.duree || "3"} ans
                        </Badge>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={toggleFavorite}>
                                        <Bookmark
                                            className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                                        />
                                        <span className="sr-only">{isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="flex-1 break-words">{formation.nom_etablissement}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="flex-1 break-words">
                            {formation.nom_ville} ({formation.code_postal}), {formation.nom_region}
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                            JPO: {formatDate(formation.date)} à {formation.heure}
                        </span>
                    </div>
                </div>

                {/* Caractéristiques principales sous forme de badges */}
                <div className="flex flex-wrap gap-2">
                    {isStage && (
                        <Badge variant="secondary">Stage</Badge>
                    )}
                    {isStageEtranger && (
                        <Badge variant="secondary">Stage à l'étranger</Badge>
                    )}
                    {formation.double_diplome === "Oui" && (
                        <Badge variant="secondary">Double diplôme</Badge>
                    )}
                    {formation.relations_internationales === "Oui" && (
                        <Badge variant="secondary">Relations internationales</Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t pt-4 pb-4 bg-muted/10">
                {/* Bouton principal - Voir détails */}
                <Popover>
                    <PopoverTrigger className="text-white bg-slate-950 px-4 py-2 rounded-md w-full">
                        Voir les détails
                    </PopoverTrigger>
                    <PopoverContent className="bg-slate-950 text-white p-4 rounded-md shadow-lg space-y-2">
                        <p><strong>Description :</strong> {formation.debouches}</p>
                        <p><strong>Stages :</strong> {formation.stages ? "Oui" : "Non"}</p>
                        <p><strong>Stages à l'étranger :</strong> {formation.stages_etranger ? "Oui" : "Non"}</p>
                        <p><strong>Double diplôme :</strong> {formation.double_diplome ? "Oui" : "Non"}</p>
                        <p><strong>Relations internationales :</strong> {formation.relations_internationales ? "Oui" : "Non"}</p>
                    </PopoverContent>
                </Popover>

                {/* Actions secondaires */}
                <div className="grid grid-cols-3 gap-2 w-full">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center"
                        onClick={() => window.open(formation.site_web, "_blank")}
                    >
                        <Globe className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Site web</span>
                    </Button>

                    <Button variant="outline" size="sm" className="flex items-center justify-center" onClick={openGoogleMaps}>
                        <Navigation className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Itinéraire</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadICS(formation)}
                        className="flex items-center justify-center"
                    >
                        <CalendarPlus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Calendrier</span>
                    </Button>
                </div>

                {/* Menu de partage */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full flex items-center justify-center">
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Partager</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-[200px]">
                        <DropdownMenuItem onClick={() => shareOnSocial("facebook")} className="cursor-pointer">
                            <Facebook className="mr-2 h-4 w-4" />
                            Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareOnSocial("twitter")} className="cursor-pointer">
                            <Twitter className="mr-2 h-4 w-4" />
                            Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareOnSocial("linkedin")} className="cursor-pointer">
                            <Linkedin className="mr-2 h-4 w-4" />
                            LinkedIn
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    )
}
