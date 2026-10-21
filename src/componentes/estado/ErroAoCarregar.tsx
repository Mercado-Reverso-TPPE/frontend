import { Botao } from "@/componentes/base";
import { ErroDeApi } from "@/api/cliente";
import estilos from "./Estados.module.css";

interface ErroAoCarregarProps {
  /** O erro capturado — `ErroDeApi` traz mensagem pronta para o usuário. */
  erro?: unknown;
  titulo?: string;
  /** Recarrega o que falhou. Sem isto, o bloco não oferece nova tentativa. */
  aoTentarDeNovo?: () => void;
}

function mensagemDe(erro: unknown) {
  if (erro instanceof ErroDeApi) return erro.message;
  if (erro instanceof Error && erro.message) return erro.message;
  return "Não foi possível carregar esta informação agora.";
}

/** Estado de erro padrão: diz o que falhou e oferece o próximo passo. */
export function ErroAoCarregar({
  erro,
  titulo = "Algo não carregou",
  aoTentarDeNovo,
}: ErroAoCarregarProps) {
  const codigo = erro instanceof ErroDeApi ? erro.codigo : undefined;

  return (
    <div className={`${estilos.caixa} ${estilos.erro}`} role="alert">
      <span className={estilos.icone} aria-hidden="true">
        ⚠️
      </span>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <p className={estilos.descricao}>{mensagemDe(erro)}</p>
      {codigo && <span className={estilos.detalhe}>código: {codigo}</span>}
      {aoTentarDeNovo && (
        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={aoTentarDeNovo}>
            Tentar de novo
          </Botao>
        </div>
      )}
    </div>
  );
}
