import { fmtMetrica } from "@/utils/formato";
import estilos from "./Feed.module.css";

/**
 * Faixa de abertura do feed com a assinatura da marca e as métricas
 * públicas da plataforma (anúncios ativos, cidades cobertas e vendedores).
 */
export interface MetricaDoHero {
  icone: string;
  valor: number;
  rotulo: string;
}

export function Hero({ metricas }: { metricas: MetricaDoHero[] }) {
  return (
    <section className={estilos.hero} aria-labelledby="hero-titulo">
      <div className={estilos.heroFaixa}>
        <div className={estilos.heroTexto}>
          <h1 className={estilos.heroTitulo} id="hero-titulo">
            Você anuncia o que quer.
            <br />
            <span className={estilos.heroDestaque}>Os vendedores te encontram.</span>
          </h1>
          <p className={estilos.heroApoio}>
            Publique sua demanda gratuitamente e receba ofertas de vendedores próximos a você.
          </p>
        </div>

        <dl className={estilos.metricas}>
          {metricas.map((metrica) => (
            <div className={estilos.metrica} key={metrica.rotulo}>
              <div className={estilos.metricaIcone} aria-hidden="true">
                {metrica.icone}
              </div>
              <dd className={estilos.metricaValor}>
                {fmtMetrica(metrica.valor)}
              </dd>
              <dt className={estilos.metricaRotulo}>{metrica.rotulo}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
