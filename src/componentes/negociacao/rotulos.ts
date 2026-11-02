import type { TomDeBadge } from "@/componentes/base";
import type { StatusDaNegociacao } from "@/api/negociacoes";
import type { Papel, TipoDeEvento } from "@/api/ofertas";

/** O que cada evento do histórico significa, sem depender de cor. */
export const ROTULO_DO_EVENTO: Record<TipoDeEvento, string> = {
  enviada: "Oferta enviada",
  editada: "Oferta editada",
  retirada: "Oferta retirada",
  contraproposta: "Contraproposta",
  contraposta_aceita: "Contraproposta aceita",
  contraposta_recusada: "Contraproposta recusada",
  contraposta_expirada: "Contraproposta expirada",
  contraposta_substituida: "Contraproposta substituída por um novo valor",
  aceita: "Oferta aceita",
  recusada: "Oferta recusada",
  negociacao_cancelada: "Negociação cancelada",
};

export const ROTULO_DO_PAPEL: Record<Papel, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
};

export const ROTULO_DA_NEGOCIACAO: Record<StatusDaNegociacao, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const TOM_DA_NEGOCIACAO: Record<StatusDaNegociacao, TomDeBadge> = {
  em_andamento: "marca",
  concluida: "sucesso",
  cancelada: "neutro",
};

export const papelOposto = (papel: Papel): Papel => (papel === "comprador" ? "vendedor" : "comprador");
