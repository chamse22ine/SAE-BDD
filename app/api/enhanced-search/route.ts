// app/api/enhanced-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/data";
import { Mistral } from "@mistralai/mistralai";

// Cache simple pour stocker les résultats des requêtes
const searchCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 heure en millisecondes

// Initialiser le client Mistral AI avec vérification de la clé API
const apiKey = process.env.MISTRAL_API_KEY;
// Vérifier que la clé API est définie
if (!apiKey) {
  console.warn(
    "MISTRAL_API_KEY n'est pas défini dans les variables d'environnement"
  );
}
const client = new Mistral({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const { query, filters } = await req.json();

    // Vérifier que la requête est valide
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Une requête de recherche valide est requise" },
        { status: 400 }
      );
    }

    // Générer une clé de cache basée sur la requête et les filtres
    const cacheKey = JSON.stringify({ query, filters });

    // Vérifier si nous avons un résultat en cache et s'il est encore valide
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult.data);
    }

    // 1. Récupérer les données brutes de la base de données
    // Requête SQL corrigée
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
    const allData = result.rows;

    // Si aucune donnée n'est trouvée, retourner un message approprié
    if (!allData || allData.length === 0) {
      return NextResponse.json({
        results: [],
        message: "Aucune formation trouvée dans la base de données",
      });
    }

    // 2. Utiliser Mistral AI pour analyser la requête et trouver les résultats pertinents
    const mistralResponse = await client.chat.complete({
      model: "mistral-large-latest", // Ou "mistral-medium" selon vos besoins
      messages: [
        {
          role: "system",
          content: `Tu es un assistant spécialisé dans l'aide à la recherche d'établissements et de formations pour les journées portes ouvertes. 
          Ta mission est double:
          
          1. Analyser la requête utilisateur et extraire:
             - Les mots clés pertinents (formations, disciplines, domaines d'études)
             - Les contraintes géographiques (villes, régions)
             - Les types d'établissements/diplômes recherchés
          
          2. Recommander des formations correspondant aux critères avec une explication de leur pertinence.
          
          Réponds UNIQUEMENT au format JSON avec la structure suivante:
          {
            "enhancedQuery": string, // Requête reformulée et enrichie
            "keywords": string[], // Mots-clés extraits
            "filters": { // Suggestions de filtres
              "region": string[] | null, 
              "ville": string[] | null,
              "diplome": string[] | null
            },
            "explanation": string, // Explication courte de l'interprétation de la recherche
            "recommendations": number[] // IDs des formations les plus pertinentes (IDs id_jpo)
          }`,
        },
        {
          role: "user",
          content: `Requête utilisateur: "${query}"
          
          Données disponibles (échantillon limité à 5 éléments):
          ${JSON.stringify(allData.slice(0, 5), null, 2)}
          
          Le jeu complet contient  $ {allData.length} formations. 
          Analyse cette requête et suggère les formations les plus pertinentes.
          Retourne SEULEMENT un objet JSON valide sans autre texte.`,
        },
      ],
      temperature: 0.2, // Température basse pour des réponses plus déterministes
      maxTokens: 1024,
    });

    // Extraire la réponse JSON
    let aiSuggestions;
    try {
      const content = mistralResponse.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Le contenu de la réponse est invalide ou manquant");
      }

      // Essayer d'abord de parser directement
      try {
        aiSuggestions = JSON.parse(content);
      } catch {
        // Si échec, essayer d'extraire le JSON avec des regex
        const jsonMatch =
          content.match(/```json\n([\s\S]*?)\n```/) ||
          content.match(/```([\s\S]*?)```/) ||
          content.match(/({[\s\S]*?})/);

        if (jsonMatch && jsonMatch[1]) {
          aiSuggestions = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Format JSON non reconnu dans la réponse");
        }
      }
    } catch (error) {
      console.error("Erreur de parsing JSON:", error);
      console.log(
        "Réponse brute:",
        mistralResponse.choices?.[0]?.message?.content
      );

      // Fallback avec une structure de base
      aiSuggestions = {
        enhancedQuery: query,
        keywords: query.split(/\s+/).filter((k) => k.length > 3),
        filters: {
          region: null,
          ville: null,
          diplome: null,
        },
        explanation: "L'analyse n'a pas pu être effectuée correctement.",
        recommendations: [],
      };
    }

    // 3. Filtrer les formations en fonction de l'analyse IA
    let filteredResults = [...allData]; // Copier le tableau pour éviter de modifier l'original

    // Si des mots-clés ont été identifiés, les utiliser pour le filtrage textuel
    if (aiSuggestions.keywords && aiSuggestions.keywords.length > 0) {
      const keywords = aiSuggestions.keywords.map(
        (kw: any) =>
          new RegExp(kw.replace(/[-\/\\^ $ *+?.()|[\]{}]/g, "\\$&"), "i")
      );

      // Ajouter un score de pertinence aux résultats
      filteredResults = filteredResults.map((item) => {
        let score = 0;
        // Champs à vérifier pour les correspondances de mots-clés
        const fieldsToCheck = [
          item.intitule,
          item.nom_etablissement,
          item.nom_composante,
          item.debouches,
          item.nom_diplome,
        ].filter(Boolean);

        // Calculer le score basé sur les correspondances
        keywords.forEach((regex: any) => {
          fieldsToCheck.forEach((field) => {
            if (field && regex.test(field)) {
              score += 1;
            }
          });
        });

        return { ...item, relevanceScore: score };
      });

      // Trier par score de pertinence (du plus élevé au plus bas)
      filteredResults.sort(
        (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
      );
    }

    // Si l'IA a suggéré des formations spécifiques, prioritiser celles-ci
    if (
      aiSuggestions.recommendations &&
      aiSuggestions.recommendations.length > 0
    ) {
      const recommendedIds = new Set(aiSuggestions.recommendations);
      // Réorganiser les résultats: d'abord les recommandations, puis le reste
      filteredResults = [
        ...filteredResults.filter((item) => recommendedIds.has(item.id_jpo)),
        ...filteredResults.filter((item) => !recommendedIds.has(item.id_jpo)),
      ];
    }

    // 4. Appliquer les filtres traditionnels si spécifiés
    if (filters) {
      // Filtrer par région
      if (filters.regionFilter && filters.regionFilter !== "all") {
        filteredResults = filteredResults.filter(
          (item) => item.nom_region === filters.regionFilter
        );
      }

      // Filtrer par type de diplôme
      if (filters.typeFilter && filters.typeFilter !== "all") {
        filteredResults = filteredResults.filter(
          (item) => item.nom_diplome === filters.typeFilter
        );
      }

      // Filtrer par ville si défini
      if (filters.villeFilter && filters.villeFilter !== "all") {
        filteredResults = filteredResults.filter(
          (item) => item.nom_ville === filters.villeFilter
        );
      }

      // Filtrer par établissement si défini
      if (
        filters.etablissementFilter &&
        filters.etablissementFilter !== "all"
      ) {
        filteredResults = filteredResults.filter(
          (item) => item.nom_etablissement === filters.etablissementFilter
        );
      }
    }

    // Stocker le résultat dans le cache
    const resultToCache = {
      results: filteredResults,
      aiSuggestions,
      totalResults: filteredResults.length,
    };
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: resultToCache,
    });

    return NextResponse.json(resultToCache);
  } catch (error) {
    console.error("Erreur lors de la recherche avancée:", error);
    return NextResponse.json(
      {
        error:
          "Erreur lors de la recherche: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
