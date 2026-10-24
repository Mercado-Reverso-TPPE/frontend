import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FiltrosDoFeed } from "@/api/anuncios";
import { listarCategorias, RAIO_MAXIMO_KM } from "@/api/meusAnuncios";
import { Botao, Campo } from "@/componentes/base";
import { fmtPlural } from "@/utils/formato";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";
import { ChipsCategoria } from "./ChipsCategoria";
import estilos from "./Feed.module.css";

const DISTANCIAS = [5, 10, 25, 50, 100, RAIO_MAXIMO_KM];

interface BarraDeFiltrosProps {
  filtros: FiltrosDoFeed;
  /** Quantos anúncios o filtro atual devolveu; `undefined` enquanto carrega. */
  resultados?: number;
  aoAlterar: (mudancas: Partial<FiltrosDoFeed>) => void;
  temFiltroAtivo: boolean;
  aoLimpar: () => void;
}

/**
 * Barra fixa de filtros do feed (QRO-07): categoria, faixa de preço e
 * distância máxima. Todos combinam entre si e com a ordenação.
 */
export function BarraDeFiltros({ filtros, resultados, aoAlterar, temFiltroAtivo, aoLimpar }: BarraDeFiltrosProps) {
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias, staleTime: Infinity });
  const [minimo, setMinimo] = useState(valorParaCampo(filtros.precoMin));
  const [maximo, setMaximo] = useState(valorParaCampo(filtros.precoMax));
  const [erroDePreco, setErroDePreco] = useState<string>();

  // A URL pode mudar por fora (limpar filtros, voltar do detalhe).
  useEffect(() => setMinimo(valorParaCampo(filtros.precoMin)), [filtros.precoMin]);
  useEffect(() => setMaximo(valorParaCampo(filtros.precoMax)), [filtros.precoMax]);

  const aplicarPreco = (evento: FormEvent) => {
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
    aoAlterar({ precoMin, precoMax });
  };

  return (
    <div className={estilos.barra}>
      <div className={estilos.barraFaixa}>
        <form className={estilos.filtrosExtras} onSubmit={aplicarPreco} noValidate aria-label="Filtros de preço e distância">
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
          <Botao type="submit" variante="secundario">
            Aplicar preço
          </Botao>
          <Campo
            como="select"
            rotulo="Distância máxima"
            value={filtros.distanciaMaxKm === null ? "" : String(filtros.distanciaMaxKm)}
            onChange={(evento) => aoAlterar({ distanciaMaxKm: evento.target.value ? Number(evento.target.value) : null })}
          >
            <option value="">Qualquer distância</option>
            {DISTANCIAS.map((km) => (
              <option key={km} value={km}>
                Até {km} km
              </option>
            ))}
          </Campo>
        </form>

        <div className={estilos.linhaDeTipos}>
          <span className={estilos.resultados} aria-live="polite">
            {resultados === undefined ? "Buscando anúncios…" : fmtPlural(resultados, "resultado")}
          </span>
          {temFiltroAtivo && (
            <Botao variante="texto" tamanho="pequeno" onClick={aoLimpar}>
              Limpar filtros
            </Botao>
          )}
        </div>

        <ChipsCategoria
          categorias={categorias.data ?? []}
          ativa={filtros.categoria}
          aoSelecionar={(categoria) => aoAlterar({ categoria })}
        />
      </div>
    </div>
  );
}
