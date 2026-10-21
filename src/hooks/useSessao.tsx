import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { definirTokenDeAcesso } from "@/api/cliente";
import { ME } from "@/dados/demo";
import type { User } from "@/api/tipos";

/**
 * Sessão da pessoa autenticada.
 *
 * A autenticação real depende da API (QRO-02); até lá `entrar()` assume o
 * usuário de demonstração. O contrato deste hook é o que as telas usam, então
 * trocar a origem do usuário não muda nenhuma tela.
 */
interface Sessao {
  usuario: User | null;
  autenticado: boolean;
  /** Abre a sessão. Com o backend integrado, recebe usuário e token da API. */
  entrar: (usuario?: User, token?: string) => void;
  sair: () => void;
}

const SessaoContext = createContext<Sessao | null>(null);

export function ProvedorDeSessao({
  children,
  /** Sessão já aberta — usado pelos testes e, no futuro, pela hidratação. */
  usuarioInicial = null,
}: {
  children: ReactNode;
  usuarioInicial?: User | null;
}) {
  const [usuario, setUsuario] = useState<User | null>(usuarioInicial);

  const entrar = useCallback((proximo: User = ME, token?: string) => {
    definirTokenDeAcesso(token ?? null);
    setUsuario(proximo);
  }, []);

  const sair = useCallback(() => {
    definirTokenDeAcesso(null);
    setUsuario(null);
  }, []);

  const valor = useMemo<Sessao>(
    () => ({ usuario, autenticado: usuario !== null, entrar, sair }),
    [usuario, entrar, sair],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const sessao = useContext(SessaoContext);
  if (!sessao) throw new Error("useSessao precisa estar dentro de <ProvedorDeSessao>.");
  return sessao;
}
