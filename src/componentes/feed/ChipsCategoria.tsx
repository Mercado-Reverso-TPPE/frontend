import { Chip } from "@/componentes/base";
import { CATEGORIES } from "@/dados/demo";
import estilos from "./Feed.module.css";

interface ChipsCategoriaProps {
  ativa: string;
  aoSelecionar: (categoria: string) => void;
}

/** Trilha de categorias do feed (QRO-07). */
export function ChipsCategoria({ ativa, aoSelecionar }: ChipsCategoriaProps) {
  return (
    <div
      className={`${estilos.chips} sem-barra-de-rolagem`}
      role="group"
      aria-label="Categorias"
    >
      {CATEGORIES.map((categoria) => (
        <Chip
          key={categoria.id}
          ativo={ativa === categoria.id}
          contagem={categoria.count}
          onClick={() => aoSelecionar(categoria.id)}
        >
          {categoria.label}
        </Chip>
      ))}
    </div>
  );
}
