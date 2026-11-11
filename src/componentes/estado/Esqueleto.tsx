import type { CSSProperties } from "react";
import estilos from "./Estados.module.css";

interface EsqueletoProps {
  largura?: number | string;
  altura?: number | string;
  arredondado?: boolean;
}

const medida = (valor: number | string) => (typeof valor === "number" ? `${valor}px` : valor);

/** Bloco cinza que ocupa o espaço do conteúdo enquanto ele não chega. */
export function Esqueleto({ largura = "100%", altura = 14, arredondado = false }: EsqueletoProps) {
  return (
    <span
      className={`${estilos.esqueleto} ${arredondado ? estilos.esqueletoArredondado : ""}`}
      // Largura e altura variam por uso; o visual fica no CSS.
      style={{ "--esqueleto-largura": medida(largura), "--esqueleto-altura": medida(altura) } as CSSProperties}
      aria-hidden="true"
    />
  );
}

/** Grade de cards em esqueleto, no mesmo formato do feed. */
export function EsqueletoDeAnuncios({ quantidade = 6 }: { quantidade?: number }) {
  return (
    <div className={estilos.grade} role="status" aria-live="polite">
      <span className="apenas-leitor-de-tela">Carregando anúncios…</span>
      {Array.from({ length: quantidade }, (_, indice) => (
        <div key={indice} className={estilos.cardEsqueleto}>
          <Esqueleto largura={120} altura={20} arredondado />
          <Esqueleto altura={18} />
          <Esqueleto largura="80%" altura={14} />
          <Esqueleto altura={38} />
          <Esqueleto largura="55%" altura={14} />
        </div>
      ))}
    </div>
  );
}
