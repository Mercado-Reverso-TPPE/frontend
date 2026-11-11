import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { publicarAnuncio } from "@/api/meusAnuncios";
import { criarProduto, enviarFotos } from "@/api/catalogo";
import type { EstadoDeConservacao } from "@/api/ofertas";
import { FormularioDeAnuncio } from "@/componentes/anuncio/FormularioDeAnuncio";
import { ICheck } from "@/componentes/icones";
import { useSessao } from "@/hooks/useSessao";
import estilos from "./Anunciar.module.css";

const mapearEstado = (opcao?: string): EstadoDeConservacao => {
  if (opcao === "Novo") return "novo";
  if (opcao === "Semi-novo") return "seminovo";
  return "usado_bom";
};

/** Tela de publicação de anúncio (comprar ou vender). */
export default function Anunciar() {
  const { usuario } = useSessao();
  const navegar = useNavigate();
  const clienteDeConsulta = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tipoUrl = searchParams.get("tipo");
  const modo = tipoUrl === "vender" ? "vender" : "comprar";

  const selecionarModo = (novoModo: "comprar" | "vender") => {
    setSearchParams(
      novoModo === "vender" ? { tipo: "vender" } : { tipo: "comprar" },
    );
  };

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>Criar anúncio</h1>
      <p className={estilos.subtitulo}>
        {modo === "comprar"
          ? "Publique o que você procura e receba ofertas de vendedores próximos."
          : "Anuncie seu produto para compradores interessados."}
      </p>

      {/* Cartões de escolha lado a lado */}
      <div
        className={estilos.escolhaModo}
        role="radiogroup"
        aria-label="Tipo de anúncio"
      >
        <button
          type="button"
          role="radio"
          aria-checked={modo === "comprar"}
          className={`${estilos.cartaoModo} ${
            modo === "comprar" ? estilos.cartaoSelecionado : ""
          }`}
          onClick={() => selecionarModo("comprar")}
        >
          {modo === "comprar" && (
            <span className={estilos.checkSelo} aria-hidden="true">
              <ICheck size={13} color="#fff" />
            </span>
          )}
          <span className={estilos.modoIcone} aria-hidden="true">
            🛒
          </span>
          <span className={estilos.modoTitulo}>Quero Comprar</span>
          <span className={estilos.modoDescricao}>
            Publique o que você procura e receba ofertas
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={modo === "vender"}
          className={`${estilos.cartaoModo} ${
            modo === "vender" ? estilos.cartaoSelecionado : ""
          }`}
          onClick={() => selecionarModo("vender")}
        >
          {modo === "vender" && (
            <span className={estilos.checkSelo} aria-hidden="true">
              <ICheck size={13} color="#fff" />
            </span>
          )}
          <span className={estilos.modoIcone} aria-hidden="true">
            🏷️
          </span>
          <span className={estilos.modoTitulo}>Quero Vender</span>
          <span className={estilos.modoDescricao}>
            Anuncie seu produto para compradores interessados
          </span>
        </button>
      </div>

      <FormularioDeAnuncio
        key={modo}
        modo={modo}
        rotuloDoEnvio={
          modo === "vender" ? "Anunciar produto" : "Publicar anúncio"
        }
        aoEnviar={async (dados) => {
          if (modo === "vender") {
            const estado = mapearEstado(dados.estadoConservacao?.[0]);
            const produto = await criarProduto({
              nome: dados.titulo,
              descricao: dados.descricao,
              categoria: dados.categoria,
              estadoDeConservacao: estado,
              preco: dados.preco ?? 0,
            });

            if (dados.fotoArquivo) {
              try {
                await enviarFotos(produto.id, [dados.fotoArquivo]);
              } catch {
                // segue adiante se a foto falhar
              }
            }

            await clienteDeConsulta.invalidateQueries({
              queryKey: ["produtos"],
            });
            navegar("/minha-loja", {
              state: {
                aviso: `"${produto.nome}" foi cadastrado no seu catálogo.`,
              },
            });
          } else {
            const novo = await publicarAnuncio(dados, {
              cidade: usuario?.city ?? "",
              uf: usuario?.state ?? "",
            });
            await clienteDeConsulta.invalidateQueries({
              queryKey: ["meus-anuncios"],
            });
            navegar("/meus-anuncios", {
              state: {
                aviso: `"${novo.titulo}" foi publicado. Vendedores próximos já podem enviar ofertas.`,
              },
            });
          }
        }}
      />
    </div>
  );
}
