import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { FILTROS_PADRAO, type FiltrosDoFeed, type TipoDoFeed } from "@/api/anuncios";
import { contarPorCategoriaPublica } from "@/api/anunciosPublicos";
import { contarPorCategoria } from "@/api/estatisticas";
import { listarCategorias, RAIO_MAXIMO_KM } from "@/api/meusAnuncios";
import { Botao, Campo } from "@/componentes/base";
import { IChevronDown, ISliders, IX } from "@/componentes/icones";
import { T } from "@/estilos/tokens";
import { fmtPlural } from "@/utils/formato";
import { UFS } from "@/utils/ufs";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";
import { ChipsCategoria } from "./ChipsCategoria";
import estilos from "./Feed.module.css";

const DISTANCIAS = [5, 10, 25, 50, 100, RAIO_MAXIMO_KM];

const TIPOS_PUBLICOS: { valor: TipoDoFeed; rotulo: string; icone: string }[] = [
  { valor: "procurando", rotulo: "Procurando", icone: "🛒" },
  { valor: "vendendo", rotulo: "Vendendo", icone: "🔒" },
];

const TIPOS: { valor: TipoDoFeed; rotulo: string; icone: string }[] = [
  { valor: "todos", rotulo: "Todos", icone: "🌐" },
  { valor: "procurando", rotulo: "Procurando", icone: "🛒" },
  { valor: "vendendo", rotulo: "Vendendo", icone: "🏷️" },
];

interface BarraDeFiltrosProps {
  filtros: FiltrosDoFeed;
  /** Quantos anúncios o filtro atual devolveu; `undefined` enquanto carrega. */
  resultados?: number;
  aoAlterar: (mudancas: Partial<FiltrosDoFeed>) => void;
  temFiltroAtivo: boolean;
  aoLimpar: () => void;
  /** Contar por categoria só quando o feed pode buscar (com a API, exige sessão e localização). */
  habilitarContagem?: boolean;
  /**
   * Home do visitante: abas Procurando e Vendendo (esta só convida a entrar),
   * seletor de localidade (Brasil ou UF) no lugar da distância.
   */
  publico?: boolean;
}

/**
 * Barra fixa de filtros do feed (QRO-07): aba (Todos / Procurando /
 * Vendendo) e "N resultados" em cima, chips de categoria embaixo. Orçamento
 * e distância ficam no painel "Filtros", recolhível. Todos combinam entre si
 * e com a ordenação, e ficam na URL.
 */
