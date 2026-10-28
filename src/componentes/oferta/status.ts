import type { StatusDaOferta } from "@/api/ofertas";
import type { TomDeBadge } from "@/componentes/base";

export const ROTULO_DA_OFERTA: Record<StatusDaOferta, string> = {
  enviada: "Aguardando resposta",
  em_negociacao: "Em negociação",
  aceita: "Aceita",
  recusada: "Recusada",
  retirada: "Retirada",
};

export const TOM_DA_OFERTA: Record<StatusDaOferta, TomDeBadge> = {
  enviada: "info",
  em_negociacao: "marca",
  aceita: "sucesso",
  recusada: "erro",
  retirada: "neutro",
};

/** Por que a oferta não pode mais ser editada nem retirada; `undefined` se ainda pode. */
export function motivoDoBloqueio(status: StatusDaOferta): string | undefined {
  if (status === "aceita") return "O comprador aceitou esta oferta. Ela não pode mais ser editada nem retirada.";
  if (status === "em_negociacao") return "Esta oferta está em negociação. Ela não pode mais ser editada nem retirada.";
  if (status === "recusada") return "O comprador recusou esta oferta.";
  if (status === "retirada") return "Você retirou esta oferta.";
  return undefined;
}
