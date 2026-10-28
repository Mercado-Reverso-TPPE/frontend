import { fmtNumero } from "@/utils/formato";
import estilos from "./FormularioDeAnuncio.module.css";

interface PreviaDoAlcanceProps {
  raioKm: number;
  raioMaximoKm: number;
  /** Ponto de referência: a localização do perfil. */
  local: string;
}

/**
 * Prévia esquemática da área de alcance: o círculo cresce na mesma proporção
 * do raio, dentro do limite máximo que o backend aceita. Não é um mapa — mostra
 * o tamanho da área, sempre em quilômetros (RNF-18).
 */
export function PreviaDoAlcance({ raioKm, raioMaximoKm, local }: PreviaDoAlcanceProps) {
  const proporcao = Math.min(raioKm / raioMaximoKm, 1);
  // Raiz quadrada: a área do círculo cresce como a área real, sem sumir nos raios pequenos.
  const raioNoDesenho = 8 + 82 * Math.sqrt(proporcao);
  const areaKm2 = Math.round(Math.PI * raioKm * raioKm);
  const descricao = `Alcance de ${raioKm} km a partir de ${local}, cerca de ${fmtNumero(areaKm2)} km².`;

  return (
    <figure className={estilos.previa}>
      <svg viewBox="0 0 200 200" role="img" aria-label={descricao}>
        <circle cx="100" cy="100" r="90" className={estilos.limite} />
        <circle cx="100" cy="100" r={raioNoDesenho} className={estilos.alcance} />
        <circle cx="100" cy="100" r="4" className={estilos.centro} />
      </svg>
      <figcaption>
        <strong>{raioKm} km</strong> a partir de {local}
        <span>
          Cerca de {fmtNumero(areaKm2)} km² · o tracejado é o limite de {raioMaximoKm} km
        </span>
      </figcaption>
    </figure>
  );
}
