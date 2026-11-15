import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuarioDoPerfil } from "@/api/autenticacao";
import { validarFotos } from "@/api/catalogo";
import { perfilDeTeste, simularApi } from "../apiFalsa";
import { renderizarAplicacao } from "../utilitarios";

const vendedor = usuarioDoPerfil(perfilDeTeste);
const CATEGORIAS = [{ slug: "esportes", nome: "Esportes" }];

const produto = (dados: Record<string, unknown> = {}) => ({
  id: "p1",
  nome: "Caloi Elite",
  descricao: "Aro 29, pouco uso.",
  categoria: "esportes",
  categoria_nome: "Esportes",
  estado_conservacao: "seminovo",
  preco: "2100.00",
  status: "disponivel",
  fotos: [],
  criado_em: "2026-10-20T12:00:00Z",
  atualizado_em: "2026-10-20T12:00:00Z",
  ...dados,
});

const arquivo = (nome: string, tipo: string, bytes = 10) => new File([new Uint8Array(bytes)], nome, { type: tipo });

describe("validação de fotos", () => {
  it("aplica os limites de quantidade, formato e tamanho do backend", () => {
    expect(validarFotos([arquivo("a.jpg", "image/jpeg")], 0)).toEqual([]);
    expect(validarFotos([arquivo("a.jpg", "image/jpeg")], 6)[0]).toMatch(/no máximo 6 fotos/);
    expect(validarFotos([arquivo("a.gif", "image/gif")], 0)[0]).toMatch(/JPEG, PNG ou WEBP/);
    const grande = arquivo("grande.png", "image/png");
    Object.defineProperty(grande, "size", { value: 6 * 1024 * 1024 });
    expect(validarFotos([grande], 0)[0]).toMatch(/excede o limite de 5 MB/);
  });
});

