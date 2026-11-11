import type { ReactNode } from "react";
import estilos from "./Chip.module.css";
import { fmtCompactoDeContagem } from "./contagem";
import { fmtPlural } from "@/utils/formato";

interface ChipProps {
  children: ReactNode;
  /** Estado selecionado: vira também `aria-pressed` para leitores de tela. */
  ativo?: boolean;
  /** Quantidade de anúncios na categoria. */
  contagem?: number;
  onClick?: () => void;
  title?: string;
}

/** Chip de filtro — categorias do feed e taxonomias. */
export function Chip({ children, ativo = false, contagem, onClick, title }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title={title}
      aria-label={contagem !== undefined && typeof children === "string" ? `${children} (${fmtPlural(contagem, "anúncio")})` : undefined}
      className={`${estilos.chip} ${ativo ? estilos.ativo : ""}`}
    >
      {children}
      {contagem !== undefined && (
        <span className={estilos.contagem} aria-hidden="true">
          {fmtCompactoDeContagem(contagem)}
        </span>
      )}
    </button>
  );
}
