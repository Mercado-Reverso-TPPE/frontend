import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  abrirSessao,
  encerrarSessao,
  obterPerfil,
  renovarTokens,
  type Credenciais,
  type Tokens,
} from "@/api/autenticacao";
import { definirRenovadorDeSessao, definirTokenDeAcesso } from "@/api/cliente";
import type { User } from "@/api/tipos";

/**
 * Sessão da pessoa autenticada (QRO-01, QRO-02).
 *
 * O token de acesso vive só em memória. O token de renovação fica no
 * `sessionStorage` para a sessão sobreviver a um recarregamento da aba; some
 * quando a aba fecha. A senha nunca é guardada: passa direto do formulário
 * para a requisição.
 */
interface Sessao {
  usuario: User | null;
  autenticado: boolean;
  /** Restaurando a sessão ao abrir o app; rotas privadas esperam por isso. */
  verificando: boolean;
  entrar: (credenciais: Credenciais) => Promise<void>;
  sair: () => Promise<void>;
  /** Troca os dados exibidos depois de editar o perfil. */
  atualizarUsuario: (usuario: User) => void;
}

const SessaoContext = createContext<Sessao | null>(null);

export const CHAVE_RENOVACAO = "quero.sessao.renovacao";

function lerRenovacao() {
  try {
    return sessionStorage.getItem(CHAVE_RENOVACAO);
  } catch {
    return null;
  }
}

function gravarRenovacao(token: string | null) {
  try {
    if (token) sessionStorage.setItem(CHAVE_RENOVACAO, token);
    else sessionStorage.removeItem(CHAVE_RENOVACAO);
  } catch {
    // Armazenamento bloqueado: a sessão dura só até recarregar a página.
  }
}

function guardarTokens(tokens: Tokens | null) {
  definirTokenDeAcesso(tokens?.acesso ?? null);
  gravarRenovacao(tokens?.renovacao ?? null);
}

export function ProvedorDeSessao({
  children,
  /** Sessão já aberta — usado pelos testes. Presente, não restaura do navegador. */
  usuarioInicial = null,
}: {
  children: ReactNode;
  usuarioInicial?: User | null;
}) {
  const clienteDeConsulta = useQueryClient();
  const [usuario, setUsuario] = useState<User | null>(usuarioInicial);
  const [verificando, setVerificando] = useState(
    () => usuarioInicial === null && lerRenovacao() !== null,
  );
  const restaurou = useRef(false);

  const limpar = useCallback(() => {
    guardarTokens(null);
    setUsuario(null);
    clienteDeConsulta.clear();
  }, [clienteDeConsulta]);

  // Token de acesso expirado no meio do uso: o cliente HTTP pede a renovação.
  useEffect(() => {
    definirRenovadorDeSessao(async () => {
      const renovacao = lerRenovacao();
      if (!renovacao) return false;
      try {
        guardarTokens(await renovarTokens(renovacao));
        return true;
      } catch {
        limpar();
        return false;
      }
    });
    return () => definirRenovadorDeSessao(null);
  }, [limpar]);

  // Restaura a sessão de um recarregamento. O `ref` evita renovar duas vezes
  // no StrictMode — o backend invalida o token de renovação depois do uso.
  useEffect(() => {
    if (restaurou.current || !verificando) return;
    restaurou.current = true;
    const renovacao = lerRenovacao();
    if (!renovacao) {
      setVerificando(false);
      return;
    }
    renovarTokens(renovacao)
      .then((tokens) => {
        guardarTokens(tokens);
        return obterPerfil();
      })
      .then(setUsuario)
      .catch(() => guardarTokens(null))
      .finally(() => setVerificando(false));
  }, [verificando]);

  const entrar = useCallback(async (credenciais: Credenciais) => {
    const tokens = await abrirSessao(credenciais);
    guardarTokens(tokens);
    try {
      setUsuario(await obterPerfil());
    } catch (erro) {
      guardarTokens(null);
      throw erro;
    }
  }, []);

  const sair = useCallback(async () => {
    const renovacao = lerRenovacao();
    try {
      if (renovacao) await encerrarSessao(renovacao);
    } catch {
      // Mesmo sem resposta do servidor, a sessão local é encerrada.
    } finally {
      limpar();
    }
  }, [limpar]);

  const valor = useMemo<Sessao>(
    () => ({
      usuario,
      autenticado: usuario !== null,
      verificando,
      entrar,
      sair,
      atualizarUsuario: setUsuario,
    }),
    [usuario, verificando, entrar, sair],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const sessao = useContext(SessaoContext);
  if (!sessao) throw new Error("useSessao precisa estar dentro de <ProvedorDeSessao>.");
  return sessao;
}
