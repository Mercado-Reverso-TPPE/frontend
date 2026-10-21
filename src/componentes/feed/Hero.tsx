import { fmtMetrica } from "@/utils/formato";
import estilos from "./Feed.module.css";

/**
 * Faixa de abertura do feed com a assinatura da marca.
 *
 * As métricas chegam por props; hoje o feed passa os números de
 * demonstração e, com a API integrada, passará os reais.
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
              <div style={{ fontSize: 18, marginBottom: 2 }} aria-hidden="true">
                {metrica.icone}
              </div>
              <dd className={estilos.metricaValor} style={{ margin: 0 }}>
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
