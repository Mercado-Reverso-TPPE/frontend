import { EstadoVazio } from "@/componentes/estado";

/**
 * Minha loja — catálogo de produtos do vendedor (QRO-08).
 *
 * A rota existe desde a fundação para que o cabeçalho e o fluxo de oferta
 * já apontem para o lugar definitivo. O cadastro de produtos chega com a
 * issue do catálogo; até lá a tela mostra o próximo passo.
 */
export default function MinhaLoja() {
  return (
    <div className="conteudo" style={{ paddingBlock: "var(--espaco-4)" }}>
      <h1 style={{ fontSize: "var(--tamanho-h1)", margin: "0 0 var(--espaco-1)" }}>Minha loja</h1>
      <p style={{ color: "var(--texto-secundario)", margin: "0 0 var(--espaco-3)" }}>
        Os produtos cadastrados aqui preenchem suas ofertas com um clique.
      </p>

      <EstadoVazio
        icone="🏷️"
        titulo="Seu catálogo está vazio"
        descricao="Cadastre os produtos que você vende para responder aos anúncios de procura-se sem digitar tudo de novo."
        acao={{ rotulo: "Ver anúncios de procura-se", para: "/?tipo=procurando" }}
      />
    </div>
  );
}
