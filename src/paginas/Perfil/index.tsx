import { useState, type FormEvent } from "react";
import { atualizarPerfil, solicitarAlteracaoDeEmail, type LocalizacaoInformada } from "@/api/perfil";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import type { User } from "@/api/tipos";
import { Aviso } from "@/componentes/estado";
import { Avatar, Botao, Campo } from "@/componentes/base";
import { IHistory, IPackage } from "@/componentes/icones";
import { useSessao } from "@/hooks/useSessao";
import { erroDeEmail } from "@/utils/validacao";
import estilos from "./Perfil.module.css";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const mensagemDeFalha = (erro: unknown, padrao: string) =>
  erro instanceof ErroDeApi ? erro.message : padrao;

function descreverLocalizacao(usuario: User) {
  if (!usuario.city && !usuario.cep) return "Localização não informada";
  const cidade = [usuario.city, usuario.state].filter(Boolean).join(", ");
  return usuario.cep ? `${cidade} · CEP ${usuario.cep}` : cidade;
}

/** Perfil e localização de referência (QRO-03). Só abre com sessão. */
export default function Perfil() {
  const { usuario } = useSessao();
  if (!usuario) return null;

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>Meu perfil</h1>

      <section className={estilos.cartao} aria-label="Resumo do perfil">
        <div className={estilos.identidade}>
          <Avatar iniciais={usuario.initials} cor={usuario.color} tamanho={88} nome={usuario.name} foto={usuario.photo} />
          <div>
            <p className={estilos.nome}>{usuario.name}</p>
            <p className={estilos.meta}>
              {usuario.rating > 0 ? `★ ${usuario.rating.toFixed(1)} de 5` : "Ainda sem avaliações"}
            </p>
            <p className={estilos.meta}>{descreverLocalizacao(usuario)}</p>
          </div>
        </div>
      </section>

      <DadosPessoais usuario={usuario} />
      <Localizacao usuario={usuario} />
      <Email usuario={usuario} />

      <nav className={estilos.atalhos} aria-label="Atalhos">
        <Botao para="/meus-anuncios" variante="secundario" icone={<IPackage size={16} />}>
          Meus anúncios
        </Botao>
        <Botao para="/historico" variante="secundario" icone={<IHistory size={16} />}>
          Histórico
        </Botao>
      </nav>
    </div>
  );
}

