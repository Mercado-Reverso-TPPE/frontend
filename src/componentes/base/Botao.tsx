import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import estilos from "./Botao.module.css";

export type VarianteDeBotao = "primario" | "secundario" | "texto" | "perigo" | "flutuante";
export type TamanhoDeBotao = "pequeno" | "medio" | "grande";

interface PropsComuns {
  variante?: VarianteDeBotao;
  tamanho?: TamanhoDeBotao;
  /** Mostra o giro e bloqueia o clique, mantendo o rótulo acessível. */
  carregando?: boolean;
  larguraTotal?: boolean;
  icone?: ReactNode;
  children: ReactNode;
  className?: string;
}

type PropsDeBotao = PropsComuns &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { para?: undefined };

type PropsDeLink = PropsComuns & {
  /** Rota de destino: renderiza um link de navegação com a mesma aparência. */
  para: string;
  title?: string;
  "aria-label"?: string;
  onClick?: () => void;
};

export type BotaoProps = PropsDeBotao | PropsDeLink;

function classes({ variante = "primario", tamanho = "medio", larguraTotal, className }: PropsComuns) {
  return [
    estilos.botao,
    estilos[variante],
    estilos[tamanho],
    larguraTotal ? estilos.larguraTotal : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Botão da marca nas variantes da identidade visual.
 * Com `para`, navega; sem `para`, é um `<button>`.
 */
export function Botao(props: BotaoProps) {
  const { carregando, icone, children } = props;
  const conteudo = (
    <>
      {carregando ? <span className={estilos.girando} aria-hidden="true" /> : icone}
      <span>{children}</span>
    </>
  );

  if (props.para !== undefined) {
    const { para, variante, tamanho, larguraTotal, className, carregando: _c, icone: _i, children: _f, ...resto } = props;
    return (
      <Link to={para} className={classes({ variante, tamanho, larguraTotal, className, children })} {...resto}>
        {conteudo}
      </Link>
    );
  }

  const { variante, tamanho, larguraTotal, className, carregando: _c, icone: _i, children: _f, disabled, ...resto } = props;
  return (
    <button
      type={resto.type ?? "button"}
      className={classes({ variante, tamanho, larguraTotal, className, children })}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {conteudo}
    </button>
  );
}
