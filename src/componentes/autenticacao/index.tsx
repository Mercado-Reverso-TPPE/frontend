import estilos from "./Autenticacao.module.css";

export { estilos as estilosDeAutenticacao };
export { Aviso } from "@/componentes/estado";

/** Título e subtítulo das telas de entrar, criar conta e redefinir senha. */
export function CabecalhoDeAutenticacao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className={estilos.cabecalho}>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </div>
  );
}
