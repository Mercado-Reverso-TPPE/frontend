import { fmtPlural } from "@/utils/formato";
import type { TipoDeAnuncio } from "@/api/anuncios";
import { ChipsCategoria } from "./ChipsCategoria";
import estilos from "./Feed.module.css";

const TIPOS: { valor: TipoDeAnuncio; rotulo: string; icone: string }[] = [
  { valor: "todos", rotulo: "Todos", icone: "🌐" },
  { valor: "procurando", rotulo: "Procurando", icone: "🛒" },
  { valor: "vendendo", rotulo: "Vendendo", icone: "🏷️" },
];

interface BarraDeFiltrosProps {
  tipo: TipoDeAnuncio;
  categoria: string;
  /** Quantos anúncios o filtro atual devolveu; `undefined` enquanto carrega. */
  resultados?: number;
  aoMudarTipo: (tipo: TipoDeAnuncio) => void;
  aoMudarCategoria: (categoria: string) => void;
}

/** Barra fixa de filtros do feed: tipo de anúncio e categoria (QRO-07). */
export function BarraDeFiltros({
  tipo,
  categoria,
  resultados,
  aoMudarTipo,
  aoMudarCategoria,
}: BarraDeFiltrosProps) {
  return (
    <div className={estilos.barra}>
      <div className={estilos.barraFaixa}>
        <div className={estilos.linhaDeTipos}>
          <div className={estilos.tipos} role="group" aria-label="Tipo de anúncio">
            {TIPOS.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                className={`${estilos.tipo} ${tipo === opcao.valor ? estilos.tipoAtivo : ""}`}
                aria-pressed={tipo === opcao.valor}
                onClick={() => aoMudarTipo(opcao.valor)}
              >
                <span aria-hidden="true">{opcao.icone} </span>
                {opcao.rotulo}
              </button>
            ))}
          </div>

          <span className={estilos.separador} aria-hidden="true" />
          <span className={estilos.resultados} aria-live="polite">
            {resultados === undefined ? "Buscando anúncios…" : fmtPlural(resultados, "resultado")}
          </span>
        </div>

        <ChipsCategoria ativa={categoria} aoSelecionar={aoMudarCategoria} />
      </div>
    </div>
  );
}
