import type { EventoDaOferta, Papel } from "@/api/ofertas";
import { fmtDataHora, fmtPrecoExato } from "@/utils/formato";
import estilos from "./Negociacao.module.css";
import { papelOposto, ROTULO_DO_EVENTO, ROTULO_DO_PAPEL } from "./rotulos";

interface LinhaDoTempoProps {
  eventos: EventoDaOferta[];
  usuarioId: string;
  papel: Papel;
}

/**
 * Valores da negociação na ordem em que a API os registrou, com quem agiu
 * em cada passo (QRO-12, QRO-13). Só leitura: as ações ficam no painel.
 */
export function LinhaDoTempo({ eventos, usuarioId, papel }: LinhaDoTempoProps) {
  if (eventos.length === 0) {
    return <p className={estilos.meta}>Ainda não há valores registrados.</p>;
  }

  return (
    <ol className={estilos.tempo} aria-label="Histórico de valores">
      {eventos.map((evento, indice) => {
        const meu = evento.autorId === usuarioId;
        const autor = meu ? "Você" : ROTULO_DO_PAPEL[papelOposto(papel)];
        return (
          <li key={evento.id} className={`${estilos.evento} ${meu ? estilos.eventoMeu : estilos.eventoDeles}`}>
            <span className={estilos.passo} aria-hidden="true">
              {indice + 1}.
            </span>
            <div className={estilos.eventoCorpo}>
              <strong>{ROTULO_DO_EVENTO[evento.tipo] ?? evento.tipo}</strong>
              <span className={estilos.meta}>
                {autor} · {fmtDataHora(evento.registradoEm)}
                {evento.rodada > 0 && ` · rodada ${evento.rodada}`}
              </span>
              {evento.texto && <p className={estilos.justificativa}>“{evento.texto}”</p>}
              {evento.justificativa && <p className={estilos.justificativa}>Motivo: {evento.justificativa}</p>}
              {evento.tipo === "contraproposta" && evento.expiraEm && !evento.respondidaEm && (
                <span className={estilos.meta}>Responder até {fmtDataHora(evento.expiraEm)}</span>
              )}
            </div>
            {evento.preco !== null && <span className={estilos.valor}>{fmtPrecoExato(evento.preco)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
