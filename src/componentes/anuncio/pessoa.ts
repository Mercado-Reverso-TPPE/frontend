import { T } from "@/estilos/tokens";

const partes = (nome: string) => nome.trim().split(/\s+/).filter(Boolean);

/** `Carlos Mendes` → `Carlos M.`: primeiro nome e a inicial do último. */
export function nomeCurto(nome: string) {
  const [primeiro = "", ...resto] = partes(nome);
  const ultimo = resto.at(-1);
  return ultimo ? `${primeiro} ${ultimo.charAt(0).toUpperCase()}.` : primeiro;
}

/** `Carlos Mendes` → `CM`. */
export function iniciaisDe(nome: string) {
  const lista = partes(nome);
  const primeira = lista[0]?.charAt(0) ?? "";
  const ultima = lista.length > 1 ? (lista.at(-1)?.charAt(0) ?? "") : "";
  return (primeira + ultima).toUpperCase() || "?";
}

const CORES = Object.values(T.CAT);

/** Cor estável do avatar a partir do id, sempre um token da paleta. */
export function corDaPessoa(id: string) {
  let soma = 0;
  for (const caractere of id) soma = (soma * 31 + caractere.charCodeAt(0)) >>> 0;
  return CORES[soma % CORES.length] ?? T.primary;
}