function DadosPessoais({ usuario }: { usuario: User }) {
  const { atualizarUsuario } = useSessao();
  const [dados, setDados] = useState({ nome: usuario.name, telefone: usuario.phone, foto: usuario.photo ?? "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const alterou =
    dados.nome !== usuario.name || dados.telefone !== usuario.phone || dados.foto !== (usuario.photo ?? "");

  const alterar = (campo: keyof typeof dados) => (valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setSalvo(false);
  };

  const aoSalvar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados: Record<string, string> = {};
    if (!dados.nome.trim()) encontrados.nome = "Informe seu nome.";
    if (dados.telefone && dados.telefone.replace(/\D/g, "").length < 10) encontrados.telefone = "Informe o telefone com DDD.";
    if (dados.foto && !/^https?:\/\/\S+$/.test(dados.foto.trim())) encontrados.foto = "Use um link que comece com https://.";
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      atualizarUsuario(await atualizarPerfil({ dadosPessoais: dados }, usuario));
      setSalvo(true);
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      setErros(campos);
      setErroGeral(geral ?? (Object.keys(campos).length ? undefined : mensagemDeFalha(erro, "Não foi possível salvar agora.")));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={estilos.cartao} aria-labelledby="titulo-dados">
      <h2 id="titulo-dados">Dados pessoais</h2>
      <p className={estilos.explicacao}>Nome e foto aparecem para quem negocia com você.</p>

      <form className={estilos.formulario} noValidate onSubmit={aoSalvar}>
        {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
        {salvo && <Aviso tom="sucesso">Dados pessoais salvos.</Aviso>}
        <div className={estilos.grade}>
          <Campo
            rotulo="Nome"
            autoComplete="name"
            value={dados.nome}
            onChange={(evento) => alterar("nome")(evento.target.value)}
            erro={erros.nome}
            obrigatorio
          />
          <Campo
            rotulo="Telefone / WhatsApp"
            type="tel"
            autoComplete="tel"
            value={dados.telefone}
            onChange={(evento) => alterar("telefone")(evento.target.value)}
            erro={erros.telefone}
          />
        </div>
        <Campo
          rotulo="Link da foto"
          type="url"
          placeholder="https://…"
          dica="Endereço de uma imagem. Deixe em branco para usar as iniciais."
          value={dados.foto}
          onChange={(evento) => alterar("foto")(evento.target.value)}
          erro={erros.foto}
        />
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={enviando} disabled={!alterou}>
            Salvar dados pessoais
          </Botao>
        </div>
      </form>
    </section>
  );
}

function Localizacao({ usuario }: { usuario: User }) {
  const { atualizarUsuario } = useSessao();
  const [dados, setDados] = useState<LocalizacaoInformada>({
    cep: usuario.cep ?? "",
    cidade: usuario.city,
    uf: usuario.state || "SP",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo: keyof LocalizacaoInformada) => (valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setSalvo(false);
  };

  const aoSalvar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados: Record<string, string> = {};
    if (!dados.cep.trim() && !dados.cidade.trim()) encontrados.cidade = "Informe o CEP ou a cidade.";
    if (dados.cep.trim() && !/^\d{5}-?\d{3}$/.test(dados.cep.trim())) encontrados.cep = "Use o formato 00000-000.";
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      atualizarUsuario(await atualizarPerfil({ localizacao: dados }, usuario));
      setSalvo(true);
    } catch (erro) {
      // Geocodificação recusada ou indisponível: a localização salva continua
      // valendo e aparece logo acima do formulário.
      const { campos, geral } = errosDeValidacao(erro);
      const porCampo = Object.fromEntries(
        Object.entries(campos).map(([chave, mensagem]) => [chave.replace(/^localizacao\./, ""), mensagem]),
      );
      const deCampo = ["cep", "cidade", "uf"].some((campo) => porCampo[campo]);
      setErros(porCampo);
      setErroGeral(
        geral ??
          (deCampo ? undefined : Object.values(porCampo)[0] ?? mensagemDeFalha(erro, "Não foi possível salvar a localização.")),
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={estilos.cartao} aria-labelledby="titulo-localizacao">
      <h2 id="titulo-localizacao">Localização de referência</h2>
      <p className={estilos.explicacao}>
        Usada para calcular a distância até os anúncios. Informe o CEP ou a cidade.
      </p>

      <p className={estilos.valorAtual}>
        <span>Localização salva</span>
        {descreverLocalizacao(usuario)}
      </p>

      <form className={estilos.formulario} noValidate onSubmit={aoSalvar}>
        {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
        {salvo && <Aviso tom="sucesso">Localização atualizada.</Aviso>}
        <div className={estilos.gradeLocalizacao}>
          <Campo
            rotulo="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={dados.cep}
            onChange={(evento) => alterar("cep")(evento.target.value)}
            erro={erros.cep}
          />
          <Campo
            rotulo="Cidade"
            autoComplete="address-level2"
            value={dados.cidade}
            onChange={(evento) => alterar("cidade")(evento.target.value)}
            erro={erros.cidade}
          />
          <Campo
            como="select"
            rotulo="Estado"
            value={dados.uf}
            onChange={(evento) => alterar("uf")(evento.target.value)}
            erro={erros.uf}
          >
            {ESTADOS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </Campo>
        </div>
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={enviando}>
            Salvar localização
          </Botao>
        </div>
      </form>
    </section>
  );
}

function Email({ usuario }: { usuario: User }) {
  const [editando, setEditando] = useState(false);
  const [novoEmail, setNovoEmail] = useState("");
  const [erro, setErro] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [pendente, setPendente] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const aoEnviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrado =
      erroDeEmail(novoEmail) ??
      (novoEmail.trim().toLowerCase() === usuario.email?.toLowerCase() ? "Este já é o seu e-mail." : undefined);
    setErro(encontrado);
    setErroGeral(undefined);
    if (encontrado) return;

    setEnviando(true);
    try {
      await solicitarAlteracaoDeEmail(novoEmail);
      setPendente(novoEmail.trim());
      setEditando(false);
      setNovoEmail("");
    } catch (falha) {
      const { campos, geral } = errosDeValidacao(falha);
      if (campos.novo_email) setErro(campos.novo_email);
      else setErroGeral(geral ?? mensagemDeFalha(falha, "Não foi possível enviar a confirmação."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={estilos.cartao} aria-labelledby="titulo-email">
      <h2 id="titulo-email">E-mail</h2>
      <p className={estilos.explicacao}>
        Para trocar, enviamos um link ao novo endereço. A troca só vale depois que você abrir o link.
      </p>

      <p className={estilos.valorAtual}>
        <span>E-mail atual</span>
        {usuario.email ?? "—"}
      </p>

      {pendente && (
        <Aviso tom="sucesso" titulo="Confirme no novo endereço">
          Enviamos um link para {pendente}. Até você confirmar, o e-mail da conta continua sendo{" "}
          {usuario.email}.
        </Aviso>
      )}

      {editando ? (
        <form className={estilos.formulario} noValidate onSubmit={aoEnviar}>
          {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
          <Campo
            rotulo="Novo e-mail"
            type="email"
            autoComplete="email"
            value={novoEmail}
            onChange={(evento) => setNovoEmail(evento.target.value)}
            erro={erro}
            obrigatorio
          />
          <div className={estilos.acoes}>
            <Botao type="submit" carregando={enviando}>
              Enviar link de confirmação
            </Botao>
            <Botao variante="texto" onClick={() => setEditando(false)}>
              Cancelar
            </Botao>
          </div>
        </form>
      ) : (
        <div className={`${estilos.acoes} ${pendente ? estilos.comRespiro : ""}`}>
          <Botao variante="secundario" onClick={() => setEditando(true)}>
            Alterar e-mail
          </Botao>
        </div>
      )}
    </section>
  );
}
