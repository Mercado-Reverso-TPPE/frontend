import type { StatusDoAnuncio } from "@/api/meusAnuncios";
import type { TomDeBadge } from "@/componentes/base";

export const ROTULO_DO_STATUS: Record<StatusDoAnuncio, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  em_negociacao: "Em negociação",
  encerrado: "Encerrado",
};

export const TOM_DO_STATUS: Record<StatusDoAnuncio, TomDeBadge> = {
  ativo: "sucesso",
  pausado: "aviso",
  em_negociacao: "info",
  encerrado: "neutro",
};
