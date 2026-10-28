import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const vendedor = usuarioDoPerfil(perfilDeTeste);

const anuncio = (dados: Record<string, unknown> = {}) => ({
  id: "a1",
  comprador: "outro-usuario",
  titulo: "Bicicleta aro 29",
  categoria: "esportes",
  categoria_nome: "Esportes",
  descricao: "Com freio a disco.",
  preco_min: "1200.00",
  preco_max: "2500.00",
  raio_km: 25,
  status: "ativo",
  distancia_km: 3.2,
  ofertas_recebidas: 4,
  cidade: "Brasília",
  uf: "DF",
  criado_em: "2026-10-20T15:00:00Z",
  ...dados,
});

const oferta = (dados: Record<string, unknown> = {}) => ({
  id: "o1",
  anuncio_id: "a1",
  vendedor_id: "7f1c",
  vendedor_nome: "Joana da Silva",
  produto_id: null,
  produto_nome: "",
  produto_foto: null,
  descricao: "Caloi Elite 2023, pouco uso.",
  estado_conservacao: "seminovo",
  preco: "2100.00",
  status: "enviada",
  criada_em: "2026-10-21T12:00:00Z",
  atualizada_em: "2026-10-21T12:00:00Z",
  historico: [],
  ...dados,
});

describe("enviar oferta", () => {
  it("valida e envia descrição, conservação e preço", async () => {
    let enviada: unknown = null;
    const chamadas = simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: enviada ? [enviada] : [] } }),
      "POST /anuncios/a1/ofertas": (corpo) => {
        enviada = oferta(corpo as Record<string, unknown>);
        return { status: 201, corpo: enviada };
      },
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    expect(await screen.findByRole("heading", { name: "Bicicleta aro 29" })).toBeInTheDocument();
    expect(screen.getByText("a 3,2 km de você")).toBeInTheDocument();
    // Nada das concorrentes: nem a contagem de ofertas do anúncio aparece.
    expect(screen.queryByText(/4 ofertas/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Enviar oferta" }));
    expect(screen.getByText("Descreva o produto que você está oferecendo.")).toBeInTheDocument();
    expect(screen.getByText("Escolha o estado de conservação.")).toBeInTheDocument();
    expect(screen.getByText("Informe o preço.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Descrição do produto/), "Caloi Elite 2023, pouco uso.");
    await userEvent.selectOptions(screen.getByLabelText(/Estado de conservação/), "seminovo");
    await userEvent.type(screen.getByLabelText(/Preço/), "2.100");
    await userEvent.click(screen.getByRole("button", { name: "Enviar oferta" }));

    expect(await screen.findByText(/Oferta enviada/)).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({
      descricao: "Caloi Elite 2023, pouco uso.",
      estado_conservacao: "seminovo",
      preco: "2100.00",
    });
    const sua = within(await screen.findByRole("region", { name: "Sua oferta" }));
    expect(sua.getByText("Aguardando resposta")).toBeInTheDocument();
    expect(chamadas.every((chamada) => !chamada.caminho.startsWith("/ofertas?"))).toBe(true);
  });

  it("mostra o motivo quando o backend recusa", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [] } }),
      "POST /anuncios/a1/ofertas": () => ({ status: 400, corpo: ["Sua localização está fora do raio deste anúncio."] }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    await userEvent.type(await screen.findByLabelText(/Descrição do produto/), "Caloi.");
    await userEvent.selectOptions(screen.getByLabelText(/Estado de conservação/), "novo");
    await userEvent.type(screen.getByLabelText(/Preço/), "2000");
    await userEvent.click(screen.getByRole("button", { name: "Enviar oferta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sua localização está fora do raio deste anúncio.");
  });

  it("não deixa ofertar no próprio anúncio", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio({ comprador: "7f1c" }) }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [] } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    expect(await screen.findByText("Este anúncio é seu")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar oferta" })).not.toBeInTheDocument();
  });

  it("avisa quando o anúncio não está ativo", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio({ status: "pausado" }) }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [] } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    expect(await screen.findByText("Este anúncio não está recebendo ofertas")).toBeInTheDocument();
  });
});

describe("oferta já enviada", () => {
  it("permite editar enquanto aguarda resposta", async () => {
    const chamadas = simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [oferta()] } }),
      "PATCH /ofertas/o1": (corpo) => ({ corpo: oferta(corpo as Record<string, unknown>) }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Editar oferta" }));
    const preco = screen.getByLabelText(/Preço/);
    expect(preco).toHaveValue("2100");
    await userEvent.clear(preco);
    await userEvent.type(preco, "1950");
    await userEvent.click(screen.getByRole("button", { name: "Salvar oferta" }));

    expect(await screen.findByText("Oferta atualizada.")).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "PATCH")?.corpo).toMatchObject({ preco: "1950.00" });
  });

  it("retira depois de confirmar", async () => {
    const chamadas = simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [oferta()] } }),
      "DELETE /ofertas/o1": () => ({ status: 204 }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Retirar oferta" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Retirar oferta" }));

    expect(await screen.findByText(/Oferta retirada/)).toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.metodo === "DELETE" && chamada.caminho === "/ofertas/o1")).toBe(true);
  });

  it("sinaliza que a oferta aceita não pode mais ser editada nem retirada", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio({ status: "em_negociacao" }) }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [oferta({ status: "aceita" })] } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    expect(await screen.findByText(/Ela não pode mais ser editada nem retirada/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar oferta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retirar oferta" })).not.toBeInTheDocument();
  });
});

describe("minhas ofertas", () => {
  it("lista o status de cada oferta e só oferece ações às que aguardam resposta", async () => {
    simularApi({
      "GET /ofertas/meus": () => ({
        corpo: {
          next: null,
          results: [
            oferta({ id: "o1", descricao: "Caloi aguardando" }),
            oferta({ id: "o2", descricao: "Monark aceita", status: "aceita" }),
            oferta({ id: "o3", descricao: "Trek recusada", status: "recusada" }),
          ],
        },
      }),
    });
    renderizarAplicacao({ rota: "/minhas-ofertas", usuario: vendedor });

    const aguardando = within((await screen.findByRole("heading", { name: "Caloi aguardando" })).closest("li")!);
    expect(aguardando.getByText("Aguardando resposta")).toBeInTheDocument();
    expect(aguardando.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/anuncios/a1/ofertar");
    expect(aguardando.getByRole("button", { name: "Retirar" })).toBeInTheDocument();

    const aceita = within(screen.getByRole("heading", { name: "Monark aceita" }).closest("li")!);
    expect(aceita.getByText(/não pode mais ser editada nem retirada/)).toBeInTheDocument();
    expect(aceita.queryByRole("button", { name: "Retirar" })).not.toBeInTheDocument();

    const recusada = within(screen.getByRole("heading", { name: "Trek recusada" }).closest("li")!);
    expect(recusada.getByText("Recusada")).toBeInTheDocument();
  });

  it("orienta quando ainda não há ofertas", async () => {
    simularApi({ "GET /ofertas/meus": () => ({ corpo: { next: null, results: [] } }) });
    renderizarAplicacao({ rota: "/minhas-ofertas", usuario: vendedor });

    expect(await screen.findByRole("heading", { name: "Você ainda não enviou ofertas" })).toBeInTheDocument();
  });
});
