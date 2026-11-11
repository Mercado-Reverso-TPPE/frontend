import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FiltrosDoFeed } from "@/api/anuncios";
import { listarCategorias, RAIO_MAXIMO_KM } from "@/api/meusAnuncios";
import { Botao, Campo } from "@/componentes/base";
import { IFilter, ISliders, IX } from "@/componentes/icones";
import { fmtPlural } from "@/utils/formato";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";
import { ChipsCategoria } from "./ChipsCategoria";
import estilos from "./Feed.module.css";

const DISTANCIAS = [5, 10, 25, 50, 100, RAIO_MAXIMO_KM];

const TIPOS = [
  { valor: "todos", rotulo: "Todos", icone: "🌐" },
  { valor: "procurando", rotulo: "Procurando", icone: "🛒" },
] as const;

type TipoDeFeed = (typeof TIPOS)[number]["valor"];

interface BarraDeFiltrosProps {
  filtros: FiltrosDoFeed;
  /** Quantos anúncios o filtro atual devolveu; `undefined` enquanto carrega. */
  resultados?: number;
  aoAlterar: (mudancas: Partial<FiltrosDoFeed>) => void;
  temFiltroAtivo: boolean;
  aoLimpar: () => void;
}

/**
 * Barra fixa de filtros do feed (QRO-07):
 * Linha superior: seletor de tipo · contador de resultados e botão "Filtros" recolhível.
 * Linha inferior: chips de categoria.
 */
export function BarraDeFiltros({ filtros, resultados, aoAlterar, temFiltroAtivo: _temFiltroAtivo, aoLimpar }: BarraDeFiltrosProps) {
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias, staleTime: Infinity });

  const [tipo, setTipo] = useState<TipoDeFeed>("todos");
  const [painelAberto, setPainelAberto] = useState(false);

  const [minimo, setMinimo] = useState(valorParaCampo(filtros.precoMin));
  const [maximo, setMaximo] = useState(valorParaCampo(filtros.precoMax));
  const [distancia, setDistancia] = useState<number | null>(filtros.distanciaMaxKm);
  const [erroDePreco, setErroDePreco] = useState<string>();

  // Sincroniza com a URL caso mude externamente
  useEffect(() => setMinimo(valorParaCampo(filtros.precoMin)), [filtros.precoMin]);
  useEffect(() => setMaximo(valorParaCampo(filtros.precoMax)), [filtros.precoMax]);
  useEffect(() => setDistancia(filtros.distanciaMaxKm), [filtros.distanciaMaxKm]);

  // Contagem de filtros ativos específicos deste painel (preço e distância)
  const filtrosPainelAtivos =
    (filtros.precoMin !== null || filtros.precoMax !== null ? 1 : 0) +
    (filtros.distanciaMaxKm !== null ? 1 : 0);

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
    aoAlterar({ precoMin, precoMax, distanciaMaxKm: distancia });
    setPainelAberto(false);
  };

  const limparFiltrosDoPainel = () => {
    setMinimo("");
    setMaximo("");
    setDistancia(null);
    setErroDePreco(undefined);
    aoAlterar({ precoMin: null, precoMax: null, distanciaMaxKm: null });
    setPainelAberto(false);
  };

  return (
    <div className={estilos.barra}>
      <div className={estilos.barraFaixa}>
        <div className={estilos.linhaDeTipos}>
          {/* Seletor de tipo */}
          <div className={estilos.tipos} role="group" aria-label="Tipo de anúncio">
            {TIPOS.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                className={`${estilos.tipo} ${tipo === opcao.valor ? estilos.tipoAtivo : ""}`}
                aria-pressed={tipo === opcao.valor}
                onClick={() => setTipo(opcao.valor)}
              >
                <span aria-hidden="true">{opcao.icone} </span>
                {opcao.rotulo}
              </button>
            ))}
          </div>

          <span className={estilos.separador} aria-hidden="true" />

          {/* Contador de resultados */}
          <span className={estilos.resultados} aria-live="polite">
            {resultados === undefined ? "Buscando anúncios…" : fmtPlural(resultados, "resultado")}
          </span>

          {/* Botão e Painel de Filtros recolhível */}
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
                  aria-label="Filtros de orçamento e distância"
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
        </div>

        {/* Chips de categorias */}
        <ChipsCategoria
          categorias={categorias.data ?? []}
          ativa={filtros.categoria}
          aoSelecionar={(categoria) => aoAlterar({ categoria })}
        />
      </div>
    </div>
  );
}
