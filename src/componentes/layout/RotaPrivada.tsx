import { Navigate, Outlet, useLocation } from "react-router";
import { Carregando } from "@/componentes/estado";
import { useSessao } from "@/hooks/useSessao";

/**
 * Protege as rotas que exigem sessão (QRO-02).
 *
 * Guarda o destino original em `?retorno=` para que, após entrar, a pessoa
 * caia exatamente onde queria chegar. Enquanto a sessão de um recarregamento
 * é restaurada, espera em vez de mandar para o login.
 */
export function RotaPrivada() {
  const { autenticado, verificando } = useSessao();
  const localizacao = useLocation();

  if (verificando) return <Carregando rotulo="Verificando sua sessão…" />;

  if (!autenticado) {
    const destino = `${localizacao.pathname}${localizacao.search}`;
    return <Navigate to={`/entrar?retorno=${encodeURIComponent(destino)}`} replace />;
  }

  return <Outlet />;
}
