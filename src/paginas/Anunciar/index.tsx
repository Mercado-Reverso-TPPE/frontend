import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { publicarAnuncio } from "@/api/meusAnuncios";
import { FormularioDeAnuncio } from "@/componentes/anuncio/FormularioDeAnuncio";
import { useSessao } from "@/hooks/useSessao";
import estilos from "./Anunciar.module.css";

/** Publicação de um anúncio de "procura-se" (QRO-04). */
export default function Anunciar() {
  const { usuario } = useSessao();
  const navegar = useNavigate();
  const clienteDeConsulta = useQueryClient();

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>Publicar o que você procura</h1>
      <p className={estilos.subtitulo}>
        Vendedores dentro do raio veem seu anúncio e mandam ofertas. Você escolhe se aceita.
      </p>

      <FormularioDeAnuncio
        rotuloDoEnvio="Publicar anúncio"
        aoEnviar={async (dados) => {
          const novo = await publicarAnuncio(dados, { cidade: usuario?.city ?? "", uf: usuario?.state ?? "" });
          await clienteDeConsulta.invalidateQueries({ queryKey: ["meus-anuncios"] });
          navegar("/meus-anuncios", {
            state: { aviso: `"${novo.titulo}" foi publicado. Vendedores próximos já podem enviar ofertas.` },
          });
        }}
      />
    </div>
  );
}
