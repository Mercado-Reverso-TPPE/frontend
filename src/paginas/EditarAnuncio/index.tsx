import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { acoesPermitidas, editarAnuncio, obterMeuAnuncio } from "@/api/meusAnuncios";
import { FormularioDeAnuncio } from "@/componentes/anuncio/FormularioDeAnuncio";
import { Aviso, Carregando, ErroAoCarregar } from "@/componentes/estado";
import { ROTULO_DO_STATUS } from "@/paginas/MeusAnuncios/status";
import estilos from "@/paginas/Anunciar/Anunciar.module.css";

/** Edição de um anúncio de "procura-se" ainda aberto (QRO-05). */
export default function EditarAnuncio() {
  const { id = "" } = useParams();
  const navegar = useNavigate();
  const clienteDeConsulta = useQueryClient();
  const anuncio = useQuery({ queryKey: ["meus-anuncios", "detalhe", id], queryFn: () => obterMeuAnuncio(id) });

  return (
    <div className={estilos.pagina}>
      <Link to="/meus-anuncios" className={estilos.voltar}>
        ← Meus anúncios
      </Link>
      <h1 className={estilos.titulo}>Editar anúncio</h1>

      {anuncio.isPending && <Carregando rotulo="Carregando anúncio…" />}
      {anuncio.isError && <ErroAoCarregar erro={anuncio.error} aoTentarDeNovo={() => anuncio.refetch()} />}

      {anuncio.data && !acoesPermitidas(anuncio.data.status).includes("editar") && (
        <Aviso tom="erro" titulo="Este anúncio não pode ser editado">
          Ele está {ROTULO_DO_STATUS[anuncio.data.status].toLowerCase()}. Só anúncios ativos ou pausados aceitam
          alterações.
        </Aviso>
      )}

      {anuncio.data && acoesPermitidas(anuncio.data.status).includes("editar") && (
        <>
          <p className={estilos.subtitulo}>Vendedores passam a ver a versão nova assim que você salvar.</p>
          <FormularioDeAnuncio
            inicial={anuncio.data}
            rotuloDoEnvio="Salvar alterações"
            aoEnviar={async (dados) => {
              const salvo = await editarAnuncio(id, dados);
              await clienteDeConsulta.invalidateQueries({ queryKey: ["meus-anuncios"] });
              navegar("/meus-anuncios", { state: { aviso: `Alterações em "${salvo.titulo}" salvas.` } });
            }}
          />
        </>
      )}
    </div>
  );
}
