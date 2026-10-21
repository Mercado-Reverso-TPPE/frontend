import { Link } from "react-router";
import { ISearch } from "@/componentes/icones";
import { T } from "@/estilos/tokens";

/**
 * Logotipo da marca: lupa branca sobre quadrado laranja e a palavra em
 * minúsculas com o ponto final — o ponto é parte do logotipo.
 */
export function Logo({ tamanho = 34, link = true }: { tamanho?: number; link?: boolean }) {
  const marca = (
    <>
      <span
        style={{
          width: tamanho,
          height: tamanho,
          backgroundColor: T.primary,
          borderRadius: Math.round(tamanho * 0.26),
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <ISearch size={Math.round(tamanho * 0.5)} color="#fff" />
      </span>
      <span
        style={{
          fontFamily: T.font.display,
          fontWeight: 700,
          fontSize: Math.round(tamanho * 0.62),
          color: T.text,
          letterSpacing: "-0.6px",
        }}
      >
        quero<span style={{ color: T.primary }}>.</span>
      </span>
    </>
  );

  const estilo = { display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 } as const;

  return link ? (
    <Link to="/" style={estilo} aria-label="Quero., página inicial">
      {marca}
    </Link>
  ) : (
    <span style={estilo}>{marca}</span>
  );
}
