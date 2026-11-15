import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

// A pessoa logada é "7f1c": compradora quando o anúncio é dela, vendedora nos demais.
const eu = usuarioDoPerfil(perfilDeTeste);
const OUTRA = "outra-pessoa";

const anuncio = (dados: Record<string, unknown> = {}) => ({
  id: "a1",
  comprador: "7f1c",
  titulo: "Bicicleta aro 29",
  categoria: "esportes",
  categoria_nome: "Esportes",
  descricao: "Com freio a disco.",
  preco_min: "1200.00",
  preco_max: "2500.00",
  raio_km: 25,
  status: "ativo",
  distancia_km: null,
  ofertas_recebidas: 2,
  cidade: "Brasília",
  uf: "DF",
  criado_em: "2026-10-20T15:00:00Z",
  ...dados,
});

const evento = (dados: Record<string, unknown>) => ({
  id: 1,
  autor_id: OUTRA,
  preco: "2100.00",
  status: "enviada",
  tipo_evento: "enviada",
  justificativa: "",
  texto: "",
  rodada: 0,
  expira_em: null,
  respondida_em: null,
  resultado: null,
  registrado_em: "2026-10-21T12:00:00Z",
  ...dados,
});

const oferta = (dados: Record<string, unknown> = {}) => ({
  id: "o1",
  anuncio_id: "a1",
  vendedor_id: OUTRA,
  vendedor_nome: "Carlos Souza",
  produto_id: null,
  produto_nome: "",
  produto_foto: null,
  descricao: "Caloi Elite 2023, pouco uso.",
  estado_conservacao: "seminovo",
  preco: "2100.00",
  status: "enviada",
  criada_em: "2026-10-21T12:00:00Z",
  atualizada_em: "2026-10-21T12:00:00Z",
  historico: [evento({})],
  ...dados,
});

describe("palpites e faixa estimada", () => {
  it("mostra ao comprador só a faixa agregada e avisa quando ela foge do anúncio", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/estimativa-preco": () => ({
        corpo: { disponivel: true, minimo: "2600.00", media: "2800.00", maximo: "3100.00", diverge_da_faixa_solicitada: true },
      }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1", usuario: eu });

    const faixa = within(await screen.findByRole("region", { name: "Faixa estimada pelo mercado" }));
    expect(await faixa.findByText("R$ 2.800")).toBeInTheDocument();
    expect(faixa.getByText("R$ 2.600")).toBeInTheDocument();
    expect(faixa.getByText("R$ 3.100")).toBeInTheDocument();
    expect(faixa.getByText("Sua faixa está fora do mercado")).toBeInTheDocument();
    expect(faixa.getByText(/não são ofertas/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Palpite de preço" })).not.toBeInTheDocument();
  });

  it("não mostra valores enquanto a API não libera a faixa", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/estimativa-preco": () => ({ corpo: { disponivel: false } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1", usuario: eu });

    expect(await screen.findByText(/quando houver palpites suficientes/)).toBeInTheDocument();
    expect(screen.queryByText("Mínimo")).not.toBeInTheDocument();
  });

  it("deixa o vendedor palpitar sem criar oferta e levar o valor para a oferta", async () => {
    const chamadas = simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio({ comprador: OUTRA }) }),
      "POST /anuncios/a1/palpite": () => ({ status: 201, corpo: { valor: "1800.00" } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1", usuario: eu });

    const palpite = within(await screen.findByRole("region", { name: "Palpite de preço" }));
    expect(palpite.getByText(/Ele não é uma oferta/)).toBeInTheDocument();
    await userEvent.type(palpite.getByLabelText("Seu palpite (R$)"), "1.800");
    await userEvent.click(palpite.getByRole("button", { name: "Enviar palpite" }));

    expect(await palpite.findByText(/Palpite de R\$ 1.800 registrado/)).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({ valor: "1800.00" });
    expect(chamadas.some((chamada) => chamada.caminho.endsWith("/ofertas"))).toBe(false);
    expect(palpite.getByRole("link", { name: "Fazer uma oferta com este valor" })).toHaveAttribute(
      "href",
      "/anuncios/a1/ofertar?preco=1800",
    );
  });
});

describe("ofertas recebidas", () => {
  const recebidas = [
    oferta({ id: "o1", vendedor_nome: "Carlos", descricao: "Caloi", preco: "2100.00", criada_em: "2026-10-21T12:00:00Z" }),
    oferta({
      id: "o2",
      vendedor_nome: "Ana",
      descricao: "Trek",
      preco: "1900.00",
      estado_conservacao: "novo",
      criada_em: "2026-10-22T12:00:00Z",
      historico: [evento({ id: 2 }), evento({ id: 3, tipo_evento: "editada", preco: "1900.00" })],
    }),
    oferta({ id: "o3", vendedor_nome: "Bia", descricao: "Monark", preco: "2400.00", criada_em: "2026-10-23T12:00:00Z" }),
  ];

  it("ordena, sinaliza valor alterado e compara os mesmos atributos lado a lado", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio() }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: recebidas } }),
      "GET /anuncios/a1/estimativa-preco": () => ({ corpo: { disponivel: false } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertas", usuario: eu });

    await screen.findByRole("heading", { name: "Trek" });
    const titulos = () => screen.getAllByRole("heading", { level: 2 }).map((titulo) => titulo.textContent);
    expect(titulos().filter((titulo) => ["Caloi", "Trek", "Monark"].includes(titulo ?? ""))).toEqual(["Trek", "Caloi", "Monark"]);

    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "maior_preco");
    expect(titulos().filter((titulo) => ["Caloi", "Trek", "Monark"].includes(titulo ?? ""))).toEqual(["Monark", "Caloi", "Trek"]);

    expect(within(screen.getByRole("heading", { name: "Trek" }).closest("li")!).getByText("Valor alterado")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Comparar Trek" }));
    expect(screen.getByText("Selecione mais uma oferta para comparar lado a lado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Comparar Caloi" }));

    const tabela = within(screen.getByRole("region", { name: "Comparação de ofertas" }));
    expect(tabela.getByRole("columnheader", { name: "Trek" })).toBeInTheDocument();
    expect(tabela.getByRole("columnheader", { name: "Caloi" })).toBeInTheDocument();
    const linhaDePreco = tabela.getByRole("rowheader", { name: "Preço" }).closest("tr")!;
    expect(within(linhaDePreco).getByText("R$ 1.900")).toBeInTheDocument();
    expect(within(linhaDePreco).getByText("R$ 2.100")).toBeInTheDocument();
    expect(tabela.getByRole("rowheader", { name: "Conservação" })).toBeInTheDocument();
  });

  it("não pede nem mostra ofertas a quem não é dono do anúncio", async () => {
    const chamadas = simularApi({ "GET /anuncios/a1": () => ({ status: 404, corpo: { detail: "Não encontrado." } }) });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertas", usuario: eu });

    expect(await screen.findByText("Só quem publicou vê as ofertas")).toBeInTheDocument();
    expect(chamadas.some((chamada) => chamada.caminho === "/anuncios/a1/ofertas")).toBe(false);
  });
});
