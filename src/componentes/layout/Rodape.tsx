import { Logo } from "./Logo";
import estilos from "./Rodape.module.css";

const ANO = new Date().getFullYear();

/** Rodapé compartilhado da aplicação. */
export function Rodape() {
  return (
    <footer className={estilos.rodape}>
      <div className={estilos.faixa}>
        <Logo tamanho={26} />
        <span className={estilos.assinatura}>
          © {ANO} Quero. Plataforma de compras reversa.
        </span>
        <nav className={estilos.links} aria-label="Links institucionais">
          {["Sobre", "Termos", "Privacidade", "Ajuda"].map((rotulo) => (
            <a key={rotulo} className={estilos.link} href="#">
              {rotulo}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
