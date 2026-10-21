import type { ReactNode } from "react";
import estilos from "./Chip.module.css";
import { fmtCompactoDeContagem } from "./contagem";

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
      className={`${estilos.chip} ${ativo ? estilos.ativo : ""}`}
    >
      {children}
      {contagem !== undefined && (
        <span className={estilos.contagem}>{fmtCompactoDeContagem(contagem)}</span>
      )}
    </button>
  );
}
