import type { ReactNode } from "react";
import { Botao } from "@/componentes/base";
import estilos from "./Estados.module.css";

interface EstadoVazioProps {
  titulo: string;
  /** RNF-19: o estado vazio precisa explicar o próximo passo. */
  descricao: string;
  /** Emoji decorativo. */
  icone?: ReactNode;
  acao?: { rotulo: string; para?: string; aoClicar?: () => void };
  acaoSecundaria?: { rotulo: string; para?: string; aoClicar?: () => void };
}

/** Estado vazio padrão de toda listagem da SPA. */
export function EstadoVazio({
  titulo,
  descricao,
  icone = "🔍",
  acao,
  acaoSecundaria,
}: EstadoVazioProps) {
  return (
    <div className={estilos.caixa}>
      <span className={estilos.icone} aria-hidden="true">
        {icone}
      </span>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <p className={estilos.descricao}>{descricao}</p>
      {(acao || acaoSecundaria) && (
        <div className={estilos.acoes}>
          {acao &&
            (acao.para ? (
              <Botao para={acao.para}>{acao.rotulo}</Botao>
            ) : (
              <Botao onClick={acao.aoClicar}>{acao.rotulo}</Botao>
            ))}
          {acaoSecundaria &&
            (acaoSecundaria.para ? (
              <Botao variante="secundario" para={acaoSecundaria.para}>
                {acaoSecundaria.rotulo}
              </Botao>
            ) : (
              <Botao variante="secundario" onClick={acaoSecundaria.aoClicar}>
                {acaoSecundaria.rotulo}
              </Botao>
            ))}
        </div>
      )}
    </div>
  );
}
