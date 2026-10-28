import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { solicitarRedefinicaoDeSenha } from "@/api/autenticacao";
import { ErroDeApi } from "@/api/cliente";
import { Aviso, CabecalhoDeAutenticacao, estilosDeAutenticacao as estilos } from "@/componentes/autenticacao";
import { Botao, Campo } from "@/componentes/base";
import { useSessao } from "@/hooks/useSessao";
import { destinoSeguro } from "@/utils/navegacao";
import { erroDeEmail } from "@/utils/validacao";

/**
 * Credencial errada e conta inexistente recebem a mesma mensagem: a tela não
 * pode servir para descobrir quem tem cadastro (QRO-02).
 */
function mensagemDeFalhaAoEntrar(erro: unknown) {
  if (erro instanceof ErroDeApi && (erro.status === 400 || erro.status === 401)) {
    return "E-mail ou senha inválidos.";
  }
  if (erro instanceof ErroDeApi) return erro.message;
  return "Não foi possível entrar agora. Tente de novo.";
}

export default function Entrar() {
  const { entrar, autenticado } = useSessao();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  // QRO-02: depois de entrar, a pessoa volta ao destino que pediu.
  const retorno = destinoSeguro(parametros.get("retorno"));
  const senhaRedefinida = parametros.get("senha") === "redefinida";

  const [modo, setModo] = useState<"entrar" | "recuperar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errosDeCampo, setErrosDeCampo] = useState<{ email?: string; senha?: string }>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [linkEnviado, setLinkEnviado] = useState(false);

  if (autenticado && !enviando) return <Navigate to={retorno} replace />;

  const linkCadastro = retorno === "/" ? "/cadastrar" : `/cadastrar?retorno=${encodeURIComponent(retorno)}`;

  const aoEntrar = async (evento: FormEvent) => {
    evento.preventDefault();
    const erros = { email: erroDeEmail(email), senha: senha ? undefined : "Informe a senha." };
    setErrosDeCampo(erros);
    setErroGeral(undefined);
    if (erros.email || erros.senha) return;

    setEnviando(true);
    try {
      await entrar({ email, senha });
      navegar(retorno, { replace: true });
    } catch (erro) {
      setErroGeral(mensagemDeFalhaAoEntrar(erro));
      setSenha("");
      setEnviando(false);
    }
  };

  const aoRecuperar = async (evento: FormEvent) => {
    evento.preventDefault();
    const erro = erroDeEmail(email);
    setErrosDeCampo({ email: erro });
    setErroGeral(undefined);
    if (erro) return;

    setEnviando(true);
    try {
      await solicitarRedefinicaoDeSenha(email);
      setLinkEnviado(true);
    } catch (falha) {
      setErroGeral(falha instanceof ErroDeApi ? falha.message : "Não foi possível enviar o link agora.");
    } finally {
      setEnviando(false);
    }
  };

  const trocarModo = (proximo: "entrar" | "recuperar") => {
    setModo(proximo);
    setErrosDeCampo({});
    setErroGeral(undefined);
    setLinkEnviado(false);
    setSenha("");
  };

  if (modo === "recuperar") {
    return (
      <div className={estilos.tela}>
        <div>
          <button type="button" className={estilos.voltar} onClick={() => trocarModo("entrar")}>
            ← Voltar
          </button>
          <CabecalhoDeAutenticacao
            titulo="Recuperar senha"
            descricao="Informe o e-mail da sua conta. Enviaremos um link para cadastrar uma nova senha."
          />
        </div>

        {linkEnviado ? (
          <Aviso tom="sucesso" titulo="Verifique seu e-mail">
            Se houver uma conta com esse endereço, você vai receber o link em instantes. Ele expira em
            uma hora e só pode ser usado uma vez.
          </Aviso>
        ) : (
          <form className={estilos.formulario} method="post" noValidate onSubmit={aoRecuperar}>
            {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
            <Campo
              rotulo="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              erro={errosDeCampo.email}
              obrigatorio
            />
            <Botao type="submit" tamanho="grande" larguraTotal carregando={enviando}>
              Enviar link de recuperação
            </Botao>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className={estilos.tela}>
      <CabecalhoDeAutenticacao
        titulo="Bem-vindo de volta"
        descricao="Entre na sua conta para continuar negociando."
      />

      {senhaRedefinida && !erroGeral && (
        <Aviso tom="sucesso">Senha alterada. Entre com a nova senha.</Aviso>
      )}

      <form className={estilos.formulario} method="post" noValidate onSubmit={aoEntrar}>
        {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="username"
          placeholder="seu@email.com"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          erro={errosDeCampo.email}
          obrigatorio
        />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          erro={errosDeCampo.senha}
          obrigatorio
        />

        <div className={estilos.alinharDireita}>
          <button type="button" className={estilos.linkTexto} onClick={() => trocarModo("recuperar")}>
            Esqueci minha senha
          </button>
        </div>

        <Botao type="submit" tamanho="grande" larguraTotal carregando={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Botao>
      </form>

      <div className={estilos.divisor}>ou</div>

      <p className={estilos.rodape}>
        Não tem conta? <Link to={linkCadastro}>Criar conta grátis</Link>
      </p>
    </div>
  );
}
