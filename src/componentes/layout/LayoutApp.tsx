import { Outlet } from "react-router";
import { BotaoFlutuante } from "./BotaoFlutuante";
import { Cabecalho } from "./Cabecalho";
import { Rodape } from "./Rodape";
import estilos from "./LayoutApp.module.css";

/** Moldura das telas autenticadas e públicas da aplicação. */
export default function LayoutApp() {
  return (
    <div className={estilos.moldura}>
      <a className="link-pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" className={estilos.principal}>
        <Outlet />
      </main>
      <Rodape />
      <BotaoFlutuante />
    </div>
  );
}