export function BarraDeFiltros({
  filtros,
  resultados,
  aoAlterar,
  temFiltroAtivo,
  aoLimpar,
  habilitarContagem = true,
  publico = false,
}: BarraDeFiltrosProps) {
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias, staleTime: Infinity });
  // A contagem ignora a categoria escolhida: os chips mostram quanto há em cada uma.
  const semCategoria = { ...filtros, categoria: "", ordenacao: FILTROS_PADRAO.ordenacao };
  const contagem = useQuery({
    queryKey: publico
      ? ["anuncios", "publico", "contagem-por-categoria", { ...semCategoria, tipo: "procurando", distanciaMaxKm: null }]
      : ["anuncios", "contagem-por-categoria", semCategoria],
    queryFn: ({ signal }) =>
      publico ? contarPorCategoriaPublica(semCategoria, { sinal: signal }) : contarPorCategoria(semCategoria, { sinal: signal }),
    // Na aba Vendendo do visitante não há o que contar.
    enabled: habilitarContagem && !(publico && filtros.tipo === "vendendo"),
    retry: false,
  });
  const [minimo, setMinimo] = useState(valorParaCampo(filtros.precoMin));
  const [maximo, setMaximo] = useState(valorParaCampo(filtros.precoMax));
  const [distancia, setDistancia] = useState<number | null>(filtros.distanciaMaxKm);
  const [erroDePreco, setErroDePreco] = useState<string>();
  const [painelAberto, setPainelAberto] = useState(false);

  // A URL pode mudar por fora (limpar filtros, voltar do detalhe).
  useEffect(() => setMinimo(valorParaCampo(filtros.precoMin)), [filtros.precoMin]);
  useEffect(() => setMaximo(valorParaCampo(filtros.precoMax)), [filtros.precoMax]);
  useEffect(() => setDistancia(filtros.distanciaMaxKm), [filtros.distanciaMaxKm]);

  // Quantos filtros do painel estão ativos (faixa de preço conta como um).
  const filtrosPainelAtivos =
    (filtros.precoMin !== null || filtros.precoMax !== null ? 1 : 0) +
    (!publico && filtros.distanciaMaxKm !== null ? 1 : 0);
  const tipos = publico ? TIPOS_PUBLICOS : TIPOS;

  // O painel é um diálogo: Esc fecha.
  useEffect(() => {
    if (!painelAberto) return;
    const aoTeclar = (evento: KeyboardEvent) => evento.key === "Escape" && setPainelAberto(false);
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [painelAberto]);

  const aplicarFiltros = (evento: FormEvent) => {
    evento.preventDefault();
    const precoMin = lerValorEmReais(minimo);
    const precoMax = lerValorEmReais(maximo);
    if (Number.isNaN(precoMin) || Number.isNaN(precoMax)) {
      setErroDePreco("Use valores em reais, como 1.200.");
      return;
    }
    if (precoMin !== null && precoMax !== null && precoMin > precoMax) {
      setErroDePreco("O máximo precisa ser maior ou igual ao mínimo.");
      return;
    }
    setErroDePreco(undefined);
    aoAlterar(publico ? { precoMin, precoMax } : { precoMin, precoMax, distanciaMaxKm: distancia });
    setPainelAberto(false);
  };

  const limparFiltrosDoPainel = () => {
    setMinimo("");
    setMaximo("");
    setDistancia(null);
    setErroDePreco(undefined);
    aoAlterar(publico ? { precoMin: null, precoMax: null } : { precoMin: null, precoMax: null, distanciaMaxKm: null });
    setPainelAberto(false);
  };

  return (
    <div className={estilos.barra}>
      <div className={estilos.barraFaixa}>
        <div className={estilos.linhaDeTipos}>
          <div className={estilos.tipos} role="group" aria-label="Tipo de anúncio">
            {tipos.map((tipo) => (
              <button
                key={tipo.valor}
                type="button"
                className={`${estilos.tipo} ${filtros.tipo === tipo.valor ? estilos.tipoAtivo : ""}`}
                aria-pressed={filtros.tipo === tipo.valor}
                onClick={() => aoAlterar({ tipo: tipo.valor })}
              >
                <span aria-hidden="true">{tipo.icone} </span>
                {tipo.rotulo}
              </button>
            ))}
          </div>
          {publico && (
            <div className={estilos.selecaoEnvolvente}>
              <select
                className={`${estilos.selecao} ${estilos.localidade}`}
                aria-label="Localidade"
                value={filtros.uf}
                onChange={(evento) => aoAlterar({ uf: evento.target.value })}
              >
                <option value="">📍 Brasil</option>
                {UFS.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>
                    {uf.nome} ({uf.sigla})
                  </option>
                ))}
              </select>
              <span className={estilos.setaDaSelecao} aria-hidden="true">
                <IChevronDown color={T.textMid} />
              </span>
            </div>
          )}
          <span className={estilos.separador} aria-hidden="true" />
          <span className={estilos.resultados} aria-live="polite">
            {resultados === undefined ? "Buscando anúncios…" : fmtPlural(resultados, "resultado")}
          </span>
          <div className={estilos.acoesFiltros}>
            <button
              type="button"
              className={`${estilos.gatilhoFiltros} ${filtrosPainelAtivos > 0 ? estilos.gatilhoFiltrosAtivo : ""}`}
              onClick={() => setPainelAberto((aberto) => !aberto)}
              aria-expanded={painelAberto}
              aria-haspopup="dialog"
              aria-label={filtrosPainelAtivos > 0 ? `Filtros, ${filtrosPainelAtivos} ativo(s)` : "Filtros"}
            >
              <ISliders size={14} />
              <span>Filtros</span>
              {filtrosPainelAtivos > 0 && (
                <span className={estilos.badgeFiltros} aria-hidden="true">
                  {filtrosPainelAtivos}
                </span>
              )}
            </button>

            {painelAberto && (
              <>
                <div
                  className={estilos.backdropPainel}
                  onClick={() => setPainelAberto(false)}
                  aria-hidden="true"
                />
                <div
                  className={estilos.painelFiltros}
                  role="dialog"
                  aria-modal="true"
                  aria-label={publico ? "Filtros de orçamento" : "Filtros de orçamento e distância"}
                >
                  <div className={estilos.painelCabecalho}>
                    <h3 className={estilos.painelTitulo}>Filtros</h3>
                    <button
                      type="button"
                      className={estilos.fecharPainel}
                      onClick={() => setPainelAberto(false)}
                      aria-label="Fechar filtros"
                    >
                      <IX size={16} />
                    </button>
                  </div>

                  <form className={estilos.painelFormulario} onSubmit={aplicarFiltros} noValidate>
                    <Campo
                      rotulo="Orçamento a partir de (R$)"
                      inputMode="decimal"
                      placeholder="0"
                      value={minimo}
                      onChange={(evento) => setMinimo(evento.target.value)}
                    />
                    <Campo
                      rotulo="Orçamento até (R$)"
                      inputMode="decimal"
                      placeholder="Sem limite"
                      value={maximo}
                      onChange={(evento) => setMaximo(evento.target.value)}
                      erro={erroDePreco}
                    />
                    {!publico && (
                      <Campo
                        como="select"
                        rotulo="Distância máxima"
                        value={distancia === null ? "" : String(distancia)}
                        onChange={(evento) =>
                          setDistancia(evento.target.value ? Number(evento.target.value) : null)
                        }
                      >
                        <option value="">Qualquer distância</option>
                        {DISTANCIAS.map((km) => (
                          <option key={km} value={km}>
                            Até {km} km
                          </option>
                        ))}
                      </Campo>
                    )}

                    <div className={estilos.painelAcoes}>
                      <Botao
                        type="button"
                        variante="texto"
                        tamanho="pequeno"
                        onClick={limparFiltrosDoPainel}
                      >
                        Limpar
                      </Botao>
                      <Botao type="submit" tamanho="pequeno">
                        Aplicar
                      </Botao>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
          {temFiltroAtivo && (
            <Botao variante="texto" tamanho="pequeno" onClick={aoLimpar}>
              Limpar filtros
            </Botao>
          )}
        </div>

        <ChipsCategoria
          categorias={categorias.data ?? []}
          ativa={filtros.categoria}
          contagem={contagem.data}
          aoSelecionar={(categoria) => aoAlterar({ categoria })}
        />
      </div>
    </div>
  );
}
