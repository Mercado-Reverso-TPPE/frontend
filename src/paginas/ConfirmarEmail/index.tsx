import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { obterPerfil } from "@/api/autenticacao";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { confirmarAlteracaoDeEmail } from "@/api/perfil";
import { CabecalhoDeAutenticacao, estilosDeAutenticacao as estilos } from "@/componentes/autenticacao";
import { Botao } from "@/componentes/base";
import { Aviso, Carregando } from "@/componentes/estado";
import { useSessao } from "@/hooks/useSessao";

type Estado = { fase: "confirmando" } | { fase: "confirmado" } | { fase: "falhou"; mensagem: string };

/**
 * Destino do link de troca de e-mail (QRO-03). Confirma assim que abre; com
 * sessão aberta, atualiza o e-mail exibido no perfil.
 */
export default function ConfirmarEmail() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token") ?? "";
  const { autenticado, atualizarUsuario } = useSessao();
  const [estado, setEstado] = useState<Estado>(
    token ? { fase: "confirmando" } : { fase: "falhou", mensagem: "Este link de confirmação está incompleto." },
  );
  // O token só pode ser usado uma vez; o StrictMode montaria o efeito duas.
  const enviado = useRef(false);

  useEffect(() => {
    if (!token || enviado.current) return;
    enviado.current = true;
    confirmarAlteracaoDeEmail(token)
      .then(async () => {
        setEstado({ fase: "confirmado" });
        if (autenticado) atualizarUsuario(await obterPerfil());
      })
      .catch((erro: unknown) => {
        const { geral } = errosDeValidacao(erro);
        setEstado({
          fase: "falhou",
          mensagem:
            geral ??
            (erro instanceof ErroDeApi ? erro.message : "Não foi possível confirmar o novo e-mail agora."),
        });
      });
  }, [token, autenticado, atualizarUsuario]);

  return (
    <div className={estilos.tela}>
      <CabecalhoDeAutenticacao titulo="Confirmação de e-mail" descricao="Troca do e-mail da sua conta." />

      {estado.fase === "confirmando" && <Carregando rotulo="Confirmando o novo e-mail…" />}
      {estado.fase === "confirmado" && (
        <Aviso tom="sucesso" titulo="E-mail alterado">
          A partir de agora, use o novo endereço para entrar.
        </Aviso>
      )}
      {estado.fase === "falhou" && (
        <Aviso tom="erro">
          {estado.mensagem} Peça um novo link na tela do seu perfil.
        </Aviso>
      )}

      {estado.fase !== "confirmando" && (
        <Botao para={autenticado ? "/perfil" : "/entrar"} variante="secundario" larguraTotal>
          {autenticado ? "Voltar ao perfil" : "Ir para entrar"}
        </Botao>
      )}
    </div>
  );
}
