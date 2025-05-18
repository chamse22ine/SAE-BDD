"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Accueil() {
    // Utilisation du hook useState pour gérer l'état du message de bienvenue
    const [showWelcome, setShowWelcome] = useState(true);

    // Utilisation du hook useEffect pour gérer les effets secondaires
    useEffect(() => {
        // Définition d'un timer pour masquer le message de bienvenue après 6 secondes
        const timer = setTimeout(() => {
            setShowWelcome(false);
        }, 3000); // 6 secondes pour le message de bienvenue

        // Nettoyage du timer lorsque le composant est démonté
        return () => clearTimeout(timer);
    }, []); // Tableau de dépendances vide pour n'exécuter l'effet qu'une seule fois au montage

    // Définition des textes utilisés dans le composant
    const texteBienvenue = "Bienvenue dans la SAE de base de données des Gourmands !";
    const titrePresentation = "Sujet : Journées Portes Ouvertes des etablissements d'enseignement supérieur en France";
    const textePresentation = "";

    return (
        <div className="relative h-screen overflow-hidden flex items-center justify-center">
            {/* Affichage conditionnel basé sur l'état showWelcome */}
            {showWelcome ? (
                <div
                    className="relative text-center transform -translate-x-1/2 text-3xl font-bold animate-drop"
                    style={{ top: "-100px" }}
                >
                    {texteBienvenue}
                </div>
            ) : (
                <div className="text-center p-5 space-y-6">
                    <h1 className="text-4xl font-semibold mb-4">{titrePresentation}</h1>
                    <p>{textePresentation}</p>
                    {/* Lien de navigation vers la page de recherche */}
                    <Link href="/recherche" passHref>
                        <Button className="mt-4">Aller à la recherche</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
