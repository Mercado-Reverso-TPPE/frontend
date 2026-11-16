import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  atualizarPerfil,
  solicitarAlteracaoDeEmail,
  listarAvaliacoesDoPerfil,
  type LocalizacaoInformada,
} from "@/api/perfil";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import type { User } from "@/api/tipos";
import { Aviso, Carregando, EstadoVazio } from "@/componentes/estado";
import { Avatar, Badge, Botao, Campo } from "@/componentes/base";
import { IEdit, IHistory, IPackage } from "@/componentes/icones";
import { useSessao } from "@/hooks/useSessao";
import { erroDeEmail } from "@/utils/validacao";
import estilos from "./Perfil.module.css";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const ROTULO_DO_PAPEL: Record<string, string> = {
  both: "🔄 Comprador e Vendedor",
  buyer: "🛒 Comprador",
  seller: "🏷️ Vendedor",
};

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
  const [editando, setEditando] = useState(false);

  const avaliacoes = useQuery({
    queryKey: ["perfil", "avaliacoes", usuario?.id],
    queryFn: () => listarAvaliacoesDoPerfil(usuario),
    enabled: Boolean(usuario),
  });

  if (!usuario) return null;

  const totalAvaliacoes = usuario.reviews || (avaliacoes.data?.length ?? 0);

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>Meu Perfil</h1>

      <section className={estilos.cartao} aria-label="Resumo do perfil">
        <div className={estilos.cartaoCabecalho}>
          <div className={estilos.identidade}>
            <Avatar
              iniciais={usuario.initials}
              cor={usuario.color}
              tamanho={88}
              nome={usuario.name}
              foto={usuario.photo}
            />
            <div>
              <p className={estilos.nome}>{usuario.name}</p>
              <p className={estilos.meta}>
                {usuario.rating > 0 && totalAvaliacoes > 0 ? (
                  <span className={estilos.estrelasTexto}>
                    {"★".repeat(Math.round(usuario.rating))} {usuario.rating.toFixed(1)} · {totalAvaliacoes} avaliações
                  </span>
                ) : usuario.rating > 0 ? (
                  <span className={estilos.estrelasTexto}>
                    {"★".repeat(Math.round(usuario.rating))} {usuario.rating.toFixed(1)} de 5
                  </span>
                ) : (
                  "Ainda sem avaliações"
                )}
              </p>
              <p className={estilos.meta}>{descreverLocalizacao(usuario)}</p>
              <div className={estilos.selos}>
                <Badge tom="neutro">
                  {ROTULO_DO_PAPEL[usuario.role] ?? "🔄 Comprador e Vendedor"}
                </Badge>
                <span className={estilos.meta}>
                  Membro desde {usuario.joinedAt || "Mar 2024"}
                </span>
              </div>
            </div>
          </div>
          {!editando ? (
            <Botao
              variante="secundario"
              onClick={() => setEditando(true)}
              icone={<IEdit size={14} />}
            >
              Editar
            </Botao>
          ) : (
            <Botao variante="texto" onClick={() => setEditando(false)}>
              Cancelar
            </Botao>
          )}
        </div>
      </section>

      {!editando ? (
        <>
          <section
            className={estilos.cartao}
            aria-label="Informações pessoais"
            aria-labelledby="titulo-info-pessoais"
          >
            <h2 id="titulo-info-pessoais">Informações pessoais</h2>
            <div className={estilos.gradeInfo}>
              <div className={estilos.campoInfo}>
                <span className={estilos.rotuloCaixaAlta}>NOME</span>
                <span className={estilos.valorInfo}>{usuario.name}</span>
              </div>
              <div className={estilos.campoInfo}>
                <span className={estilos.rotuloCaixaAlta}>TELEFONE</span>
                <span className={estilos.valorInfo}>{usuario.phone || "—"}</span>
              </div>
              <div className={estilos.campoInfo}>
                <span className={estilos.rotuloCaixaAlta}>CIDADE</span>
                <span className={estilos.valorInfo}>{usuario.city || "—"}</span>
              </div>
              <div className={estilos.campoInfo}>
                <span className={estilos.rotuloCaixaAlta}>ESTADO</span>
                <span className={estilos.valorInfo}>{usuario.state || "—"}</span>
              </div>
              <div className={estilos.campoInfo} style={{ gridColumn: "1 / -1" }}>
                <span className={estilos.rotuloCaixaAlta}>E-MAIL</span>
                <span className={estilos.valorInfo}>{usuario.email || "—"}</span>
              </div>
            </div>
          </section>

          <section
            className={estilos.cartao}
            aria-label="Avaliações recebidas"
            aria-labelledby="titulo-avaliacoes"
          >
            <h2 id="titulo-avaliacoes">Avaliações recebidas</h2>
            {avaliacoes.isPending && <Carregando rotulo="Carregando avaliações…" />}
            {avaliacoes.isSuccess && avaliacoes.data.length === 0 && (
              <EstadoVazio
                icone="⭐"
                titulo="Ainda sem avaliações"
                descricao="Você ainda não recebeu avaliações. Elas aparecerão aqui após concluir suas negociações."
              />
            )}
            {avaliacoes.isSuccess && avaliacoes.data.length > 0 && (
              <ul className={estilos.listaAvaliacoes}>
                {avaliacoes.data.map((av) => (
                  <li key={av.id} className={estilos.itemAvaliacao}>
                    <div className={estilos.topoAvaliacao}>
                      <span className={estilos.autorAvaliacao}>{av.autorNome}</span>
                      <span className={estilos.dataAvaliacao}>{av.data}</span>
                    </div>
                    <div
                      className={estilos.notaEstrelas}
                      aria-label={`${av.nota} de 5 estrelas`}
                    >
                      {"★".repeat(av.nota)}
                      {"☆".repeat(5 - av.nota)}
                    </div>
                    {av.comentario && (
                      <p className={estilos.comentarioAvaliacao}>{av.comentario}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <nav className={estilos.atalhos} aria-label="Atalhos">
            <Botao
              para="/meus-anuncios"
              variante="secundario"
              icone={<IPackage size={16} />}
            >
              Meus anúncios
            </Botao>
            <Botao
              para="/historico"
              variante="secundario"
              icone={<IHistory size={16} />}
            >
              Histórico
            </Botao>
          </nav>
        </>
      ) : (
        <>
          <DadosPessoais
            usuario={usuario}
            aoSalvarSucesso={() => setEditando(false)}
          />
          <Localizacao
            usuario={usuario}
            aoSalvarSucesso={() => setEditando(false)}
          />
          <Email usuario={usuario} />

          <div
            style={{
              marginTop: "var(--espaco-2)",
              display: "flex",
              gap: "var(--espaco-1-5)",
            }}
          >
            <Botao variante="secundario" onClick={() => setEditando(false)}>
              Voltar para visualização
            </Botao>
          </div>
        </>
      )}
    </div>
  );
}

function DadosPessoais({
  usuario,
  aoSalvarSucesso,
}: {
  usuario: User;
  aoSalvarSucesso?: () => void;
}) {
  const { atualizarUsuario } = useSessao();
  const [dados, setDados] = useState({
    nome: usuario.name,
    telefone: usuario.phone,
    foto: usuario.photo ?? "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const alterou =
    dados.nome !== usuario.name ||
    dados.telefone !== usuario.phone ||
    dados.foto !== (usuario.photo ?? "");

  const alterar = (campo: keyof typeof dados) => (valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setSalvo(false);
  };

  const aoSalvar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados: Record<string, string> = {};
    if (!dados.nome.trim()) encontrados.nome = "Informe seu nome.";
    if (dados.telefone && dados.telefone.replace(/\D/g, "").length < 10)
      encontrados.telefone = "Informe o telefone com DDD.";
    if (dados.foto && !/^https?:\/\/\S+$/.test(dados.foto.trim()))
      encontrados.foto = "Use um link que comece com https://.";
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      atualizarUsuario(await atualizarPerfil({ dadosPessoais: dados }, usuario));
      setSalvo(true);
      aoSalvarSucesso?.();
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      setErros(campos);
      setErroGeral(
        geral ??
          (Object.keys(campos).length
            ? undefined
            : mensagemDeFalha(erro, "Não foi possível salvar agora.")),
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      className={estilos.cartao}
      aria-label="Dados pessoais"
      aria-labelledby="titulo-dados"
    >
      <h2 id="titulo-dados">Dados pessoais</h2>
      <p className={estilos.explicacao}>
        Nome e foto aparecem para quem negocia com você.
      </p>

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

function Localizacao({
  usuario,
  aoSalvarSucesso,
}: {
  usuario: User;
  aoSalvarSucesso?: () => void;
}) {
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
    if (!dados.cep.trim() && !dados.cidade.trim())
      encontrados.cidade = "Informe o CEP ou a cidade.";
    if (dados.cep.trim() && !/^\d{5}-?\d{3}$/.test(dados.cep.trim()))
      encontrados.cep = "Use o formato 00000-000.";
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      atualizarUsuario(await atualizarPerfil({ localizacao: dados }, usuario));
      setSalvo(true);
      aoSalvarSucesso?.();
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      const porCampo = Object.fromEntries(
        Object.entries(campos).map(([chave, mensagem]) => [
          chave.replace(/^localizacao\./, ""),
          mensagem,
        ]),
      );
      const deCampo = ["cep", "cidade", "uf"].some((campo) => porCampo[campo]);
      setErros(porCampo);
      setErroGeral(
        geral ??
          (deCampo
            ? undefined
            : (Object.values(porCampo)[0] ??
              mensagemDeFalha(erro, "Não foi possível salvar a localização."))),
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      className={estilos.cartao}
      aria-label="Localização de referência"
      aria-labelledby="titulo-localizacao"
    >
      <h2 id="titulo-localizacao">Localização de referência</h2>
      <p className={estilos.explicacao}>
        Usada para calcular a distância até os anúncios. Informe o CEP ou a
        cidade.
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
      (novoEmail.trim().toLowerCase() === usuario.email?.toLowerCase()
        ? "Este já é o seu e-mail."
        : undefined);
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
      else
        setErroGeral(
          geral ??
            mensagemDeFalha(falha, "Não foi possível enviar a confirmação."),
        );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      className={estilos.cartao}
      aria-label="E-mail"
      aria-labelledby="titulo-email"
    >
      <h2 id="titulo-email">E-mail</h2>
      <p className={estilos.explicacao}>
        Para trocar, enviamos um link ao novo endereço. A troca só vale depois
        que você abrir o link.
      </p>

      <p className={estilos.valorAtual}>
        <span>E-mail atual</span>
        {usuario.email ?? "—"}
      </p>

      {pendente && (
        <Aviso tom="sucesso" titulo="Confirme no novo endereço">
          Enviamos um link para {pendente}. Até você confirmar, o e-mail da
          conta continua sendo {usuario.email}.
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
        <div
          className={`${estilos.acoes} ${pendente ? estilos.comRespiro : ""}`}
        >
          <Botao variante="secundario" onClick={() => setEditando(true)}>
            Alterar e-mail
          </Botao>
        </div>
      )}
    </section>
  );
}
