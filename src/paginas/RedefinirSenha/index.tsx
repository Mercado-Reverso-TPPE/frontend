import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { confirmarRedefinicaoDeSenha } from "@/api/autenticacao";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { Aviso, CabecalhoDeAutenticacao, estilosDeAutenticacao as estilos } from "@/componentes/autenticacao";
import { Botao, Campo } from "@/componentes/base";
import { erroDeSenha, SENHA_MINIMA } from "@/utils/validacao";

/**
 * Destino do link de redefinição enviado por e-mail (QRO-02). O backend monta
 * o link com `uid` e `token` na query; a tela só coleta a nova senha.
 */
export default function RedefinirSenha() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const uid = parametros.get("uid") ?? "";
  const token = parametros.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<{ senha?: string; confirmacao?: string }>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  if (!uid || !token) {
    return (
      <div className={estilos.tela}>
        <CabecalhoDeAutenticacao titulo="Link inválido" descricao="Este link de redefinição está incompleto." />
        <Aviso tom="erro">Abra o link mais recente que enviamos por e-mail ou peça um novo.</Aviso>
        <Botao para="/entrar" variante="secundario" larguraTotal>
          Voltar para entrar
        </Botao>
      </div>
    );
  }

  const aoEnviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados = {
      senha: erroDeSenha(senha),
      confirmacao: senha === confirmacao ? undefined : "As senhas não conferem.",
    };
    setErros(encontrados);
    setErroGeral(undefined);
    if (encontrados.senha || encontrados.confirmacao) return;

    setEnviando(true);
    try {
      await confirmarRedefinicaoDeSenha({ uid, token, novaSenha: senha });
      navegar("/entrar?senha=redefinida", { replace: true });
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      if (campos.nova_senha) {
        setErros({ senha: campos.nova_senha });
      } else if (erro instanceof ErroDeApi && erro.status === 400) {
        // uid/token recusados: expirado, já usado ou adulterado.
        setErroGeral(geral ?? "Este link expirou ou já foi usado. Peça um novo na tela de entrar.");
      } else {
        setErroGeral(erro instanceof ErroDeApi ? erro.message : "Não foi possível salvar a senha agora.");
      }
      setSenha("");
      setConfirmacao("");
      setEnviando(false);
    }
  };

  return (
    <div className={estilos.tela}>
      <CabecalhoDeAutenticacao titulo="Nova senha" descricao="Cadastre a senha que você vai usar para entrar." />

      <form className={estilos.formulario} method="post" noValidate onSubmit={aoEnviar}>
        {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
        <Campo
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          dica={`Pelo menos ${SENHA_MINIMA} caracteres, sem ser só números.`}
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          erro={erros.senha}
          obrigatorio
        />
        <Campo
          rotulo="Confirme a nova senha"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(evento) => setConfirmacao(evento.target.value)}
          erro={erros.confirmacao}
          obrigatorio
        />
        <Botao type="submit" tamanho="grande" larguraTotal carregando={enviando}>
          Salvar nova senha
        </Botao>
      </form>

      <p className={estilos.rodape}>
        Lembrou a senha? <Link to="/entrar">Entrar</Link>
      </p>
    </div>
  );
}
