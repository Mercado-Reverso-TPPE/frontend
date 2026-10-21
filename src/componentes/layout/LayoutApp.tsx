import { Outlet } from "react-router";
import { T } from "@/estilos/tokens";
import { BotaoFlutuante } from "./BotaoFlutuante";
import { Cabecalho } from "./Cabecalho";
import { Rodape } from "./Rodape";

/** Moldura das telas autenticadas e públicas da aplicação. */
export default function LayoutApp() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: T.font.body,
        backgroundColor: T.bg,
        color: T.text,
      }}
    >
      <a className="link-pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Rodape />
      <BotaoFlutuante />
    </div>
  );
}
