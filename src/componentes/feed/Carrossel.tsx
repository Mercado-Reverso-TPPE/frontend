import { useRef } from "react";
import { CardCompacto } from "@/componentes/anuncio";
import { IChevronLeft, IChevronRight } from "@/componentes/icones";
import type { AnyAd } from "@/api/tipos";
import estilos from "./Feed.module.css";

const PASSO = 240;

interface CarrosselProps {
  titulo: string;
  subtitulo: string;
  icone: string;
  anuncios: AnyAd[];
  /** Cor do acento da seção: a marca por padrão, `info` para proximidade. */
  acento?: "marca" | "info";
}

/** Seção rolável de anúncios — recomendações e "perto de você". */
export function Carrossel({ titulo, subtitulo, icone, anuncios, acento = "marca" }: CarrosselProps) {
  const trilha = useRef<HTMLDivElement>(null);

  const rolar = (direcao: "esquerda" | "direita") =>
    trilha.current?.scrollBy({ left: direcao === "direita" ? PASSO : -PASSO, behavior: "smooth" });

  if (anuncios.length === 0) return null;

  return (
    <section className={estilos.secao}>
      <div className={estilos.secaoTopo}>
        <div className={estilos.secaoIdentidade}>
          <span
            className={`${estilos.acento} ${acento === "info" ? estilos.acentoInfo : ""}`}
            aria-hidden="true"
          />
          <div>
            <h2 className={estilos.secaoTitulo}>
              <span aria-hidden="true">{icone}</span>
              {titulo}
            </h2>
            <p className={estilos.secaoSubtitulo}>{subtitulo}</p>
          </div>
        </div>

        <div className={estilos.setas}>
          <button
            type="button"
            className={estilos.seta}
            onClick={() => rolar("esquerda")}
            aria-label={`Ver anteriores em ${titulo}`}
          >
            <IChevronLeft size={15} />
          </button>
          <button
            type="button"
            className={estilos.seta}
            onClick={() => rolar("direita")}
            aria-label={`Ver próximos em ${titulo}`}
          >
            <IChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className={`${estilos.trilha} sem-barra-de-rolagem`} ref={trilha}>
        {anuncios.map((anuncio, indice) => (
          <CardCompacto key={`${anuncio.kind}-${anuncio.id}-${indice}`} anuncio={anuncio} />
        ))}
      </div>
    </section>
  );
}
