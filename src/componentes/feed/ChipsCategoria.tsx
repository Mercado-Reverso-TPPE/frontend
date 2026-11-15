import type { Categoria } from "@/api/meusAnuncios";
import { totalDaContagem, type ContagemPorCategoria } from "@/api/estatisticas";
import { Chip } from "@/componentes/base";
import estilos from "./Feed.module.css";

interface ChipsCategoriaProps {
  categorias: Categoria[];
  /** Slug ativo; vazio para todas. */
  ativa: string;
  aoSelecionar: (slug: string) => void;
  /** Anúncios por categoria na aba e na busca atuais; sem ela, os chips ficam sem número. */
  contagem?: ContagemPorCategoria | null;
}

/** Trilha de categorias do feed (QRO-07), com as categorias ativas da API e a contagem de cada uma. */
export function ChipsCategoria({ categorias, ativa, aoSelecionar, contagem }: ChipsCategoriaProps) {
  return (
    <div className={`${estilos.chips} sem-barra-de-rolagem`} role="group" aria-label="Categorias">
      <Chip ativo={ativa === ""} contagem={contagem ? totalDaContagem(contagem) : undefined} onClick={() => aoSelecionar("")}>
        Todos
      </Chip>
      {categorias.map((categoria) => (
        <Chip
          key={categoria.slug}
          ativo={ativa === categoria.slug}
          contagem={contagem ? (contagem[categoria.slug] ?? 0) : undefined}
          onClick={() => aoSelecionar(categoria.slug)}
        >
          {categoria.nome}
        </Chip>
      ))}
    </div>
  );
}
