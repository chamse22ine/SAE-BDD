// Directive 'use client' pour indiquer que ce composant est rendu côté client
"use client"

// Importation des hooks et modules nécessaires
import { useRef, useMemo } from "react"; // Importation des hooks useRef et useMemo de React
import type * as THREE from "three"; // Importation des types de la bibliothèque Three.js
import { Canvas, useFrame } from "@react-three/fiber"; // Importation de Canvas et useFrame de react-three/fiber
import { OrbitControls } from "@react-three/drei"; // Importation des contrôles de caméra OrbitControls

// Définition de l'interface pour les props du composant Donut
interface DonutProps {
    position: [number, number, number]; // Position du donut dans l'espace 3D
    rotation: [number, number, number]; // Rotation du donut
    scale: number; // Échelle du donut
}

// Composant fonctionnel Donut
const Donut = ({ position, rotation, scale }: DonutProps) => {
    const meshRef = useRef<THREE.Mesh>(null); // Référence pour le maillage 3D

    // Utilisation de useFrame pour animer le donut à chaque frame
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.5; // Rotation autour de l'axe X
            meshRef.current.rotation.y += delta * 0.7; // Rotation autour de l'axe Y
        }
    });

    return (
        <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
            <torusGeometry args={[1, 0.4, 16, 32]} /> {/* Géométrie du tore */}
            <meshNormalMaterial /> {/* Matériau basé sur les normales du maillage */}
        </mesh>
    );
};

// Composant fonctionnel DonutField pour générer un champ de donuts
const DonutField = ({ count = 50 }) => {
    // Utilisation de useMemo pour mémoriser les donuts et éviter les recalculs inutiles
    const donuts = useMemo(() => {
        return new Array(count).fill(null).map((_, i) => ({
            position: [Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
            scale: Math.random() * 0.5 + 0.5,
        }));
    }, [count]);

    return (
        <>
            {donuts.map((props, i) => (
                <Donut key={`${props.position}-${props.rotation}-${props.scale}`} {...props} />
            ))}
        </>
    );
};

// Composant fonctionnel DonutBackground pour l'arrière-plan
export default function DonutBackground() {
    return (
        <div className="fixed inset-0 bg-gradient-to-b from-pink-200 to-purple-300">
            <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
                <ambientLight intensity={0.5} /> {/* Lumière ambiante */}
                <pointLight position={[10, 10, 10]} /> {/* Lumière ponctuelle */}
                <DonutField /> {/* Champ de donuts */}
                <OrbitControls enableZoom={false} /> {/* Contrôles de caméra */}
            </Canvas>
        </div>
    );
}
