import type { CSSProperties } from "react";
import { Link } from "react-router";
import { ISearch } from "@/componentes/icones";
import estilos from "./Logo.module.css";

/**
 * Logotipo da marca: lupa branca sobre quadrado laranja e a palavra em
 * minúsculas com o ponto final — o ponto é parte do logotipo.
 */
export function Logo({ tamanho = 34, link = true }: { tamanho?: number; link?: boolean }) {
  // Só o tamanho vem por prop; cores, fonte e proporções ficam no CSS.
  const tamanhoDoLogo = { "--logo-tamanho": `${tamanho}px` } as CSSProperties;
  const marca = (
    <>
      <span className={estilos.icone} aria-hidden="true">
        <ISearch size={Math.round(tamanho * 0.5)} color="currentColor" />
      </span>
      <span className={estilos.palavra}>
        quero<span className={estilos.ponto}>.</span>
      </span>
    </>
  );

  return link ? (
    <Link to="/" className={estilos.logo} style={tamanhoDoLogo} aria-label="Quero., página inicial">
      {marca}
    </Link>
  ) : (
    <span className={estilos.logo} style={tamanhoDoLogo}>
      {marca}
    </span>
  );
}
