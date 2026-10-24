/**
 * Lê um valor em reais digitado à mão: `1.200,50`, `R$ 800`, `1200.5`.
 * Devolve `null` para vazio e `NaN` para o que não é número.
 */
export function lerValorEmReais(texto: string): number | null {
  const limpo = texto.replace(/R\$|\s/g, "");
  if (!limpo) return null;
  // Com vírgula, o ponto é separador de milhar (padrão brasileiro).
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return Number.NaN;
  return Number(normalizado);
}

/** Valor para preencher um campo de reais: `1200.5` → `1200,50`. */
export function valorParaCampo(valor: number | null) {
  if (valor === null) return "";
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(".", ",");
}
