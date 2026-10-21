import { useCallback, useState } from "react";

export interface LocalizacaoDeReferencia {
  cidade: string;
  uf: string;
  /** Raio de busca em KM — a interface nunca mostra outra unidade (RNF-18). */
  raioKm: number;
}

const CHAVE = "quero.localizacao";

function ler(): LocalizacaoDeReferencia | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as LocalizacaoDeReferencia) : null;
  } catch {
    return null;
  }
}

/**
 * Localização de referência da pessoa (QRO-03), lembrada entre visitas.
 *
 * Guardada no navegador por ser preferência de exibição. A localização
 * oficial do perfil é a que a API retorna.
 */
export function useLocalizacao() {
  const [localizacao, setLocalizacao] = useState<LocalizacaoDeReferencia | null>(ler);

  const definir = useCallback((proxima: LocalizacaoDeReferencia) => {
    setLocalizacao(proxima);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(proxima));
    } catch {
      /* navegador sem armazenamento: a preferência vale só nesta sessão */
    }
  }, []);

  const limpar = useCallback(() => {
    setLocalizacao(null);
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* idem */
    }
  }, []);

  return { localizacao, definir, limpar };
}
