import { fmtData } from "./formato";

/**
 * Há quanto tempo algo aconteceu, como no protótipo: `há 20 min`,
 * `há 1 hora`, `há 3 dias`. Depois de 30 dias, volta para a data.
 */
export function fmtHaQuanto(iso: string, agora: number = Date.now()) {
  const minutos = Math.floor((agora - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutos)) return "";
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "há 1 hora" : `há ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
  return fmtData(iso);
}
