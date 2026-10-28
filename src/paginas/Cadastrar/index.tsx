import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { cadastrarConta, type DadosDeCadastro } from "@/api/autenticacao";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { Aviso, CabecalhoDeAutenticacao, estilosDeAutenticacao as estilos } from "@/componentes/autenticacao";
import { Botao, Campo } from "@/componentes/base";
import { useSessao } from "@/hooks/useSessao";
import { destinoSeguro } from "@/utils/navegacao";
import { erroDeEmail, erroDeSenha, SENHA_MINIMA } from "@/utils/validacao";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type CampoDoFormulario = "nome" | "email" | "senha" | "telefone" | "cidade" | "uf";
type Erros = Partial<Record<CampoDoFormulario, string>>;

function validar(dados: DadosDeCadastro): Erros {
  return {
    nome: dados.nome.trim() ? undefined : "Informe seu nome.",
    email: erroDeEmail(dados.email),
    senha: erroDeSenha(dados.senha),
    telefone:
      dados.telefone && dados.telefone.replace(/\D/g, "").length < 10
        ? "Informe o telefone com DDD."
        : undefined,
  };
}

export default function Cadastrar() {
  const { entrar, autenticado } = useSessao();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const retorno = destinoSeguro(parametros.get("retorno"));

  const [dados, setDados] = useState<DadosDeCadastro>({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    cidade: "",
    uf: "SP",
  });
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  if (autenticado && !enviando) return <Navigate to={retorno} replace />;

  const alterar = (campo: CampoDoFormulario) => (valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const aoEnviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados = validar(dados);
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.values(encontrados).some(Boolean)) return;

    setEnviando(true);
    try {
      await cadastrarConta(dados);
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      setErros(campos as Erros);
      setErroGeral(
        geral ??
          (Object.keys(campos).length > 0
            ? undefined
            : erro instanceof ErroDeApi
              ? erro.message
              : "Não foi possível criar a conta agora."),
      );
      setDados((atual) => ({ ...atual, senha: "" }));
      setEnviando(false);
      return;
    }

    try {
      await entrar({ email: dados.email, senha: dados.senha });
      navegar(retorno, { replace: true });
    } catch {
      // A conta existe; só o login automático falhou. Entrar à mão resolve.
      navegar(`/entrar?retorno=${encodeURIComponent(retorno)}`, { replace: true });
    }
  };

  return (
    <div className={estilos.tela}>
      <CabecalhoDeAutenticacao
        titulo="Criar conta gratuita"
        descricao="Comece a negociar em menos de 2 minutos."
      />

      <form className={estilos.formulario} method="post" noValidate onSubmit={aoEnviar}>
        {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}

        <Campo
          rotulo="Nome completo"
          autoComplete="name"
          placeholder="Seu nome"
          value={dados.nome}
          onChange={(evento) => alterar("nome")(evento.target.value)}
          erro={erros.nome}
          obrigatorio
        />
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={dados.email}
          onChange={(evento) => alterar("email")(evento.target.value)}
          erro={erros.email}
          obrigatorio
        />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          dica={`Pelo menos ${SENHA_MINIMA} caracteres, sem ser só números.`}
          value={dados.senha}
          onChange={(evento) => alterar("senha")(evento.target.value)}
          erro={erros.senha}
          obrigatorio
        />
        <Campo
          rotulo="Telefone / WhatsApp"
          type="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={dados.telefone}
          onChange={(evento) => alterar("telefone")(evento.target.value)}
          erro={erros.telefone}
        />

        <div className={estilos.linhaCidade}>
          <Campo
            rotulo="Cidade"
            autoComplete="address-level2"
            placeholder="São Paulo"
            dica="Usada para mostrar anúncios perto de você."
            value={dados.cidade}
            onChange={(evento) => alterar("cidade")(evento.target.value)}
            erro={erros.cidade}
          />
          <Campo
            como="select"
            rotulo="Estado"
            autoComplete="address-level1"
            value={dados.uf}
            onChange={(evento) => alterar("uf")(evento.target.value)}
            erro={erros.uf}
          >
            {ESTADOS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </Campo>
        </div>

        <Botao type="submit" tamanho="grande" larguraTotal carregando={enviando}>
          {enviando ? "Criando conta…" : "Criar conta"}
        </Botao>

        <p className={estilos.legal}>
          Ao criar conta você concorda com os Termos de Uso e a Política de Privacidade.
        </p>
      </form>

      <p className={estilos.rodape}>
        Já tem conta?{" "}
        <Link to={retorno === "/" ? "/entrar" : `/entrar?retorno=${encodeURIComponent(retorno)}`}>Entrar</Link>
      </p>
    </div>
  );
}
