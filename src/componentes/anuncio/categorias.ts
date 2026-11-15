const ICONES: Record<string, string> = {
  "Eletrônicos": "📱",
  "Veículos": "🚗",
  "Informática": "💻",
  "Games": "🎮",
  "Esportes": "⚽",
  "Casa & Jardim": "🏡",
  "Instrumentos": "🎸",
};

/** Ícone da categoria, usado no lugar da foto que falta. */
export const iconeDaCategoria = (categoria: string) => ICONES[categoria] ?? "📦";
