import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import {
  listarCategorias,
  RAIO_MAXIMO_KM,
  RAIO_PADRAO_KM,
  type DadosDoAnuncio,
} from "@/api/meusAnuncios";
import { Botao, Campo, Chip } from "@/componentes/base";
import { Aviso } from "@/componentes/estado";
import { useSessao } from "@/hooks/useSessao";
import { fmtPrice } from "@/utils/formato";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";
import { PreviaDoAlcance } from "./PreviaDoAlcance";
import { UploadDeFoto } from "./UploadDeFoto";
import estilos from "./FormularioDeAnuncio.module.css";

const ATALHOS_DE_RAIO = [5, 10, 25, 50, 100];
const TITULO_MAXIMO = 160;
export const ESTADOS_CONSERVACAO = ["Novo", "Semi-novo", "Usado"] as const;

export type ModoDoAnuncio = "comprar" | "vender";

type CampoDoAnuncio =
  | "titulo"
  | "categoria"
  | "descricao"
  | "precoMin"
  | "precoMax"
  | "preco"
  | "raioKm"
  | "estadoConservacao"
  | "foto";
type Erros = Partial<Record<CampoDoAnuncio, string>>;

/** Nome do campo no backend → nome no formulário. */
const CAMPOS_DA_API: Record<string, CampoDoAnuncio> = {
  titulo: "titulo",
  categoria: "categoria",
  descricao: "descricao",
  preco_min: "precoMin",
  preco_max: "precoMax",
  preco: "preco",
  raio_km: "raioKm",
  estado_conservacao: "estadoConservacao",
  foto: "foto",
};

export interface DadosDoEnvio extends DadosDoAnuncio {
  preco?: number;
  fotoArquivo?: File | null;
}

interface FormularioDeAnuncioProps {
  modo?: ModoDoAnuncio;
  inicial?: DadosDoAnuncio & { preco?: number };
  rotuloDoEnvio?: string;
  /** Envia os dados; erros de `ErroDeApi` aparecem no formulário. */
  aoEnviar: (dados: DadosDoEnvio) => Promise<void>;
}

