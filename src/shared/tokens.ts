export const T = {
  primary: "#D97338",
  pLight: "#FFF4EE",
  pBorder: "#F5D5C0",
  bg: "#FFFFFF",
  bgMuted: "#F8F8F8",
  border: "#E8E8E8",
  text: "#1A1A1A",
  textMid: "#666666",
  textLight: "#999999",
  success: "#34C759",
  successBg: "#F0FBF4",
  successBorder: "#D1F0DC",
  error: "#FF3B30",
  errorBg: "#FFF0EF",
  info: "#007AFF",
  infoBg: "#F0F8FF",
  CAT: {
    "Eletrônicos": "#007AFF",
    "Veículos": "#34C759",
    "Informática": "#5856D6",
    "Games": "#FF2D55",
    "Esportes": "#30B0D0",
    "Casa & Jardim": "#FF9500",
    "Instrumentos": "#FFD60A",
    "Outros": "#8E8E93",
  } as Record<string, string>,
  font: {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
  },
  shadow: {
    sm: "0 1px 4px rgba(0,0,0,.05)",
    md: "0 4px 16px rgba(0,0,0,.08)",
    primary: "0 4px 16px rgba(217,115,56,.25)",
  },
};

export const catColor = (cat: string) => T.CAT[cat] ?? "#8E8E93";
export const fmtPrice = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
export const fmtRange = (min: number, max: number) => {
  const f = (n: number) => n >= 1000 ? `R$ ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `R$ ${n}`;
  return `${f(min)} — ${f(max)}`;
};
