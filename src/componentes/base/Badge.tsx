import type { ReactNode } from "react";
import estilos from "./Badge.module.css";

export type TomDeBadge = "info" | "marca" | "sucesso" | "erro" | "aviso" | "neutro";

interface BadgeProps {
  /** Rótulo textual — é ele que carrega o significado, nunca a cor. */
  children: ReactNode;
  tom?: TomDeBadge;
  /** Emoji ou ícone decorativo; fica oculto para leitores de tela. */
  icone?: ReactNode;
  /** Cor do token da categoria, quando o badge representa taxonomia. */
  cor?: string;
}

/**
 * Badge de estado ou taxonomia.
 *
 * A identidade visual proíbe sinalizar estado só por cor: o rótulo é
 * obrigatório e o ícone é sempre decorativo.
 */
export function Badge({ children, tom = "neutro", icone, cor }: BadgeProps) {
  const estiloDaCategoria = cor
    ? {
        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
        color: cor,
      }
    : undefined;

  return (
    <span className={`${estilos.badge} ${estilos[tom]}`} style={estiloDaCategoria}>
      {icone !== undefined && <span aria-hidden="true">{icone}</span>}
      {children}
    </span>
  );
}
