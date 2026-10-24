import { createBrowserRouter, type RouteObject } from "react-router";
import LayoutApp from "@/componentes/layout/LayoutApp";
import LayoutAutenticacao from "@/componentes/layout/LayoutAutenticacao";
import { RotaPrivada } from "@/componentes/layout/RotaPrivada";
import AceitarOferta from "@/paginas/AceitarOferta";
import Anunciar from "@/paginas/Anunciar";
import AnuncioDetalhe from "@/paginas/AnuncioDetalhe";
import Avaliar from "@/paginas/Avaliar";
import Cadastrar from "@/paginas/Cadastrar";
import ConcluirVenda from "@/paginas/ConcluirVenda";
import ConfirmarEmail from "@/paginas/ConfirmarEmail";
import Contraproposta from "@/paginas/Contraproposta";
import EditarAnuncio from "@/paginas/EditarAnuncio";
import Entrar from "@/paginas/Entrar";
import Feed from "@/paginas/Feed";
import Historico from "@/paginas/Historico";
import MeusAnuncios from "@/paginas/MeusAnuncios";
import MinhaLoja from "@/paginas/MinhaLoja";
import MinhasOfertas from "@/paginas/MinhasOfertas";
import NaoEncontrada from "@/paginas/NaoEncontrada";
import Negociacao from "@/paginas/Negociacao";
import Notificacoes from "@/paginas/Notificacoes";
import OfertarProduto from "@/paginas/OfertarProduto";
import OfertasRecebidas from "@/paginas/OfertasRecebidas";
import Perfil from "@/paginas/Perfil";
import RedefinirSenha from "@/paginas/RedefinirSenha";

/**
 * Mapa de rotas da SPA — os caminhos são os documentados em
 * docs/arquitetura/frontend.md. O que exige sessão fica sob `RotaPrivada`,
 * que devolve a pessoa ao destino original depois de entrar (QRO-02).
 *
 * Exportado como lista para que os testes montem o mesmo mapa com
 * `createMemoryRouter`.
 */
export const rotas: RouteObject[] = [
  {
    path: "/",
    Component: LayoutApp,
    children: [
      { index: true, Component: Feed },
      { path: "anuncios/:id", Component: AnuncioDetalhe },
      {
        Component: RotaPrivada,
        children: [
          { path: "perfil", Component: Perfil },
          { path: "anunciar", Component: Anunciar },
          { path: "meus-anuncios", Component: MeusAnuncios },
          { path: "meus-anuncios/:id/editar", Component: EditarAnuncio },
          { path: "minha-loja", Component: MinhaLoja },
          { path: "minhas-ofertas", Component: MinhasOfertas },
          { path: "anuncios/:id/ofertar", Component: OfertarProduto },
          { path: "anuncios/:id/ofertas", Component: OfertasRecebidas },
          { path: "anuncios/:id/ofertas/:ofertaId/contraproposta", Component: Contraproposta },
          { path: "negociacoes/:id", Component: Negociacao },
          { path: "negociacoes/:id/aceitar", Component: AceitarOferta },
          { path: "negociacoes/:id/concluir", Component: ConcluirVenda },
          { path: "negociacoes/:id/avaliar", Component: Avaliar },
          { path: "notificacoes", Component: Notificacoes },
          { path: "historico", Component: Historico },
        ],
      },
      { path: "*", Component: NaoEncontrada },
    ],
  },
  {
    path: "/",
    Component: LayoutAutenticacao,
    children: [
      { path: "entrar", Component: Entrar },
      { path: "cadastrar", Component: Cadastrar },
      { path: "redefinir-senha", Component: RedefinirSenha },
      { path: "confirmar-email", Component: ConfirmarEmail },
    ],
  },
];

export const roteador = createBrowserRouter(rotas);
