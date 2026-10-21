import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import estilos from "./Campo.module.css";

type PropsNativas = Omit<ComponentPropsWithoutRef<"input">, "children">;

interface CampoProps extends PropsNativas {
  rotulo: string;
  /** Texto auxiliar permanente, abaixo do controle. */
  dica?: string;
  /** Mensagem de validação. Presente, marca o controle como inválido. */
  erro?: string;
  obrigatorio?: boolean;
  como?: "input" | "textarea" | "select";
  /** Linhas do `textarea`. */
  linhas?: number;
  /** `<option>`s quando `como="select"`. */
  children?: ReactNode;
}

/**
 * Campo de formulário com rótulo, dica e erro ligados por `aria-describedby`.
 *
 * O erro nunca é apenas a borda vermelha: vem com texto e um ícone, e é
 * anunciado por leitores de tela.
 */
export function Campo({
  rotulo,
  dica,
  erro,
  obrigatorio,
  como = "input",
  linhas,
  children,
  id,
  className,
  ...resto
}: CampoProps) {
  const gerado = useId();
  const idControle = id ?? gerado;
  const idDica = dica ? `${idControle}-dica` : undefined;
  const idErro = erro ? `${idControle}-erro` : undefined;

  const propsComuns = {
    id: idControle,
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": [idDica, idErro].filter(Boolean).join(" ") || undefined,
    "aria-required": obrigatorio || undefined,
    className: [estilos.controle, erro ? estilos.comErro : "", className ?? ""].filter(Boolean).join(" "),
  };

  return (
    <div className={estilos.campo}>
      <label className={estilos.rotulo} htmlFor={idControle}>
        {rotulo}
        {obrigatorio && (
          <span className={estilos.obrigatorio} aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* O tipo das props nativas é o de `input`; para as outras tags o
          contrato de runtime é o mesmo (value/onChange), daí a conversão. */}
      {como === "textarea" && (
        <textarea
          {...(resto as ComponentPropsWithoutRef<"textarea">)}
          {...propsComuns}
          rows={linhas ?? 4}
          className={`${propsComuns.className} ${estilos.multilinha}`}
        />
      )}

      {como === "select" && (
        <select {...(resto as ComponentPropsWithoutRef<"select">)} {...propsComuns} className={`${propsComuns.className} ${estilos.selecao}`}>
          {children}
        </select>
      )}

      {como === "input" && <input {...resto} {...propsComuns} />}

      {dica && !erro && (
        <span className={estilos.dica} id={idDica}>
          {dica}
        </span>
      )}

      {erro && (
        <span className={estilos.erro} id={idErro} role="alert">
          <span aria-hidden="true">⚠</span>
          {erro}
        </span>
      )}
    </div>
  );
}
