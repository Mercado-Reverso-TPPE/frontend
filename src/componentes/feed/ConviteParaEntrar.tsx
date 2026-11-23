import { Link } from "react-router";
import { cadastrarComRetorno, entrarComRetorno } from "@/utils/navegacao";
import estilos from "./Feed.module.css";

const BENEFICIOS = [
  "📣 Anuncie o que quer comprar e receba ofertas",
  "📍 Veja na hora os pedidos perto de você",
  "🎯 Receba indicações conforme seus interesses",
  "💬 Negocie no chat, compare ofertas e avalie",
];

/**
 * Convite no topo da home pública: mostra o que a pessoa ganha ao entrar,
 * sem bloquear a navegação. `retorno` é para onde ela volta depois.
 */
export function ConviteParaEntrar({ retorno = "/" }: { retorno?: string }) {
  return (
    <section className={estilos.convite} aria-labelledby="convite-titulo">
      <div className={estilos.conviteTexto}>
        <h2 id="convite-titulo" className={estilos.faixaTitulo}>
          Entre e o Quero. trabalha por você
        </h2>
        <p className={estilos.faixaApoio}>
          Você está vendo o que se procura no Brasil. Com uma conta, a sua região filtra tudo sozinha.
        </p>
        <ul className={estilos.conviteBeneficios}>
          {BENEFICIOS.map((beneficio) => (
            <li key={beneficio}>{beneficio}</li>
          ))}
        </ul>
      </div>
      <div className={estilos.conviteAcoes}>
        <Link className={estilos.conviteBotaoPrincipal} to={entrarComRetorno(retorno)}>
          Entrar
        </Link>
        <Link className={estilos.conviteBotaoSecundario} to={cadastrarComRetorno(retorno)}>
          Criar conta
        </Link>
      </div>
    </section>
  );
}

/** Lembrete discreto no meio e no fim da lista da home pública. */
export function ConviteDiscreto({ retorno = "/" }: { retorno?: string }) {
  return (
    <p className={estilos.conviteDiscreto}>
      Quer ver os pedidos perto de você e fazer ofertas?
      <Link className={estilos.conviteDiscretoLink} to={cadastrarComRetorno(retorno)}>
        Criar conta grátis
      </Link>
      ou
      <Link className={estilos.conviteDiscretoLink} to={entrarComRetorno(retorno)}>
        entrar
      </Link>
    </p>
  );
}
