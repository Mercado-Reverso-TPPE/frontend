import { EstadoVazio } from "@/componentes/estado";

/** Rota inexistente. */
export default function NaoEncontrada() {
  return (
    <div className="conteudo conteudo-com-respiro">
      <EstadoVazio
        icone="🧭"
        titulo="Esta página não existe"
        descricao="O endereço pode ter mudado ou o anúncio saiu do ar. Volte ao feed para continuar de onde parou."
        acao={{ rotulo: "Ir para o feed", para: "/" }}
      />
    </div>
  );
}
