// Importation des modules nécessaires
import { NextResponse } from "next/server"; // Importation de NextResponse pour gérer les réponses HTTP
import pool from "@/data"; // Importation de la configuration de la base de données

// Définition de la fonction GET pour récupérer les données
export async function GET() {
  try {
    // Exécution de la requête SQL pour récupérer les données
    const result = await pool.query(`
      SELECT
        j.id_jpo, j.date, j.heure,                                  -- Sélection des informations sur les journées portes ouvertes (JPO)
        c.id_composante, c.nom_composante, c.adresse, c.coordonnees, -- Sélection des informations sur les composantes
        v.id_ville, v.nom_ville, v.code_postal,                     -- Sélection des informations sur les villes
        r.nom_region,                                               -- Sélection du nom de la région
        e.id_etablissement, e.nom_etablissement, e.tel, e.site_web,-- Sélection des informations sur les établissements
        t.nom_diplome, t.duree,                                     -- Sélection des informations sur les types de diplômes
        f.intitule, f.stages, f.stages_etranger, f.debouches,       -- Sélection des informations sur les formations
        f.double_diplome, f.relations_internationales               -- Sélection des informations sur les relations internationales
      FROM jpo j                                                    -- Table principale des journées portes ouvertes
      LEFT JOIN composante c ON j.id_composante = c.id_composante   -- Jointure avec la table des composantes
      LEFT JOIN ville v ON c.id_ville = v.id_ville                  -- Jointure avec la table des villes
      LEFT JOIN departement d ON v.num_dep = d.num_dep              -- Jointure avec la table des départements
      LEFT JOIN region r ON d.num_region = r.num_region             -- Jointure avec la table des régions
      LEFT JOIN etablissement e ON c.id_etablissement = e.id_etablissement -- Jointure avec la table des établissements
      LEFT JOIN formation f ON c.id_composante = f.id_type_formation -- Jointure avec la table des formations
      LEFT JOIN type_formation t ON f.id_type_formation = t.id_type_formation -- Jointure avec la table des types de formations
    `);

    // Retourne les données récupérées sous forme de réponse JSON
    return NextResponse.json(result.rows);
  } catch (err) {
    // En cas d'erreur, log l'erreur et retourne une réponse d'erreur
    console.error(err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
