import { useEffect, useId, useRef, type ReactNode } from "react";
import { Botao, type VarianteDeBotao } from "./Botao";
import estilos from "./DialogoDeConfirmacao.module.css";

interface DialogoDeConfirmacaoProps {
  titulo: string;
  descricao: string;
  rotuloDeConfirmar: string;
  /** Mostra o giro no botão de confirmar enquanto a ação roda. */
  ocupado?: boolean;
  /** Ações que não destroem nada (aceitar, confirmar) usam o botão primário. */
  varianteDeConfirmar?: Extract<VarianteDeBotao, "perigo" | "primario">;
  /** Conteúdo extra entre a descrição e os botões, como um motivo opcional. */
  children?: ReactNode;
  aoCancelar: () => void;
  aoConfirmar: () => void;
}

/**
 * Confirmação de ação destrutiva ou decisiva. Foco no diálogo ao abrir e de volta ao
 * gatilho ao fechar; Esc e clique fora cancelam.
 */
export function DialogoDeConfirmacao({
  titulo,
  descricao,
  rotuloDeConfirmar,
  ocupado = false,
  varianteDeConfirmar = "perigo",
  children,
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
        {children && <div className={estilos.extra}>{children}</div>}
        <div className={estilos.botoes}>
          <Botao variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao variante={varianteDeConfirmar} carregando={ocupado} onClick={aoConfirmar}>
            {rotuloDeConfirmar}
          </Botao>
        </div>
      </div>
    </div>
  );
}
