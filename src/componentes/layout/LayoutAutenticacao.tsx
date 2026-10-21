import { Outlet } from "react-router";
import { Logo } from "./Logo";
import estilos from "./LayoutAutenticacao.module.css";

/** Moldura das telas de entrar e criar conta (QRO-01, QRO-02). */
export default function LayoutAutenticacao() {
  return (
    <div className={estilos.pagina}>
      <div className={estilos.marca}>
        <Logo tamanho={38} />
      </div>

      <main className={estilos.cartao} id="conteudo">
        <Outlet />
      </main>

      <p className={estilos.assinatura}>© {new Date().getFullYear()} Quero. Plataforma de compras reversa.</p>
    </div>
  );
}
