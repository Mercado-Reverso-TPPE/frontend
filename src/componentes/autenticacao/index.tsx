import type { ReactNode } from "react";
import estilos from "./Autenticacao.module.css";

export { estilos as estilosDeAutenticacao };

/** Título e subtítulo das telas de entrar, criar conta e redefinir senha. */
export function CabecalhoDeAutenticacao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className={estilos.cabecalho}>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </div>
  );
}

/**
 * Aviso de resultado do formulário. O de erro é anunciado na hora por
 * leitores de tela; o de sucesso, sem interromper.
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
