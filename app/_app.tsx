import { useEffect } from "react";

export default function CallyLoader() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/cally";
    document.body.appendChild(script);
  }, []);

  return null; // Ne rien afficher, on charge juste le script
}

