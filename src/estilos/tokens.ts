/**
 * Ponte entre os tokens CSS e o TypeScript.
 *
 * Cada campo aponta para uma variável de `estilos/tokens.css` — os valores
 * da marca existem em um lugar só. Telas e componentes consomem `T` em
 * `style={{ ... }}` ou as próprias variáveis em CSS Modules; trocar uma cor
 * significa editar o CSS, nunca este arquivo.
 */

export const T = {
  // Marca
  primary: "var(--laranja)",
  primaryHover: "var(--laranja-hover)",
  pLight: "var(--laranja-claro)",
  pBorder: "var(--laranja-borda)",

  // Superfícies
  bg: "var(--fundo)",
  bgElevated: "var(--fundo-elevado)",
  bgMuted: "var(--superficie)",
  bgSoft: "var(--superficie-suave)",
  border: "var(--borda)",
  borderSoft: "var(--borda-suave)",

  // Texto
  text: "var(--texto-primario)",
  textMid: "var(--texto-secundario)",
  textLight: "var(--texto-terciario)",
  textInverted: "var(--texto-invertido)",

  // Funcionais
  success: "var(--sucesso)",
  successBg: "var(--sucesso-superficie)",
  successBorder: "var(--sucesso-borda)",
  successText: "var(--sucesso-texto)",
  successTextSoft: "var(--sucesso-texto-suave)",
  error: "var(--erro)",
  errorBg: "var(--erro-superficie)",
  info: "var(--info)",
  infoBg: "var(--info-superficie)",
  warning: "var(--aviso)",
  star: "var(--estrela)",

  // Cor por categoria do anúncio
  CAT: {
    "Eletrônicos": "var(--cat-eletronicos)",
    "Veículos": "var(--cat-veiculos)",
    "Informática": "var(--cat-informatica)",
    "Games": "var(--cat-games)",
    "Esportes": "var(--cat-esportes)",
    "Casa & Jardim": "var(--cat-casa-jardim)",
    "Instrumentos": "var(--cat-instrumentos)",
    "Outros": "var(--cat-outros)",
  } as Record<string, string>,

  font: {
    display: "var(--fonte-titulo)",
    body: "var(--fonte-corpo)",
    mono: "var(--fonte-mono)",
  },

  size: {
    h1: "var(--tamanho-h1)",
    h2: "var(--tamanho-h2)",
    h3: "var(--tamanho-h3)",
    price: "var(--tamanho-preco)",
    body: "var(--tamanho-corpo)",
    meta: "var(--tamanho-meta)",
    micro: "var(--tamanho-micro)",
  },

  radius: {
    card: "var(--raio-card)",
    button: "var(--raio-botao)",
    chip: "var(--raio-chip)",
    field: "var(--raio-campo)",
    modal: "var(--raio-modal)",
  },

  space: {
    half: "var(--espaco-0-5)",
    base: "var(--espaco-1)",
    sm: "var(--espaco-1-5)",
    md: "var(--espaco-2)",
    lg: "var(--espaco-3)",
    xl: "var(--espaco-4)",
    cards: "var(--espaco-cards)",
  },

  layout: {
    maxWidth: "var(--largura-conteudo)",
    gutter: "var(--respiro-lateral)",
    headerHeight: "var(--altura-cabecalho)",
    minWidth: "var(--largura-minima)",
    cardMinWidth: "var(--largura-card-minima)",
  },

  shadow: {
    sm: "var(--sombra-sm)",
    md: "var(--sombra-md)",
    primary: "var(--sombra-marca)",
    cardHover: "var(--sombra-card-hover)",
  },

  gradient: {
    brand: "var(--gradiente-marca)",
    band: "var(--gradiente-faixa)",
    hero: "var(--gradiente-hero)",
  },

  heroBorder: "var(--borda-hero)",
  transition: "var(--transicao)",
  slowTransition: "var(--transicao-lenta)",

  z: {
    header: "var(--z-cabecalho)",
    filters: "var(--z-filtros)",
    floating: "var(--z-flutuante)",
  },
} as const;

/** Cor da categoria do anúncio; categoria desconhecida cai em "Outros". */
export const catColor = (categoria: string) => T.CAT[categoria] ?? T.CAT["Outros"];

/**
 * Versão translúcida de um token de cor — para fundos de badge e chip.
 * `comAlfa(T.info, 0.08)` resolve via `color-mix`, então continua funcionando
 * com cores declaradas como variáveis CSS.
 */
export const comAlfa = (cor: string, fracao: number) =>
  `color-mix(in srgb, ${cor} ${Math.round(fracao * 100)}%, transparent)`;