describe("minha loja", () => {
  it("mostra o status de cada produto e só oferece as ações que ele permite", async () => {
    simularApi({
      "GET /produtos": () => ({
        corpo: {
          next: null,
          results: [
            produto({ id: "p1", nome: "Caloi disponível" }),
            produto({ id: "p2", nome: "Monark reservada", status: "reservado" }),
            produto({ id: "p3", nome: "Trek vendida", status: "vendido" }),
          ],
        },
      }),
    });
    renderizarAplicacao({ rota: "/minha-loja", usuario: vendedor });

    const disponivel = within((await screen.findByRole("heading", { name: "Caloi disponível" })).closest("li")!);
    expect(disponivel.getByText("Disponível")).toBeInTheDocument();
    expect(disponivel.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(disponivel.getByRole("button", { name: "Excluir" })).toBeInTheDocument();

    const reservado = within(screen.getByRole("heading", { name: "Monark reservada" }).closest("li")!);
    expect(reservado.getByText("Reservado")).toBeInTheDocument();
    expect(reservado.getByText(/não aparece para novas ofertas/)).toBeInTheDocument();
    expect(reservado.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();

    const vendido = within(screen.getByRole("heading", { name: "Trek vendida" }).closest("li")!);
    expect(vendido.getByText("Vendido")).toBeInTheDocument();
    expect(vendido.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(vendido.queryByRole("button", { name: /Marcar como/ })).not.toBeInTheDocument();
  });

  it("filtra pelo status na API", async () => {
    const chamadas = simularApi({ "GET /produtos": () => ({ corpo: { next: null, results: [] } }) });
    renderizarAplicacao({ rota: "/minha-loja", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Reservados" }));
    expect(await screen.findByText("Nenhum produto com este status")).toBeInTheDocument();
    expect(chamadas.at(-1)?.parametros).toEqual({ status: "reservado" });
  });

  it("valida, cadastra e envia as fotos como multipart", async () => {
    const chamadas = simularApi({
      "GET /produtos": () => ({ corpo: { next: null, results: [] } }),
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
      "POST /produtos": (corpo) => ({ status: 201, corpo: produto(corpo as Record<string, unknown>) }),
      "POST /produtos/p1/fotos": () => ({ status: 201, corpo: [{ id: 1, url: "http://x/1.jpg", ordem: 1 }] }),
    });
    renderizarAplicacao({ rota: "/minha-loja", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Novo produto" }));
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar produto" }));
    expect(screen.getByText("Informe o nome do produto.")).toBeInTheDocument();
    expect(screen.getByText("Escolha a categoria.")).toBeInTheDocument();
    expect(screen.getByText("Escolha o estado de conservação.")).toBeInTheDocument();
    expect(screen.getByText(/Até 6 fotos por produto/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Nome do produto/), "Caloi Elite");
    await userEvent.selectOptions(await screen.findByLabelText(/Categoria/), "esportes");
    await userEvent.selectOptions(screen.getByLabelText(/Estado de conservação/), "seminovo");
    await userEvent.type(screen.getByLabelText(/Descrição/), "Aro 29, pouco uso.");
    await userEvent.type(screen.getByLabelText(/Preço/), "2100");
    await userEvent.upload(screen.getByLabelText(/Fotos/), arquivo("bike.jpg", "image/jpeg"));
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar produto" }));

    expect(await screen.findByText("Caloi Elite entrou no seu catálogo.")).toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.metodo === "POST" && chamada.caminho === "/produtos")?.corpo).toEqual({
      nome: "Caloi Elite",
      descricao: "Aro 29, pouco uso.",
      categoria: "esportes",
      estado_conservacao: "seminovo",
      preco: "2100.00",
    });
    const envio = chamadas.find((chamada) => chamada.caminho === "/produtos/p1/fotos")?.corpo;
    expect(envio).toBeInstanceOf(FormData);
    expect((envio as FormData).getAll("fotos")).toHaveLength(1);
  });

  it("recusa no cliente uma foto em formato não aceito", async () => {
    simularApi({
      "GET /produtos": () => ({ corpo: { next: null, results: [] } }),
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
    });
    renderizarAplicacao({ rota: "/minha-loja", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Novo produto" }));
    await userEvent.upload(screen.getByLabelText(/Fotos/), arquivo("anim.gif", "image/gif"), { applyAccept: false });
    expect(screen.getByRole("alert")).toHaveTextContent("O arquivo anim.gif deve estar em um dos formatos: JPEG, PNG ou WEBP.");
  });

  it("mostra o erro de envio de fotos devolvido pela API", async () => {
    simularApi({
      "GET /produtos": () => ({ corpo: { next: null, results: [produto()] } }),
      "GET /categorias": () => ({ corpo: CATEGORIAS }),
      "POST /produtos/p1/fotos": () => ({
        status: 400,
        corpo: { fotos: ["O arquivo bike.jpg não é uma imagem válida."] },
      }),
    });
    renderizarAplicacao({ rota: "/minha-loja", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByText(/0 de 6 fotos/)).toBeInTheDocument();
    await userEvent.upload(screen.getByLabelText("Adicionar fotos"), arquivo("bike.jpg", "image/jpeg"));
    expect(await screen.findByText("O arquivo bike.jpg não é uma imagem válida.")).toBeInTheDocument();
  });

  it("mostra o motivo quando a API não deixa mudar o status", async () => {
    simularApi({
      "GET /produtos": () => ({ corpo: { next: null, results: [produto({ status: "reservado" })] } }),
      "PATCH /produtos/p1/status": () => ({
        status: 400,
        corpo: ["O status de um produto em negociação acompanha a negociação."],
      }),
    });
    renderizarAplicacao({ rota: "/minha-loja", usuario: vendedor });

    await userEvent.click(await screen.findByRole("button", { name: "Marcar como disponível" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("acompanha a negociação");
  });
});

describe("oferta a partir do catálogo", () => {
  const anuncio = {
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
    ofertas_recebidas: 0,
    cidade: "Brasília",
    uf: "DF",
    criado_em: "2026-10-20T15:00:00Z",
  };

  it("lista só produtos disponíveis e preenche a oferta com o escolhido", async () => {
    const chamadas = simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [] } }),
      // Mesmo que a API devolvesse um reservado, ele não pode virar opção.
      "GET /produtos": () => ({
        corpo: { next: null, results: [produto(), produto({ id: "p2", nome: "Monark reservada", status: "reservado" })] },
      }),
      "POST /anuncios/a1/ofertas": () => ({ status: 201, corpo: { ...anuncio, historico: [] } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar", usuario: vendedor });

    const seletor = await screen.findByLabelText("Produto da sua loja");
    expect(within(seletor).queryByText(/Monark reservada/)).not.toBeInTheDocument();
    expect(chamadas.find((chamada) => chamada.caminho === "/produtos")?.parametros).toEqual({ status: "disponivel" });

    await userEvent.selectOptions(seletor, "p1");
    expect(screen.getByLabelText(/Descrição do produto/)).toHaveValue("Aro 29, pouco uso.");
    expect(screen.getByLabelText(/Estado de conservação/)).toHaveValue("seminovo");
    expect(screen.getByLabelText(/Preço/)).toHaveValue("2100");

    await userEvent.click(screen.getByRole("button", { name: "Enviar oferta" }));
    expect(chamadas.find((chamada) => chamada.metodo === "POST")?.corpo).toEqual({
      descricao: "Aro 29, pouco uso.",
      estado_conservacao: "seminovo",
      preco: "2100.00",
      produto_id: "p1",
    });
  });

  it("começa com o valor do palpite quando vem dele", async () => {
    simularApi({
      "GET /anuncios/a1": () => ({ corpo: anuncio }),
      "GET /anuncios/a1/ofertas": () => ({ corpo: { next: null, results: [] } }),
      "GET /produtos": () => ({ corpo: { next: null, results: [] } }),
    });
    renderizarAplicacao({ rota: "/anuncios/a1/ofertar?preco=1800", usuario: vendedor });

    expect(await screen.findByLabelText(/Preço/)).toHaveValue("1800");
  });
});
