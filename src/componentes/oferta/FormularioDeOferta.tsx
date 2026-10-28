import { useState, type FormEvent } from "react";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { ESTADOS_DE_CONSERVACAO, type DadosDaOferta, type EstadoDeConservacao } from "@/api/ofertas";
import { Botao, Campo } from "@/componentes/base";
import { Aviso } from "@/componentes/estado";
import { lerValorEmReais, valorParaCampo } from "@/utils/valores";
import estilos from "./Oferta.module.css";

const PRECO_MAXIMO = 99_999_999.99;

type CampoDaOferta = "descricao" | "estadoDeConservacao" | "preco";
type Erros = Partial<Record<CampoDaOferta, string>>;

const CAMPOS_DA_API: Record<string, CampoDaOferta> = {
  descricao: "descricao",
  estado_conservacao: "estadoDeConservacao",
  preco: "preco",
};

interface FormularioDeOfertaProps {
  inicial?: DadosDaOferta;
  rotuloDoEnvio: string;
  aoEnviar: (dados: DadosDaOferta) => Promise<void>;
  aoCancelar?: () => void;
}

/** Descrição, estado de conservação e preço da oferta (QRO-06). */
export function FormularioDeOferta({ inicial, rotuloDoEnvio, aoEnviar, aoCancelar }: FormularioDeOfertaProps) {
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [estado, setEstado] = useState<EstadoDeConservacao | "">(inicial?.estadoDeConservacao ?? "");
  const [preco, setPreco] = useState(valorParaCampo(inicial?.preco ?? null));
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const valor = lerValorEmReais(preco);
    const encontrados: Erros = {};
    if (!descricao.trim()) encontrados.descricao = "Descreva o produto que você está oferecendo.";
    if (!estado) encontrados.estadoDeConservacao = "Escolha o estado de conservação.";
    if (valor === null) encontrados.preco = "Informe o preço.";
    else if (Number.isNaN(valor) || valor <= 0) encontrados.preco = "Informe um valor em reais maior que zero.";
    else if (valor > PRECO_MAXIMO) encontrados.preco = "Valor acima do limite aceito.";
    setErros(encontrados);
    setErroGeral(undefined);
    if (Object.values(encontrados).some(Boolean) || valor === null || !estado) return;

    setEnviando(true);
    try {
      await aoEnviar({ descricao, estadoDeConservacao: estado, preco: valor });
    } catch (erro) {
      const { campos, geral } = errosDeValidacao(erro);
      const traduzidos: Erros = {};
      for (const [chave, mensagem] of Object.entries(campos)) {
        const campo = CAMPOS_DA_API[chave];
        if (campo) traduzidos[campo] = mensagem;
      }
      setErros(traduzidos);
      setErroGeral(
        geral ??
          (Object.keys(traduzidos).length
            ? undefined
            : erro instanceof ErroDeApi
              ? erro.message
              : "Não foi possível enviar a oferta."),
      );
      setEnviando(false);
    }
  };

  return (
    <form className={estilos.formulario} noValidate onSubmit={enviar}>
      {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
      <Campo
        como="textarea"
        rotulo="Descrição do produto"
        placeholder="Modelo, tempo de uso, o que acompanha, defeitos…"
        linhas={4}
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value)}
        erro={erros.descricao}
        obrigatorio
      />
      <div className={estilos.grade}>
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
        <Campo
          rotulo="Preço (R$)"
          inputMode="decimal"
          placeholder="0,00"
          value={preco}
          onChange={(evento) => setPreco(evento.target.value)}
          erro={erros.preco}
          obrigatorio
        />
      </div>
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
