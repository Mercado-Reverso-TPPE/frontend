/** `3291` → `3.3k`; abaixo de mil, o número inteiro. */
export const fmtCompactoDeContagem = (valor: number) =>
  valor >= 1000 ? `${(valor / 1000).toFixed(1).replace(".", ",")}k` : String(valor);
