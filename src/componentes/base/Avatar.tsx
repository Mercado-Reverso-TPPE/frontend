import estilos from "./Avatar.module.css";

interface AvatarProps {
  /** Iniciais exibidas, ex.: `MS`. */
  iniciais: string;
  /** Cor de fundo — vem do perfil da pessoa. */
  cor: string;
  tamanho?: number;
  /** Nome completo, usado como rótulo acessível. */
  nome?: string;
}

/** Avatar de iniciais usado em cards, cabeçalho e listas de oferta. */
export function Avatar({ iniciais, cor, tamanho = 32, nome }: AvatarProps) {
  return (
    <span
      className={estilos.avatar}
      style={{ width: tamanho, height: tamanho, backgroundColor: cor, fontSize: Math.round(tamanho * 0.34) }}
      role="img"
      aria-label={nome ? `Foto de ${nome}` : `Iniciais ${iniciais}`}
    >
      {iniciais}
    </span>
  );
}
