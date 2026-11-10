import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { enviarPalpite, obterEstimativaDePreco } from "@/api/ofertas";
import { Botao, Campo } from "@/componentes/base";
import { Aviso } from "@/componentes/estado";
import { fmtPrecoExato } from "@/utils/formato";
import { lerValorEmReais } from "@/utils/valores";
import estilos from "./Negociacao.module.css";

/**
 * Faixa estimada pelos palpites, só para o comprador (QRO-10). A API entrega
 * apenas mínimo, média e máximo agregados — nunca quem palpitou nem quanto.
 */
export function EstimativaDePreco({ anuncioId }: { anuncioId: string }) {
  const estimativa = useQuery({
    queryKey: ["estimativa", anuncioId],
    queryFn: () => obterEstimativaDePreco(anuncioId),
  });

  return (
    <section className={estilos.secao} aria-label="Faixa estimada pelo mercado">
      <h2>Faixa estimada pelo mercado</h2>
      {estimativa.isPending && <p className={estilos.meta}>Consultando palpites…</p>}
      {estimativa.isError && (
        <p className={estilos.meta}>
          {estimativa.error instanceof ErroDeApi ? estimativa.error.message : "Não foi possível consultar a faixa."}
        </p>
      )}
      {estimativa.data?.disponivel === false && (
        <p className={estilos.texto}>
          A faixa aparece quando houver palpites suficientes de vendedores da região.
        </p>
      )}
      {estimativa.data?.disponivel && (
        <>
          <dl className={estilos.faixa}>
            <div>
              <dt>Mínimo</dt>
              <dd>{fmtPrecoExato(estimativa.data.minimo)}</dd>
            </div>
            <div>
              <dt>Média</dt>
              <dd>{fmtPrecoExato(estimativa.data.media)}</dd>
            </div>
            <div>
              <dt>Máximo</dt>
              <dd>{fmtPrecoExato(estimativa.data.maximo)}</dd>
            </div>
          </dl>
          {estimativa.data.divergeDaFaixa && (
            <Aviso tom="erro" titulo="Sua faixa está fora do mercado">
              A média dos palpites fica fora da faixa de preço do seu anúncio. Vale revisar o orçamento.
            </Aviso>
          )}
        </>
      )}
      <p className={estilos.meta}>
        Palpites são anônimos e não são ofertas: ninguém se compromete a vender por esses valores.
      </p>
    </section>
  );
}

/**
 * Palpite do vendedor (QRO-10): um valor sem compromisso. Palpitar de novo
 * substitui o anterior; ofertar de verdade leva o valor para o formulário.
 */
export function PalpiteDePreco({ anuncioId }: { anuncioId: string }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();

  const palpitar = useMutation({
    mutationFn: (valor: number) => enviarPalpite(anuncioId, valor),
    onError: (falha) => {
      const { campos, geral } = errosDeValidacao(falha);
      setErro(campos.valor ?? geral ?? (falha instanceof ErroDeApi ? falha.message : "Não foi possível registrar."));
    },
  });

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const valor = lerValorEmReais(texto);
    if (valor === null) return setErro("Informe um valor.");
    if (Number.isNaN(valor) || valor <= 0) return setErro("Informe um valor em reais maior que zero.");
    setErro(undefined);
    palpitar.mutate(valor);
  };

  return (
    <section className={estilos.secao} aria-label="Palpite de preço">
      <h2>Quanto isso costuma valer?</h2>
      <p className={estilos.texto}>
        Dê um palpite sem compromisso. Ele não é uma oferta: o comprador vê só a faixa formada por vários
        palpites, sem saber quem palpitou nem quanto.
      </p>
      {palpitar.isSuccess ? (
        <>
          <Aviso tom="sucesso">
            Palpite de {fmtPrecoExato(palpitar.data)} registrado. Se palpitar de novo, o valor anterior é substituído.
          </Aviso>
          <div className={estilos.acoes}>
            <Botao para={`/anuncios/${anuncioId}/ofertar?preco=${palpitar.data}`}>Fazer uma oferta com este valor</Botao>
            <Botao variante="texto" onClick={() => palpitar.reset()}>
              Mudar palpite
            </Botao>
          </div>
        </>
      ) : (
        <form className={estilos.envio} noValidate onSubmit={enviar}>
          <Campo
            rotulo="Seu palpite (R$)"
            inputMode="decimal"
            placeholder="0,00"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            erro={erro}
          />
          <Botao type="submit" variante="secundario" carregando={palpitar.isPending}>
            Enviar palpite
          </Botao>
        </form>
      )}
    </section>
  );
}
