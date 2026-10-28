import type { Categoria } from "@/api/meusAnuncios";
import { Chip } from "@/componentes/base";
import estilos from "./Feed.module.css";

interface ChipsCategoriaProps {
  categorias: Categoria[];
  /** Slug ativo; vazio para todas. */
  ativa: string;
  aoSelecionar: (slug: string) => void;
}

/** Trilha de categorias do feed (QRO-07), com as categorias ativas da API. */
export function ChipsCategoria({ categorias, ativa, aoSelecionar }: ChipsCategoriaProps) {
  return (
    <div className={`${estilos.chips} sem-barra-de-rolagem`} role="group" aria-label="Categorias">
      <Chip ativo={ativa === ""} onClick={() => aoSelecionar("")}>
        Todas
      </Chip>
      {categorias.map((categoria) => (
        <Chip key={categoria.slug} ativo={ativa === categoria.slug} onClick={() => aoSelecionar(categoria.slug)}>
          {categoria.nome}
        </Chip>
      ))}
    </div>
  );
}
