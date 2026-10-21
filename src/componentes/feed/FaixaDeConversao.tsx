import { Link } from "react-router";
import { IPlus } from "@/componentes/icones";
import { T } from "@/estilos/tokens";
import estilos from "./Feed.module.css";

/** Chamada para publicar uma demanda quando o feed não resolveu a busca. */
export function FaixaDeConversao({ para = "/anunciar" }: { para?: string }) {
  return (
    <Link to={para} className={estilos.faixa}>
      <div>
        <p className={estilos.faixaTitulo}>Não achou o que queria?</p>
        <p className={estilos.faixaApoio}>
          Publique sua demanda e deixe os vendedores te encontrarem. É grátis.
        </p>
      </div>
      <span className={estilos.faixaAcao}>
        <IPlus color={T.primary} />
        Anunciar agora
      </span>
    </Link>
  );
}
