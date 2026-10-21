import { Navigate, Outlet, useLocation } from "react-router";
import { useSessao } from "@/hooks/useSessao";

/**
 * Protege as rotas que exigem sessão (QRO-02).
 *
 * Guarda o destino original em `?retorno=` para que, após entrar, a pessoa
 * caia exatamente onde queria chegar.
 */
export function RotaPrivada() {
  const { autenticado } = useSessao();
  const localizacao = useLocation();

  if (!autenticado) {
    const destino = `${localizacao.pathname}${localizacao.search}`;
    return <Navigate to={`/entrar?retorno=${encodeURIComponent(destino)}`} replace />;
  }

  return <Outlet />;
}
