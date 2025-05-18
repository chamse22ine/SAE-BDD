"use client"

import { useEffect, useState, useCallback } from "react"
import { FormationCard } from "@/components/formation-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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
}

export function Favoris() {
    const [favoris, setFavoris] = useState<Formation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [allFormations, setAllFormations] = useState<Formation[]>([])

    // Fonction pour mettre à jour les favoris
    const updateFavorites = useCallback((formations: Formation[]) => {
        try {
            const storedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]")

            if (!Array.isArray(storedFavorites)) {
                console.warn("Favoris corrompus dans localStorage, réinitialisation...")
                localStorage.setItem("favorites", JSON.stringify([]))
                setFavoris([])
                return
            }

            const filteredFavorites = formations.filter((formation) =>
                storedFavorites.some(
                    (fav: { id_jpo: number; intitule: string }) =>
                        fav.id_jpo === formation.id_jpo && fav.intitule === formation.intitule,
                ),
            )

            // Supprimer les doublons avec un Set basé sur `id_jpo`
            const uniqueFavorites = Array.from(new Map(filteredFavorites.map((f) => [f.id_jpo, f])).values())

            setFavoris(uniqueFavorites)
        } catch (error) {
            console.error("Erreur lors du filtrage des favoris:", error)
        }
    }, [])

    // Charger les formations au démarrage
    useEffect(() => {
        const loadFormations = async () => {
            setIsLoading(true)

            try {
                const response = await fetch("/api/data")
                if (!response.ok) {
                    throw new Error("Échec du chargement des formations")
                }

                const formations = await response.json()
                setAllFormations(formations)

                updateFavorites(formations)
            } catch (error) {
                console.error("Erreur:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadFormations()
    }, [updateFavorites])

    // Écouter les changements de favoris
    useEffect(() => {
        const handleFavoritesUpdate = () => {
            updateFavorites(allFormations)
        }

        window.addEventListener("favoritesUpdated", handleFavoritesUpdate)

        return () => {
            window.removeEventListener("favoritesUpdated", handleFavoritesUpdate)
        }
    }, [allFormations, updateFavorites])

    return (
        <Card className="w-full max-w-3xl mx-auto mt-6 p-4">
            <CardHeader>
                <CardTitle>Mes Favoris ({favoris.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-center">Chargement des favoris...</p>
                ) : favoris.length > 0 ? (
                    <div className="grid gap-4">
                        {favoris.map((formation) => (
                            <FormationCard key={`${formation.id_jpo}-${formation.intitule}`} formation={formation} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">Aucune formation en favoris.</p>
                )}
            </CardContent>
        </Card>
    )
}

