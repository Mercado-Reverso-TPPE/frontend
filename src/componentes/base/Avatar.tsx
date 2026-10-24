import { useState } from "react";
import estilos from "./Avatar.module.css";

interface AvatarProps {
  /** Iniciais exibidas, ex.: `MS`. */
  iniciais: string;
  /** Cor de fundo — vem do perfil da pessoa. */
  cor: string;
  tamanho?: number;
  /** Nome completo, usado como rótulo acessível. */
  nome?: string;
  /** URL da foto. Se não carregar, volta para as iniciais. */
  foto?: string;
}

/** Avatar usado em cards, cabeçalho e listas de oferta: foto ou iniciais. */
export function Avatar({ iniciais, cor, tamanho = 32, nome, foto }: AvatarProps) {
  const [fotoComErro, setFotoComErro] = useState<string>();
  const rotulo = nome ? `Foto de ${nome}` : `Iniciais ${iniciais}`;
  const dimensoes = { width: tamanho, height: tamanho };

  if (foto && foto !== fotoComErro) {
    return (
      <img
        className={`${estilos.avatar} ${estilos.foto}`}
        style={dimensoes}
        src={foto}
        alt={rotulo}
        onError={() => setFotoComErro(foto)}
      />
    );
  }

  return (
    <span
      className={estilos.avatar}
      style={{ ...dimensoes, backgroundColor: cor, fontSize: Math.round(tamanho * 0.34) }}
      role="img"
      aria-label={rotulo}
    >
      {iniciais}
    </span>
  );
}
