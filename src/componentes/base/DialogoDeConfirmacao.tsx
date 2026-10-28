import { useEffect, useId, useRef } from "react";
import { Botao } from "./Botao";
import estilos from "./DialogoDeConfirmacao.module.css";

interface DialogoDeConfirmacaoProps {
  titulo: string;
  descricao: string;
  rotuloDeConfirmar: string;
  /** Mostra o giro no botão de confirmar enquanto a ação roda. */
  ocupado?: boolean;
  aoCancelar: () => void;
  aoConfirmar: () => void;
}

/**
 * Confirmação de ação destrutiva. Foco no diálogo ao abrir e de volta ao
 * gatilho ao fechar; Esc e clique fora cancelam.
 */
export function DialogoDeConfirmacao({
  titulo,
  descricao,
  rotuloDeConfirmar,
  ocupado = false,
  aoCancelar,
  aoConfirmar,
}: DialogoDeConfirmacaoProps) {
  const idDoTitulo = useId();
  const dialogo = useRef<HTMLDivElement>(null);
  const fechar = useRef(aoCancelar);
  fechar.current = aoCancelar;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar.current();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      anterior?.focus();
    };
  }, []);

  return (
    <div className={estilos.fundo} onClick={aoCancelar}>
      <div
        ref={dialogo}
        tabIndex={-1}
        className={estilos.dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDoTitulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idDoTitulo}>{titulo}</h2>
        <p>{descricao}</p>
        <div className={estilos.botoes}>
          <Botao variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao variante="perigo" carregando={ocupado} onClick={aoConfirmar}>
            {rotuloDeConfirmar}
          </Botao>
        </div>
      </div>
    </div>
  );
}
