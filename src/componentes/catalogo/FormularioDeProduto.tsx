import { useState, type ChangeEvent, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FORMATOS_DE_FOTO,
  LIMITE_DE_FOTOS,
  TAMANHO_MAXIMO_DA_FOTO_MB,
  TIPOS_DE_FOTO,
  validarFotos,
  type DadosDoProduto,
} from "@/api/catalogo";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { listarCategorias } from "@/api/meusAnuncios";
import { ESTADOS_DE_CONSERVACAO, type EstadoDeConservacao } from "@/api/ofertas";
import { Botao, Campo } from "@/componentes/base";
import { Aviso } from "@/componentes/estado";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";
import estilos from "@/componentes/oferta/Oferta.module.css";

const PRECO_MAXIMO = 99_999_999.99;

type CampoDoProduto = "nome" | "categoria" | "descricao" | "estadoDeConservacao" | "preco" | "fotos";
type Erros = Partial<Record<CampoDoProduto, string>>;

const CAMPOS_DA_API: Record<string, CampoDoProduto> = {
  nome: "nome",
  categoria: "categoria",
  descricao: "descricao",
  estado_conservacao: "estadoDeConservacao",
  preco: "preco",
  fotos: "fotos",
};

/** Texto fixo com os limites de envio de fotos, igual ao backend. */
export const REGRA_DAS_FOTOS = `Até ${LIMITE_DE_FOTOS} fotos por produto, em ${FORMATOS_DE_FOTO}, com no máximo ${TAMANHO_MAXIMO_DA_FOTO_MB} MB cada.`;

interface FormularioDeProdutoProps {
  inicial?: DadosDoProduto;
  rotuloDoEnvio: string;
  /** Aceita fotos junto do cadastro (só na criação; na edição, há o gerenciador). */
  comFotos?: boolean;
  aoEnviar: (dados: DadosDoProduto, categoriaNome: string, fotos: File[]) => Promise<void>;
  aoCancelar?: () => void;
}

/** Nome, categoria, descrição, conservação e preço do produto (QRO-08). */
export function FormularioDeProduto({ inicial, rotuloDoEnvio, comFotos, aoEnviar, aoCancelar }: FormularioDeProdutoProps) {
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias, staleTime: Infinity });
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [categoria, setCategoria] = useState(inicial?.categoria ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [estado, setEstado] = useState<EstadoDeConservacao | "">(inicial?.estadoDeConservacao ?? "");
  const [preco, setPreco] = useState(valorParaCampo(inicial?.preco ?? null));
  const [fotos, setFotos] = useState<File[]>([]);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const escolherFotos = (evento: ChangeEvent<HTMLInputElement>) => {
    const escolhidas = Array.from(evento.target.files ?? []);
    const problemas = validarFotos(escolhidas, 0);
    setErros((atuais) => ({ ...atuais, fotos: problemas.join(" ") || undefined }));
    setFotos(problemas.length ? [] : escolhidas);
    if (problemas.length) evento.target.value = "";
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const valor = lerValorEmReais(preco);
    const encontrados: Erros = {};
    if (!nome.trim()) encontrados.nome = "Informe o nome do produto.";
    if (!categoria) encontrados.categoria = "Escolha a categoria.";
    if (!descricao.trim()) encontrados.descricao = "Descreva o produto.";
    if (!estado) encontrados.estadoDeConservacao = "Escolha o estado de conservação.";
    if (valor === null) encontrados.preco = "Informe o preço.";
    else if (Number.isNaN(valor) || valor <= 0) encontrados.preco = "Informe um valor em reais maior que zero.";
    else if (valor > PRECO_MAXIMO) encontrados.preco = "Valor acima do limite aceito.";
    if (erros.fotos) encontrados.fotos = erros.fotos;
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.values(encontrados).some(Boolean) || valor === null || !estado) return;

    const nomeDaCategoria = categorias.data?.find((item) => item.slug === categoria)?.nome ?? categoria;
    setEnviando(true);
    try {
      await aoEnviar({ nome, categoria, descricao, estadoDeConservacao: estado, preco: valor }, nomeDaCategoria, fotos);
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      const traduzidos: Erros = {};
      for (const [chave, mensagem] of Object.entries(campos)) {
        const campo = CAMPOS_DA_API[chave.split(".")[0]];
        if (campo) traduzidos[campo] = mensagem;
      }
      setErros(traduzidos);
      setErroGeral(
        geral ??
          (Object.keys(traduzidos).length
            ? undefined
            : erro instanceof ErroDeApi
              ? erro.message
              : "Não foi possível salvar o produto."),
      );
      setEnviando(false);
    }
  };

  return (
    <form className={estilos.formulario} noValidate onSubmit={enviar} aria-label={rotuloDoEnvio}>
      {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
      <Campo
        rotulo="Nome do produto"
        maxLength={160}
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        erro={erros.nome}
        obrigatorio
      />
      <div className={estilos.grade}>
        <Campo
          como="select"
          rotulo="Categoria"
          value={categoria}
          onChange={(evento) => setCategoria(evento.target.value)}
          erro={erros.categoria}
          obrigatorio
        >
          <option value="">{categorias.isPending ? "Carregando…" : "Selecione"}</option>
          {categorias.data?.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.nome}
            </option>
          ))}
        </Campo>
        <Campo
          como="select"
          rotulo="Estado de conservação"
          value={estado}
          onChange={(evento) => setEstado(evento.target.value as EstadoDeConservacao)}
          erro={erros.estadoDeConservacao}
          obrigatorio
        >
          <option value="">Selecione</option>
          {ESTADOS_DE_CONSERVACAO.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.rotulo}
            </option>
          ))}
        </Campo>
      </div>
      <Campo
        como="textarea"
        rotulo="Descrição"
        placeholder="Modelo, tempo de uso, o que acompanha, defeitos…"
        linhas={4}
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value)}
        erro={erros.descricao}
        obrigatorio
      />
      <Campo
        rotulo="Preço (R$)"
        inputMode="decimal"
        placeholder="0,00"
        value={preco}
        onChange={(evento) => setPreco(evento.target.value)}
        erro={erros.preco}
        obrigatorio
      />
      {comFotos && (
        <Campo
          rotulo="Fotos (opcional)"
          type="file"
          accept={TIPOS_DE_FOTO.join(",")}
          multiple
          onChange={escolherFotos}
          dica={REGRA_DAS_FOTOS}
          erro={erros.fotos}
        />
      )}
      <div className={estilos.acoes}>
        <Botao type="submit" carregando={enviando}>
          {rotuloDoEnvio}
        </Botao>
        {aoCancelar && (
          <Botao variante="texto" onClick={aoCancelar}>
            Cancelar
          </Botao>
        )}
      </div>
    </form>
  );
}
