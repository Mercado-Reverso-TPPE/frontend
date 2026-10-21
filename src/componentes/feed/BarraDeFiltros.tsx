import { IChevronDown } from "@/componentes/icones";
import { T } from "@/estilos/tokens";
import { fmtPlural } from "@/utils/formato";
import type { OrdenacaoDeAnuncio, TipoDeAnuncio } from "@/api/anuncios";
import { ChipsCategoria } from "./ChipsCategoria";
import estilos from "./Feed.module.css";

const TIPOS: { valor: TipoDeAnuncio; rotulo: string; icone: string }[] = [
  { valor: "todos", rotulo: "Todos", icone: "🌐" },
  { valor: "procurando", rotulo: "Procurando", icone: "🛒" },
  { valor: "vendendo", rotulo: "Vendendo", icone: "🏷️" },
];

const ORDENACOES: { valor: OrdenacaoDeAnuncio; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "proximos", rotulo: "Mais próximos" },
  { valor: "maior-valor", rotulo: "Maior valor" },
];

interface BarraDeFiltrosProps {
  tipo: TipoDeAnuncio;
  categoria: string;
  ordenacao: OrdenacaoDeAnuncio;
  /** Quantos anúncios o filtro atual devolveu; `undefined` enquanto carrega. */
  resultados?: number;
  aoMudarTipo: (tipo: TipoDeAnuncio) => void;
  aoMudarCategoria: (categoria: string) => void;
  aoMudarOrdenacao: (ordenacao: OrdenacaoDeAnuncio) => void;
}

/** Filtros do feed: tipo de anúncio, categoria e ordenação. */
export function BarraDeFiltros({
  tipo,
  categoria,
  ordenacao,
  resultados,
  aoMudarTipo,
  aoMudarCategoria,
  aoMudarOrdenacao,
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

          <div className={estilos.ordenar}>
            <label className={estilos.ordenarRotulo} htmlFor="ordenar-feed">
              Ordenar:
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="ordenar-feed"
                value={ordenacao}
                onChange={(evento) => aoMudarOrdenacao(evento.target.value as OrdenacaoDeAnuncio)}
                style={{
                  padding: "7px 28px 7px 12px",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: T.radius.button,
                  fontFamily: T.font.display,
                  fontSize: T.size.meta,
                  fontWeight: 600,
                  color: T.text,
                  backgroundColor: T.bgElevated,
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                {ORDENACOES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
              <span
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}
                aria-hidden="true"
              >
                <IChevronDown color={T.textMid} />
              </span>
            </div>
          </div>
        </div>

        <ChipsCategoria ativa={categoria} aoSelecionar={aoMudarCategoria} />
      </div>
    </div>
  );
}
