import type { ReactNode } from "react";
import estilos from "./Aviso.module.css";

/**
 * Resultado de um formulário. O de erro é anunciado na hora por leitores de
 * tela; o de sucesso, sem interromper.
 */
export function Aviso({
  tom,
  titulo,
  children,
}: {
  tom: "erro" | "sucesso";
  titulo?: string;
  children?: ReactNode;
}) {
  return (
    <div className={estilos[tom]} role={tom === "erro" ? "alert" : "status"}>
      {titulo && <strong>{titulo}</strong>}
      {children}
    </div>
  );
}
