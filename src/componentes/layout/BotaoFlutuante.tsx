import { Botao } from "@/componentes/base";
import { IPlus } from "@/componentes/icones";
import { useSessao } from "@/hooks/useSessao";

/** Atalho persistente de "+ Anunciar" no canto inferior da tela. */
export function BotaoFlutuante() {
  const { autenticado } = useSessao();

  return (
    <Botao
      variante="flutuante"
      para={autenticado ? "/anunciar" : "/entrar?retorno=%2Fanunciar"}
      icone={<IPlus size={18} color="currentColor" />}
    >
      Anunciar
    </Botao>
  );
}
