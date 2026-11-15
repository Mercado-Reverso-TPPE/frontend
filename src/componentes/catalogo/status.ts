import type { StatusDoProduto } from "@/api/catalogo";
import type { TomDeBadge } from "@/componentes/base";

export const ROTULO_DO_PRODUTO: Record<StatusDoProduto, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const TOM_DO_PRODUTO: Record<StatusDoProduto, TomDeBadge> = {
  disponivel: "sucesso",
  reservado: "aviso",
  vendido: "neutro",
};
