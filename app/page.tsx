'use client'

import Accueil from '@/components/acceuil';
import DonutBackground from '@/components/arriere';

export default function Home() {
  return (
    <div className="relative h-screen w-full">
      {/* Utilisation du composant DonutBackground comme arrière-plan */}
      <DonutBackground />
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Utilisation du composant Accueil centré au milieu de l'écran */}
        <Accueil />
      </div>
    </div>
  );
}
