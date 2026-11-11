import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guardas da migração para componentes-base e tokens (#37):
 * telas e componentes não carregam valores de marca embutidos nem leem os
 * dados de demonstração direto — só a camada `api/` decide quando usá-los.
 */

const RAIZ = path.resolve(__dirname, "..");
const PASTAS = ["paginas", "componentes"];

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = path.join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

const fontes = PASTAS.flatMap((pasta) => arquivos(path.join(RAIZ, pasta))).map((caminho) => ({
  arquivo: path.relative(RAIZ, caminho),
  texto: readFileSync(caminho, "utf8"),
}));

/** Conteúdo de cada `style={{ … }}` do arquivo. */
function estilosEmbutidos(texto: string): string[] {
  const blocos: string[] = [];
  let inicio = texto.indexOf("style={{");
  while (inicio !== -1) {
    let profundidade = 0;
    let fim = inicio + "style={".length;
    for (; fim < texto.length; fim++) {
      if (texto[fim] === "{") profundidade++;
      if (texto[fim] === "}" && --profundidade === 0) break;
    }
    blocos.push(texto.slice(inicio, fim + 1));
    inicio = texto.indexOf("style={{", fim);
  }
  return blocos;
}

/** Cor, fonte ou espaçamento com valor literal (número, hex ou texto que não é `var(…)`). */
const VALOR_LITERAL =
  /#[0-9a-f]{3,8}\b|rgba?\(|\b(?:color|background\w*|font\w*|margin\w*|padding\w*|gap|letterSpacing|lineHeight|border\w*)\s*:\s*(?:-?\d|["'`](?!var\())/i;

describe("migração para tokens e componentes-base", () => {
  it("nenhuma tela ou componente usa estilo embutido com valor literal", () => {
    const violacoes = fontes.flatMap(({ arquivo, texto }) =>
      estilosEmbutidos(texto)
        .filter((bloco) => VALOR_LITERAL.test(bloco))
        .map((bloco) => `${arquivo}: ${bloco.replace(/\s+/g, " ")}`),
    );
    expect(violacoes).toEqual([]);
  });

  it("nenhuma tela ou componente importa os dados de demonstração", () => {
    const importam = fontes.filter(({ texto }) => /from\s+["'][^"']*dados\/demo["']/.test(texto)).map(({ arquivo }) => arquivo);
    expect(importam).toEqual([]);
  });

  it("a guarda reconhece valores literais e aceita tokens", () => {
    expect(VALOR_LITERAL.test('style={{ fontSize: 18 }}')).toBe(true);
    expect(VALOR_LITERAL.test('style={{ color: "#fff" }}')).toBe(true);
    expect(VALOR_LITERAL.test('style={{ paddingBlock: "var(--espaco-4)" }}')).toBe(false);
    expect(VALOR_LITERAL.test('style={{ "--logo-tamanho": `${tamanho}px` }}')).toBe(false);
  });
});
