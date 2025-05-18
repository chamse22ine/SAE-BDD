"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { FormationCard } from "@/components/formation-card"
import { Input } from "@/components/ui/input"
import { Search, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { Favoris } from "@/components/favoris"
import debounce from "lodash/debounce"

// Import dynamique du composant FranceMap pour éviter le rendu côté serveur
const FranceMap = dynamic(() => import("../../components/carteFrance"), { ssr: false })

// Définition des interfaces
interface Formation {
    id_jpo: string
    intitule?: string
    nom_etablissement?: string
    nom_ville?: string
    nom_region?: string
    nom_diplome?: string
    nom_composante: string
    date?: string
    heure?: string
    adresse?: string
    code_postal?: string
    relevanceScore?: number
}

interface AISuggestions {
    enhancedQuery: string;
    keywords: string[];
    filters: {
        region: string[] | null;
        ville: string[] | null;
        diplome: string[] | null;
    };
    explanation: string;
    recommendations: string[];
}

export default function FormationsPage() {
    // États pour gérer les données et l'état de l'application
    const [formations, setFormations] = useState<Formation[]>([])
    const [allFormations, setAllFormations] = useState<Formation[]>([]) // Stocke toutes les formations non filtrées
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 9
    const [regionFilter, setRegionFilter] = useState<string>("all")
    const [villeFilter, setVilleFilter] = useState<string>("all")
    const [etablissementFilter, setEtablissementFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [isSearching, setIsSearching] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const listContentRef = useRef<HTMLDivElement>(null)

    // Nouveaux états pour l'intégration de Mistral AI
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null)
    const [isAiLoading, setIsAiLoading] = useState(false)
    const [showAiSuggestions, setShowAiSuggestions] = useState(false)

    // État pour les options de filtres
    const [regionsOptions, setRegionsOptions] = useState<string[]>([])
    const [villesOptions, setVillesOptions] = useState<string[]>([])
    const [etablissementsOptions, setEtablissementsOptions] = useState<string[]>([])
    const [diplomesOptions, setDiplomesOptions] = useState<string[]>([])

    // Fonction debounced pour la recherche standard
    const debouncedSearch = useCallback(
        debounce((value) => {
            setIsSearching(false)
            setCurrentPage(1)

            // Si la recherche est vide, utiliser toutes les formations
            if (!value.trim()) {
                applyFiltersToFormations(allFormations)
                return
            }

            // Sinon, filtrer manuellement
            const filtered = allFormations.filter((formation) => {
                const searchTerms = value.toLowerCase().split(/\s+/)

                const formationIntitule = formation.intitule?.toLowerCase() || ""
                const formationEtablissement = formation.nom_etablissement?.toLowerCase() || ""
                const formationVille = formation.nom_ville?.toLowerCase() || ""
                const formationRegion = formation.nom_region?.toLowerCase() || ""
                const formationComposante = formation.nom_composante?.toLowerCase() || ""
                const formationDiplome = formation.nom_diplome?.toLowerCase() || ""

                return searchTerms.every(
                    (term) =>
                        formationIntitule.includes(term) ||
                        formationEtablissement.includes(term) ||
                        formationVille.includes(term) ||
                        formationRegion.includes(term) ||
                        formationComposante.includes(term) ||
                        formationDiplome.includes(term)
                )
            })

            applyFiltersToFormations(filtered)

            // Forcer un rafraîchissement du contenu de la liste
            setRefreshKey((prev) => prev + 1)

            if (listContentRef.current) {
                listContentRef.current.style.opacity = "0"
                setTimeout(() => {
                    if (listContentRef.current) {
                        listContentRef.current.style.opacity = "1"
                    }
                }, 300)
            }
        }, 300),
        [allFormations],
    )

    // Fonction pour effectuer une recherche améliorée avec Mistral
    const performAiSearch = async (query: string) => {
        if (!query.trim()) return

        setIsAiLoading(true)
        setShowAiSuggestions(true)

        try {
            const response = await fetch('/api/enhanced-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    filters: {
                        regionFilter,
                        villeFilter,
                        etablissementFilter,
                        typeFilter
                    }
                })
            })

            const data = await response.json()

            if (data.error) {
                console.error("Erreur de recherche AI:", data.error)
                return
            }

            // Mettre à jour les résultats et les suggestions
            setFormations(data.results || [])
            setAiSuggestions(data.aiSuggestions)
            setCurrentPage(1)

        } catch (error) {
            console.error("Erreur lors de la recherche améliorée:", error)
        } finally {
            setIsAiLoading(false)
            setIsSearching(false)

            // Animation
            if (listContentRef.current) {
                listContentRef.current.style.opacity = "0"
                setTimeout(() => {
                    if (listContentRef.current) {
                        listContentRef.current.style.opacity = "1"
                    }
                }, 300)
            }

            setRefreshKey(prev => prev + 1)
        }
    }

    // Appliquer les filtres aux formations
    const applyFiltersToFormations = (formationsToFilter: Formation[]) => {
        const filtered = formationsToFilter.filter(formation => {
            const matchesRegion = regionFilter === "all" || formation.nom_region === regionFilter
            const matchesType = typeFilter === "all" || formation.nom_diplome === typeFilter
            const matchesVille = villeFilter === "all" || formation.nom_ville === villeFilter
            const matchesEtablissement = etablissementFilter === "all" ||
                formation.nom_etablissement === etablissementFilter

            return matchesRegion && matchesType && matchesVille && matchesEtablissement
        })

        setFormations(filtered)
    }

    // Gestionnaire de changement pour la barre de recherche
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        setIsSearching(true)

        // Réinitialiser l'état des suggestions AI
        if (!value.trim()) {
            setShowAiSuggestions(false)
            setAiSuggestions(null)
        }

        debouncedSearch(value)
    }

    // Effet pour récupérer les données de formation depuis l'API
    useEffect(() => {
        async function fetchData() {
            try {
                // Récupérer les formations
                const formationsResponse = await fetch("/api/data")
                const formationsData = await formationsResponse.json()

                if (Array.isArray(formationsData)) {
                    setAllFormations(formationsData)
                    setFormations(formationsData)
                } else {
                    console.error("Les données récupérées ne sont pas un tableau:", formationsData)
                }

                // Récupérer les options de filtres
                const filtersResponse = await fetch("/api/filters")
                const filtersData = await filtersResponse.json()

                setRegionsOptions(filtersData.regions || [])
                setVillesOptions(filtersData.villes || [])
                setEtablissementsOptions(filtersData.etablissements || [])
                setDiplomesOptions(filtersData.diplomes || [])

            } catch (error) {
                console.error("Erreur lors de la récupération des données:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Effet pour appliquer les filtres quand ils changent
    useEffect(() => {
        if (allFormations.length > 0) {
            if (searchTerm.trim()) {
                // Si une recherche est active, relancer la recherche
                debouncedSearch(searchTerm)
            } else {
                // Sinon, juste appliquer les filtres
                applyFiltersToFormations(allFormations)
            }
        }
    }, [regionFilter, typeFilter, villeFilter, etablissementFilter])

    // Gestionnaires pour les changements de filtres
    const handleRegionChange = (value: string) => {
        setRegionFilter(value)
        setIsSearching(true)
        animateRefresh()
    }

    const handleTypeChange = (value: string) => {
        setTypeFilter(value)
        setIsSearching(true)
        animateRefresh()
    }

    const handleVilleChange = (value: string) => {
        setVilleFilter(value)
        setIsSearching(true)
        animateRefresh()
    }

    const handleEtablissementChange = (value: string) => {
        setEtablissementFilter(value)
        setIsSearching(true)
        animateRefresh()
    }

    // Fonction pour animer le rafraîchissement
    const animateRefresh = () => {
        if (listContentRef.current) {
            listContentRef.current.style.opacity = "0"
        }

        setTimeout(() => {
            setIsSearching(false)
            setRefreshKey((prev) => prev + 1)
            if (listContentRef.current) {
                listContentRef.current.style.opacity = "1"
            }
        }, 300)
    }

    // Fonction pour utiliser une requête améliorée
    const useEnhancedQuery = (query: string) => {
        setSearchTerm(query)
        performAiSearch(query)
    }

    // Fonction pour appliquer un filtre suggéré
    const applyAiSuggestion = (type: 'region' | 'ville' | 'diplome', value: string) => {
        switch (type) {
            case 'region':
                setRegionFilter(value)
                break
            case 'ville':
                setVilleFilter(value)
                break
            case 'diplome':
                setTypeFilter(value)
                break
        }

        // Relancer la recherche
        setTimeout(() => {
            performAiSearch(searchTerm)
        }, 100)
    }

    // Calcul pour la pagination
    const totalFormations = formations.length
    const totalPages = Math.ceil(totalFormations / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalFormations)
    const currentFormations = formations.slice(startIndex, endIndex)
    const placeholdersNeeded = itemsPerPage - currentFormations.length
    const placeholders = Array.from({ length: placeholdersNeeded }, (_, i) => ({
        isPlaceholder: true,
        id: `placeholder-${i}`,
    }))
    const displayItems = [...currentFormations, ...placeholders]

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prevPage) => prevPage + 1)
            window.scrollTo(0, 0)
        }
    }

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1)
            window.scrollTo(0, 0)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
            <div className="container mx-auto py-4 sm:py-8 px-4">
                <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
                    Journées Portes Ouvertes des etablissements d'enseignement supérieur en France
                </h1>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Rechercher une formation, établissement, ville..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={`pl-10 w-full ${isSearching ? "border-primary" : ""}`}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* Bouton de recherche AI */}
                    <Button
                        className="shrink-0"
                        onClick={() => performAiSearch(searchTerm)}
                        disabled={!searchTerm.trim() || isAiLoading}
                    >
                        {isAiLoading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        ) : (
                            <Lightbulb className="h-4 w-4 mr-2" />
                        )}
                        Recherche IA
                    </Button>

                    <Select value={regionFilter} onValueChange={handleRegionChange}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Région" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les régions</SelectItem>
                            {regionsOptions.map(region => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Type de diplôme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            {diplomesOptions.map(diplome => (
                                <SelectItem key={diplome} value={diplome}>{diplome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtres additionnels */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Select value={villeFilter} onValueChange={handleVilleChange}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Ville" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les villes</SelectItem>
                            {villesOptions.map(ville => (
                                <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={etablissementFilter} onValueChange={handleEtablissementChange}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Établissement" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les établissements</SelectItem>
                            {etablissementsOptions.map(etablissement => (
                                <SelectItem key={etablissement} value={etablissement}>{etablissement}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Affichage des suggestions IA */}
                {showAiSuggestions && aiSuggestions && (
                    <Card className="mb-6 bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center">
                                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                                Suggestions intelligentes
                            </CardTitle>
                            <CardDescription>{aiSuggestions.explanation}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {aiSuggestions.keywords.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Mots-clés pertinents</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.keywords.map((keyword, i) => (
                                            <Badge key={i} variant="secondary">{keyword}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiSuggestions.enhancedQuery && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Requête améliorée</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="p-2">{aiSuggestions.enhancedQuery}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => useEnhancedQuery(aiSuggestions.enhancedQuery)}
                                        >
                                            Utiliser cette requête
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {aiSuggestions.filters.region?.length && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Régions suggérées</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.filters.region.map((region, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-blue-100"
                                                onClick={() => applyAiSuggestion('region', region)}
                                            >
                                                {region}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiSuggestions.filters.ville?.length && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Villes suggérées</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.filters.ville.map((ville, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-blue-100"
                                                onClick={() => applyAiSuggestion('ville', ville)}
                                            >
                                                {ville}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiSuggestions.filters.diplome?.length && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Types de formations suggérés</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.filters.diplome.map((diplome, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-blue-100"
                                                onClick={() => applyAiSuggestion('diplome', diplome)}
                                            >
                                                {diplome}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bouton pour masquer les suggestions */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAiSuggestions(false)}
                                className="mt-2"
                            >
                                Masquer les suggestions
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="list" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="list">Liste</TabsTrigger>
                        <TabsTrigger value="map">Carte</TabsTrigger>
                        <TabsTrigger value="favoris">Favoris</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div key={refreshKey} ref={listContentRef} className="transition-opacity duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {formations.length > 0 ? (
                                        displayItems.map((item: any, index) => {
                                            if (item.isPlaceholder) {
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="w-full h-full min-h-[300px] rounded-lg border border-dashed border-gray-300 flex items-center justify-center"
                                                    >
                                                        <p className="text-muted-foreground text-center">Emplacement disponible</p>
                                                    </div>
                                                )
                                            } else {
                                                // Ajouter un badge de score si disponible
                                                return (
                                                    <div key={`${item.id_jpo}-${index}`} className="relative">

                                                        <FormationCard formation={item} />
                                                    </div>
                                                )
                                            }
                                        })
                                    ) : (
                                        <div className="col-span-full text-center py-12">
                                            <h3 className="text-xl font-medium">Aucune formation trouvée</h3>
                                            <p className="text-muted-foreground mt-2">Essayez de modifier vos critères de recherche</p>
                                            {searchTerm && (
                                                <Button
                                                    onClick={() => performAiSearch(searchTerm)}
                                                    className="mt-4"
                                                    disabled={isAiLoading}
                                                >
                                                    <Lightbulb className="h-4 w-4 mr-2" />
                                                    Essayer la recherche IA
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center mt-8">
                                    <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="outline">
                                        Précédent
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} sur {totalPages || 1}
                                    </span>
                                    <Button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        variant="outline"
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="map">
                        <FranceMap />
                    </TabsContent>
                    <TabsContent value="favoris">
                        <Favoris />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
