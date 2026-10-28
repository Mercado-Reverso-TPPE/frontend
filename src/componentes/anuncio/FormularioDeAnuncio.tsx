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
import estilos from "./FormularioDeAnuncio.module.css";

const ATALHOS_DE_RAIO = [5, 10, 25, 50, 100];
const TITULO_MAXIMO = 160;

type CampoDoAnuncio = "titulo" | "categoria" | "descricao" | "precoMin" | "precoMax" | "raioKm";
type Erros = Partial<Record<CampoDoAnuncio, string>>;

/** Nome do campo no backend → nome no formulário. */
const CAMPOS_DA_API: Record<string, CampoDoAnuncio> = {
  titulo: "titulo",
  categoria: "categoria",
  descricao: "descricao",
  preco_min: "precoMin",
  preco_max: "precoMax",
  raio_km: "raioKm",
};

interface FormularioDeAnuncioProps {
  inicial?: DadosDoAnuncio;
  rotuloDoEnvio: string;
  /** Envia os dados; erros de `ErroDeApi` aparecem no formulário. */
  aoEnviar: (dados: DadosDoAnuncio) => Promise<void>;
}

/** Formulário de "procura-se" usado para publicar e para editar (QRO-04). */
export function FormularioDeAnuncio({ inicial, rotuloDoEnvio, aoEnviar }: FormularioDeAnuncioProps) {
  const { usuario } = useSessao();
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias, staleTime: Infinity });

  const [texto, setTexto] = useState({
    titulo: inicial?.titulo ?? "",
    categoria: inicial?.categoria ?? "",
    descricao: inicial?.descricao ?? "",
    precoMin: valorParaCampo(inicial?.precoMin ?? null),
    precoMax: valorParaCampo(inicial?.precoMax ?? null),
  });
  const [raioKm, setRaioKm] = useState(inicial?.raioKm ?? RAIO_PADRAO_KM);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const local = usuario?.city ? `${usuario.city}${usuario.state ? `, ${usuario.state}` : ""}` : "";
  const precoMin = lerValorEmReais(texto.precoMin);
  const precoMax = lerValorEmReais(texto.precoMax);
  const faixaValida =
    precoMin !== null && precoMax !== null && !Number.isNaN(precoMin) && !Number.isNaN(precoMax) && precoMin <= precoMax;

  const alterar = (campo: keyof typeof texto) => (valor: string) => {
    setTexto((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const validar = (): Erros => {
    const encontrados: Erros = {};
    if (!texto.titulo.trim()) encontrados.titulo = "Diga o que você procura.";
    else if (texto.titulo.trim().length > TITULO_MAXIMO) encontrados.titulo = `Use até ${TITULO_MAXIMO} caracteres.`;
    if (!texto.categoria) encontrados.categoria = "Escolha uma categoria.";
    if (!texto.descricao.trim()) encontrados.descricao = "Descreva o que você procura.";
    if (precoMin !== null && (Number.isNaN(precoMin) || precoMin < 0)) encontrados.precoMin = "Informe um valor em reais, como 1.200,00.";
    if (precoMax !== null && (Number.isNaN(precoMax) || precoMax < 0)) encontrados.precoMax = "Informe um valor em reais, como 1.200,00.";
    if (!encontrados.precoMin && !encontrados.precoMax && precoMin !== null && precoMax !== null && precoMin > precoMax) {
      encontrados.precoMax = "O máximo precisa ser maior ou igual ao mínimo.";
    }
    if (!Number.isInteger(raioKm) || raioKm < 1 || raioKm > RAIO_MAXIMO_KM) {
      encontrados.raioKm = `Escolha um raio entre 1 e ${RAIO_MAXIMO_KM} km.`;
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
        raioKm,
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
          (temErroDeCampo ? undefined : erro instanceof ErroDeApi ? erro.message : "Não foi possível salvar o anúncio."),
      );
      setEnviando(false);
    }
  };

  return (
    <form className={estilos.formulario} noValidate onSubmit={enviar}>
      {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}

      <section className={estilos.secao} aria-labelledby="secao-produto">
        <h2 id="secao-produto">O que você procura</h2>
        <Campo
          rotulo="Título"
          placeholder="Ex.: iPhone 14 Pro 256GB"
          dica="Seja específico: modelo, tamanho, versão."
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
          erro={erros.categoria ?? (categorias.isError ? "Não foi possível carregar as categorias." : undefined)}
          disabled={categorias.isPending}
          obrigatorio
        >
          <option value="">{categorias.isPending ? "Carregando categorias…" : "Selecione"}</option>
          {categorias.data?.map((categoria) => (
            <option key={categoria.slug} value={categoria.slug}>
              {categoria.nome}
            </option>
          ))}
        </Campo>
        <Campo
          como="textarea"
          rotulo="Descrição"
          placeholder="Estado desejado, acessórios, cor, o que não serve…"
          linhas={4}
          value={texto.descricao}
          onChange={(evento) => alterar("descricao")(evento.target.value)}
          erro={erros.descricao}
          obrigatorio
        />
      </section>

      <section className={estilos.secao} aria-labelledby="secao-orcamento">
        <h2 id="secao-orcamento">Quanto quer pagar</h2>
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
      </section>

      <section className={estilos.secao} aria-labelledby="secao-alcance">
        <h2 id="secao-alcance">Até onde buscar</h2>
        {local ? (
          <p className={estilos.local}>
            O raio parte da sua localização de referência, <strong>{local}</strong>.{" "}
            <Link to="/perfil">Alterar no perfil</Link>
          </p>
        ) : (
          <Aviso tom="erro" titulo="Falta sua localização">
            O anúncio usa a localização do seu perfil. <Link to="/perfil">Cadastre a localização</Link> antes de
            publicar.
          </Aviso>
        )}
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
            <div className={estilos.atalhos} role="group" aria-label="Raios comuns">
              {ATALHOS_DE_RAIO.map((km) => (
                <Chip key={km} ativo={raioKm === km} onClick={() => setRaioKm(km)}>
                  {km} km
                </Chip>
              ))}
            </div>
            {erros.raioKm && (
              <Aviso tom="erro">{erros.raioKm}</Aviso>
            )}
          </div>
          <PreviaDoAlcance raioKm={raioKm} raioMaximoKm={RAIO_MAXIMO_KM} local={local || "você"} />
        </div>
      </section>

      <Botao type="submit" tamanho="grande" larguraTotal carregando={enviando} disabled={!local}>
        {rotuloDoEnvio}
      </Botao>
    </form>
  );
}
