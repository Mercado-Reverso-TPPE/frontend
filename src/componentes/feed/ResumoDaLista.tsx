import { IChevronDown } from "@/componentes/icones";
import { T } from "@/estilos/tokens";
import { fmtPlural } from "@/utils/formato";
import type { OrdenacaoDeAnuncio } from "@/api/anuncios";
import estilos from "./Feed.module.css";

const ORDENACOES: { valor: OrdenacaoDeAnuncio; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "proximos", rotulo: "Mais próximos" },
  { valor: "maior-valor", rotulo: "Maior valor" },
];

interface ResumoDaListaProps {
  total: number;
  ordenacao: OrdenacaoDeAnuncio;
  aoMudarOrdenacao: (ordenacao: OrdenacaoDeAnuncio) => void;
}

/** Linha acima da grade: quantos anúncios o filtro trouxe e como ordená-los. */
export function ResumoDaLista({ total, ordenacao, aoMudarOrdenacao }: ResumoDaListaProps) {
  return (
    <div className={estilos.resumo}>
      <h2 className={estilos.resumoTitulo}>{fmtPlural(total, "anúncio")}</h2>

      <div className={estilos.ordenar}>
        <label className={estilos.ordenarRotulo} htmlFor="ordenar-feed">
          Ordenar:
        </label>
        <div className={estilos.selecaoEnvolvente}>
          <select
            id="ordenar-feed"
            className={estilos.selecao}
            value={ordenacao}
            onChange={(evento) => aoMudarOrdenacao(evento.target.value as OrdenacaoDeAnuncio)}
          >
            {ORDENACOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
          <span className={estilos.setaDaSelecao} aria-hidden="true">
            <IChevronDown color={T.textMid} />
          </span>
        </div>
      </div>
    </div>
  );
}