/** Formulário usado para publicar (comprar/vender) e para editar (QRO-04, QRO-05). */
export function FormularioDeAnuncio({
  modo = "comprar",
  inicial,
  rotuloDoEnvio,
  aoEnviar,
}: FormularioDeAnuncioProps) {
  const { usuario } = useSessao();
  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
    staleTime: Infinity,
  });

  const [texto, setTexto] = useState({
    titulo: inicial?.titulo ?? "",
    categoria: inicial?.categoria ?? "",
    descricao: inicial?.descricao ?? "",
    precoMin: valorParaCampo(inicial?.precoMin ?? null),
    precoMax: valorParaCampo(inicial?.precoMax ?? null),
    preco: valorParaCampo(inicial?.preco ?? null),
  });
  const [raioKm, setRaioKm] = useState(inicial?.raioKm ?? RAIO_PADRAO_KM);
  const [estadosSelecionados, setEstadosSelecionados] = useState<string[]>(
    inicial?.estadoConservacao ?? [],
  );
  const [fotoUrl, setFotoUrl] = useState<string | null>(inicial?.foto ?? null);
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null);
  const [urgente, setUrgente] = useState(Boolean(inicial?.urgente));

  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const local = usuario?.city
    ? `${usuario.city}${usuario.state ? `, ${usuario.state}` : ""}`
    : "";
  const precoMin = lerValorEmReais(texto.precoMin);
  const precoMax = lerValorEmReais(texto.precoMax);
  const precoUnico = lerValorEmReais(texto.preco);

  const faixaValida =
    precoMin !== null &&
    precoMax !== null &&
    !Number.isNaN(precoMin) &&
    !Number.isNaN(precoMax) &&
    precoMin <= precoMax;

  const alterar = (campo: keyof typeof texto) => (valor: string) => {
    setTexto((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const alternarEstado = (opcao: string) => {
    if (modo === "comprar") {
      setEstadosSelecionados((atuais) =>
        atuais.includes(opcao)
          ? atuais.filter((item) => item !== opcao)
          : [...atuais, opcao],
      );
    } else {
      setEstadosSelecionados([opcao]);
    }
    if (erros.estadoConservacao) {
      setErros((atual) => ({ ...atual, estadoConservacao: undefined }));
    }
  };

  const validar = (): Erros => {
    const encontrados: Erros = {};
    if (!texto.titulo.trim()) {
      encontrados.titulo =
        modo === "vender"
          ? "Informe o título do produto."
          : "Diga o que você procura.";
    } else if (texto.titulo.trim().length > TITULO_MAXIMO) {
      encontrados.titulo = `Use até ${TITULO_MAXIMO} caracteres.`;
    }

    if (!texto.categoria) encontrados.categoria = "Escolha uma categoria.";

    if (!texto.descricao.trim()) {
      encontrados.descricao =
        modo === "vender"
          ? "Descreva seu produto."
          : "Descreva o que você procura.";
    }

    if (modo === "vender") {
      if (precoUnico === null || Number.isNaN(precoUnico) || precoUnico <= 0) {
        encontrados.preco = "Informe o preço do produto.";
      }
    } else {
      if (precoMin !== null && (Number.isNaN(precoMin) || precoMin < 0)) {
        encontrados.precoMin = "Informe um valor em reais, como 1.200,00.";
      }
      if (precoMax !== null && (Number.isNaN(precoMax) || precoMax < 0)) {
        encontrados.precoMax = "Informe um valor em reais, como 1.200,00.";
      }
      if (
        !encontrados.precoMin &&
        !encontrados.precoMax &&
        precoMin !== null &&
        precoMax !== null &&
        precoMin > precoMax
      ) {
        encontrados.precoMax = "O máximo precisa ser maior ou igual ao mínimo.";
      }
      if (!Number.isInteger(raioKm) || raioKm < 1 || raioKm > RAIO_MAXIMO_KM) {
        encontrados.raioKm = `Escolha um raio entre 1 e ${RAIO_MAXIMO_KM} km.`;
      }
    }

    return encontrados;
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.values(encontrados).some(Boolean)) return;

    setEnviando(true);
    try {
      await aoEnviar({
        titulo: texto.titulo,
        categoria: texto.categoria,
        descricao: texto.descricao,
        precoMin,
        precoMax,
        preco: precoUnico ?? undefined,
        raioKm,
        estadoConservacao: estadosSelecionados,
        foto: fotoUrl,
        fotoArquivo,
        urgente: modo === "comprar" ? urgente : undefined,
      });
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      const traduzidos: Erros = {};
      for (const [chave, mensagem] of Object.entries(campos)) {
        const campo = CAMPOS_DA_API[chave];
        if (campo) traduzidos[campo] = mensagem;
      }
      setErros(traduzidos);
      const temErroDeCampo = Object.keys(traduzidos).length > 0;
      setErroGeral(
        geral ??
          (temErroDeCampo
            ? undefined
            : erro instanceof ErroDeApi
              ? erro.message
              : "Não foi possível salvar o anúncio."),
      );
      setEnviando(false);
    }
  };

  const rotuloBotao =
    rotuloDoEnvio ??
    (modo === "vender" ? "Anunciar produto" : "Publicar anúncio");

  return (
    <form className={estilos.formulario} noValidate onSubmit={enviar}>
      {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}

      {/* 📝 Informações básicas */}
      <section className={estilos.secao} aria-labelledby="secao-info-basica">
        <h2 id="secao-info-basica">📝 Informações básicas</h2>

        <Campo
          rotulo={modo === "vender" ? "Título do produto" : "Título"}
          placeholder={
            modo === "vender"
              ? "Ex: iPhone 14 Pro Max 256GB Space Black"
              : "Ex: iPhone 14 Pro Max 256GB"
          }
          dica={
            modo === "vender"
              ? "Descreva seu produto de forma atrativa."
              : "Seja específico sobre o produto que procura."
          }
          maxLength={TITULO_MAXIMO}
          value={texto.titulo}
          onChange={(evento) => alterar("titulo")(evento.target.value)}
          erro={erros.titulo}
          obrigatorio
        />

        <Campo
          como="select"
          rotulo="Categoria"
          value={texto.categoria}
          onChange={(evento) => alterar("categoria")(evento.target.value)}
          erro={
            erros.categoria ??
            (categorias.isError
              ? "Não foi possível carregar as categorias."
              : undefined)
          }
          disabled={categorias.isPending}
          obrigatorio
        >
          <option value="">
            {categorias.isPending ? "Carregando categorias…" : "Selecione"}
          </option>
          {categorias.data?.map((categoria) => (
            <option key={categoria.slug} value={categoria.slug}>
              {categoria.nome}
            </option>
          ))}
        </Campo>

        <Campo
          como="textarea"
          rotulo="Descrição"
          placeholder={
            modo === "vender"
              ? "Descreva os detalhes do produto, tempo de uso, motivo da venda…"
              : "Estado desejado, acessórios, cor, o que não serve…"
          }
          dica={
            modo === "vender"
              ? "Descreva seu produto de forma atrativa e completa."
              : "Descreva o que você procura."
          }
          linhas={4}
          value={texto.descricao}
          onChange={(evento) => alterar("descricao")(evento.target.value)}
          erro={erros.descricao}
          obrigatorio
        />

        {/* Estado de conservação */}
        <div className={estilos.grupoChips}>
          <span className={estilos.rotuloChips}>
            {modo === "comprar" ? "Estado desejado" : "Estado de conservação"}
          </span>
          <div
            className={estilos.listaChips}
            role="group"
            aria-label="Estado de conservação"
          >
            {ESTADOS_CONSERVACAO.map((estado) => {
              const ativo = estadosSelecionados.includes(estado);
              return (
                <Chip
                  key={estado}
                  ativo={ativo}
                  onClick={() => alternarEstado(estado)}
                >
                  {estado}
                </Chip>
              );
            })}
          </div>
          <p className={estilos.dicaChips}>
            {modo === "comprar"
              ? "Opcional · Selecione um ou mais estados de conservação desejados."
              : "Selecione o estado atual do produto."}
          </p>
          {erros.estadoConservacao && (
            <p className={estilos.erro} role="alert">
              {erros.estadoConservacao}
            </p>
          )}
        </div>

        {/* Upload de foto */}
        <UploadDeFoto
          fotoInicial={fotoUrl}
          aoMudar={(arquivo, url) => {
            setFotoArquivo(arquivo);
            setFotoUrl(url);
          }}
          erro={erros.foto}
        />

        {/* Indicador de urgência (apenas no modo comprar) */}
        {modo === "comprar" && (
          <label className={estilos.urgenciaContainer}>
            <input
              type="checkbox"
              checked={urgente}
              onChange={(e) => setUrgente(e.target.checked)}
              className={estilos.urgenciaCheckbox}
            />
            <div className={estilos.urgenciaTexto}>
              <span className={estilos.urgenciaTitulo}>
                Preciso com urgência
              </span>
              <span className={estilos.urgenciaDica}>
                Destaca seu anúncio para vendedores que têm o produto à pronta
                entrega.
              </span>
            </div>
          </label>
        )}
      </section>

      {/* 📍 Localização */}
      <section className={estilos.secao} aria-labelledby="secao-localizacao">
        <h2 id="secao-localizacao">📍 Localização</h2>
        {local ? (
          <p className={estilos.local}>
            {modo === "comprar" ? (
              <>
                O raio parte da sua localização de referência,{" "}
                <strong>{local}</strong>.{" "}
                <Link to="/perfil">Alterar no perfil</Link>
              </>
            ) : (
              <>
                Seu produto será anunciado a partir de sua localização de
                referência, <strong>{local}</strong>.{" "}
                <Link to="/perfil">Alterar no perfil</Link>
              </>
            )}
          </p>
        ) : (
          <Aviso tom="erro" titulo="Falta sua localização">
            O anúncio usa a localização do seu perfil.{" "}
            <Link to="/perfil">Cadastre a localização</Link> antes de publicar.
          </Aviso>
        )}

        {modo === "comprar" && (
          <div className={estilos.raio}>
            <div className={estilos.controleDoRaio}>
              <label className={estilos.rotuloDoRaio} htmlFor="raio-km">
                Raio de busca
                <output htmlFor="raio-km">{raioKm} km</output>
              </label>
              <input
                id="raio-km"
                className={estilos.deslizante}
                type="range"
                min={1}
                max={RAIO_MAXIMO_KM}
                step={1}
                value={raioKm}
                aria-valuetext={`${raioKm} km`}
                onChange={(evento) => setRaioKm(Number(evento.target.value))}
              />
              <div
                className={estilos.atalhos}
                role="group"
                aria-label="Raios comuns"
              >
                {ATALHOS_DE_RAIO.map((km) => (
                  <Chip
                    key={km}
                    ativo={raioKm === km}
                    onClick={() => setRaioKm(km)}
                  >
                    {km} km
                  </Chip>
                ))}
              </div>
              {erros.raioKm && <Aviso tom="erro">{erros.raioKm}</Aviso>}
            </div>
            <PreviaDoAlcance
              raioKm={raioKm}
              raioMaximoKm={RAIO_MAXIMO_KM}
              local={local || "você"}
            />
          </div>
        )}
      </section>

      {/* 💰 Preço / Orçamento */}
      <section className={estilos.secao} aria-labelledby="secao-preco">
        <h2 id="secao-preco">
          {modo === "comprar" ? "💰 Orçamento" : "💰 Preço"}
        </h2>

        {modo === "comprar" ? (
          <>
            <div className={estilos.grade}>
              <Campo
                rotulo="Mínimo (R$)"
                inputMode="decimal"
                placeholder="0,00"
                dica="Opcional."
                value={texto.precoMin}
                onChange={(evento) => alterar("precoMin")(evento.target.value)}
                erro={erros.precoMin}
              />
              <Campo
                rotulo="Máximo (R$)"
                inputMode="decimal"
                placeholder="0,00"
                dica="Opcional. Vendedores veem a faixa."
                value={texto.precoMax}
                onChange={(evento) => alterar("precoMax")(evento.target.value)}
                erro={erros.precoMax}
              />
            </div>
            {faixaValida && (
              <p className={estilos.faixa}>
                Faixa: {fmtPrice(precoMin)} a {fmtPrice(precoMax)}
              </p>
            )}
          </>
        ) : (
          <div className={estilos.campoPrecoVender}>
            <Campo
              rotulo="Preço (R$)"
              inputMode="decimal"
              placeholder="0,00"
              dica="Informe o valor desejado pelo produto."
              value={texto.preco}
              onChange={(evento) => alterar("preco")(evento.target.value)}
              erro={erros.preco}
              obrigatorio
            />
          </div>
        )}
      </section>

      <Botao
        type="submit"
        tamanho="grande"
        larguraTotal
        carregando={enviando}
        disabled={!local}
      >
        {rotuloBotao}
      </Botao>
    </form>
  );
}
