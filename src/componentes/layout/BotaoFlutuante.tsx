import { useLocation } from "react-router";
import { Botao } from "@/componentes/base";
import { IPlus } from "@/componentes/icones";
import { useSessao } from "@/hooks/useSessao";

/**
 * Atalho de "+ Anunciar" no canto inferior.
 *
 * Aparece no feed, onde a pessoa percorre a lista e pode não achar o que
 * quer. Nas telas internas o atalho sai de cena: elas têm a própria ação
 * principal e o rodapé ficaria coberto.
 */
export function BotaoFlutuante() {
  const { autenticado } = useSessao();
  const { pathname } = useLocation();

  if (pathname !== "/") return null;

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
