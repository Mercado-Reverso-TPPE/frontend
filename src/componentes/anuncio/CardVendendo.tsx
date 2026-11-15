import { ROTULO_DE_CONSERVACAO, type ProdutoAVenda } from "@/api/vitrine";
import { Avatar, Badge, Botao } from "@/componentes/base";
import { IEye, IPin, IStar, ITag } from "@/componentes/icones";
import { catColor } from "@/estilos/tokens";
import { fmtDistancia, fmtNota, fmtNumero, fmtPrice, fmtTempoRelativo } from "@/utils/formato";
import { iconeDaCategoria } from "./categorias";
import { corDaPessoa, iniciaisDe, nomeCurto } from "./pessoa";
import estilos from "./Cards.module.css";

interface CardVendendoProps {
  produto: ProdutoAVenda;
  /** Destino do botão "Ofertar". */
  paraOfertar?: string;
}

/**
 * Card de produto à venda (aba "Vendendo"): foto à esquerda com o estado de
 * conservação, preço em destaque e o vendedor no rodapé. Em telas pequenas a
 * foto vai para o topo.
 */
export function CardVendendo({ produto, paraOfertar = "/anunciar" }: CardVendendoProps) {
  const corDaCategoria = catColor(produto.categoriaNome);
  const vendedor = produto.vendedor;

  return (
    <article className={`${estilos.card} ${estilos.cardVenda}`}>
      <span className={estilos.faixaVertical} aria-hidden="true" />

      <div className={estilos.foto}>
        {produto.foto ? (
          <img src={produto.foto} alt={`Foto de ${produto.titulo}`} loading="lazy" />
        ) : (
          <div className={estilos.fotoVazia} role="img" aria-label={`${produto.titulo} sem foto`}>
            <span aria-hidden="true">{iconeDaCategoria(produto.categoriaNome)}</span>
          </div>
        )}
        <span className={estilos.conservacao}>
          <Badge tom="neutro">{ROTULO_DE_CONSERVACAO[produto.estadoConservacao] ?? produto.estadoConservacao}</Badge>
        </span>
      </div>

      <div className={estilos.corpoVenda}>
        <div className={estilos.topo}>
          <Badge tom="marca" icone="🏷️">
            Vendendo
          </Badge>
          <Badge cor={corDaCategoria} icone={<ITag size={10} color={corDaCategoria} />}>
            {produto.categoriaNome}
          </Badge>
          <time className={estilos.tempo} dateTime={produto.criadoEm}>
            {fmtTempoRelativo(produto.criadoEm)}
          </time>
        </div>

        <h3 className={`${estilos.titulo} truncar-2`}>{produto.titulo}</h3>
        <p className={`${estilos.descricao} truncar-2`}>{produto.descricao}</p>

        <div className={estilos.linhaPreco}>
          <span className={estilos.preco}>{fmtPrice(produto.preco)}</span>
          <div className={estilos.metricas}>
            {produto.distanciaKm !== null && (
              <span className={estilos.metrica}>
                <IPin size={11} aria-hidden="true" />
                {fmtDistancia(produto.distanciaKm)}
              </span>
            )}
            {produto.visualizacoes !== null && (
              <span className={estilos.metrica}>
                <IEye size={12} aria-hidden="true" />
                {fmtNumero(produto.visualizacoes)}
                <span className="apenas-leitor-de-tela"> visualizações</span>
              </span>
            )}
          </div>
        </div>

        <div className={estilos.rodapeVenda}>
          {vendedor && (
            <>
              <Avatar
                iniciais={iniciaisDe(vendedor.nome)}
                cor={corDaPessoa(vendedor.id)}
                foto={vendedor.foto ?? undefined}
                nome={nomeCurto(vendedor.nome)}
                tamanho={28}
              />
              <div className={estilos.pessoaDados}>
                <div className={estilos.pessoaNome}>{nomeCurto(vendedor.nome)}</div>
                {vendedor.nota !== null && (
                  <div className={estilos.reputacao}>
                    <IStar size={11} aria-hidden="true" />
                    {fmtNota(vendedor.nota)}
                  </div>
                )}
              </div>
            </>
          )}

          <Botao
            variante="suave"
            tamanho="pequeno"
            className={estilos.acao}
            para={paraOfertar}
            aria-label={`Ofertar por ${produto.titulo}`}
          >
            Ofertar
          </Botao>
        </div>
      </div>
    </article>
  );
}
