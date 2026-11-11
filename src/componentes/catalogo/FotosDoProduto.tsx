import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enviarFotos, LIMITE_DE_FOTOS, removerFoto, TIPOS_DE_FOTO, validarFotos, type Produto } from "@/api/catalogo";
import { ErroDeApi, errosDeValidacao } from "@/api/cliente";
import { Botao, Campo } from "@/componentes/base";
import { Aviso } from "@/componentes/estado";
import negociacaoEstilos from "@/componentes/negociacao/Negociacao.module.css";
import { REGRA_DAS_FOTOS } from "./FormularioDeProduto";

/** Junta as mensagens que o backend devolve em `fotos` (uma por arquivo). */
export function mensagemDasFotos(erro: unknown) {
  if (erro instanceof ErroDeApi && erro.status === 400 && erro.detalhes && typeof erro.detalhes === "object") {
    const fotos = (erro.detalhes as { fotos?: unknown }).fotos;
    if (Array.isArray(fotos) && fotos.length) return fotos.map(String).join(" ");
  }
  const { geral, campos } = errosDeValidacao(erro);
  return campos.fotos ?? geral ?? (erro instanceof ErroDeApi ? erro.message : "Não foi possível enviar as fotos.");
}

/** Fotos de um produto já cadastrado: adicionar e remover, com os limites do backend. */
export function FotosDoProduto({ produto }: { produto: Produto }) {
  const clienteDeConsulta = useQueryClient();
  const [erro, setErro] = useState<string>();
  const restantes = LIMITE_DE_FOTOS - produto.fotos.length;
  const atualizar = () => clienteDeConsulta.invalidateQueries({ queryKey: ["produtos"] });

  const adicionar = useMutation({
    mutationFn: (arquivos: File[]) => enviarFotos(produto.id, arquivos),
    onSuccess: () => setErro(undefined),
    onError: (falha) => setErro(mensagemDasFotos(falha)),
    onSettled: atualizar,
  });

  const remover = useMutation({
    mutationFn: (fotoId: number) => removerFoto(produto.id, fotoId),
    onError: (falha) => setErro(falha instanceof ErroDeApi ? falha.message : "Não foi possível remover a foto."),
    onSettled: atualizar,
  });

  const escolher = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    if (!arquivos.length) return;
    const problemas = validarFotos(arquivos, produto.fotos.length);
    if (problemas.length) return setErro(problemas.join(" "));
    setErro(undefined);
    adicionar.mutate(arquivos);
  };

  return (
    <div className={negociacaoEstilos.secao} role="group" aria-label={`Fotos de ${produto.nome}`}>
      <p className={negociacaoEstilos.meta}>
        {produto.fotos.length} de {LIMITE_DE_FOTOS} fotos. {REGRA_DAS_FOTOS}
      </p>
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {produto.fotos.length > 0 && (
        <ul className={`${negociacaoEstilos.linha} ${negociacaoEstilos.listaSemMarcador}`}>
          {produto.fotos.map((foto, indice) => (
            <li key={foto.id} className={negociacaoEstilos.eventoCorpo}>
              {foto.url ? (
                <img className={negociacaoEstilos.miniatura} src={foto.url} alt={`Foto ${indice + 1} de ${produto.nome}`} />
              ) : (
                <span className={negociacaoEstilos.meta}>Foto {indice + 1}</span>
              )}
              <Botao
                variante="texto"
                tamanho="pequeno"
                carregando={remover.isPending && remover.variables === foto.id}
                onClick={() => remover.mutate(foto.id)}
                aria-label={`Remover foto ${indice + 1}`}
              >
                Remover
              </Botao>
            </li>
          ))}
        </ul>
      )}
      {restantes > 0 ? (
        <Campo
          rotulo={adicionar.isPending ? "Enviando fotos…" : "Adicionar fotos"}
          type="file"
          accept={TIPOS_DE_FOTO.join(",")}
          multiple
          disabled={adicionar.isPending}
          onChange={escolher}
        />
      ) : (
        <p className={negociacaoEstilos.meta}>Limite de fotos atingido. Remova uma para adicionar outra.</p>
      )}
    </div>
  );
}
