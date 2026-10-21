import estilos from "./Estados.module.css";

interface CarregandoProps {
  /** O que está carregando — o texto é anunciado por leitores de tela. */
  rotulo?: string;
  /** Spinner e texto na mesma linha, para áreas pequenas. */
  emLinha?: boolean;
}

/** Estado de carregamento padrão da SPA. */
export function Carregando({ rotulo = "Carregando…", emLinha = false }: CarregandoProps) {
  return (
    <div
      className={`${estilos.caixa} ${emLinha ? estilos.emLinha : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className={estilos.girando} aria-hidden="true" />
      <span className={estilos.rotuloDeCarregamento}>{rotulo}</span>
    </div>
  );
}
