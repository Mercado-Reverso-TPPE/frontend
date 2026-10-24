import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Avatar, Botao } from "@/componentes/base";
import { IBell, IChevronDown, IHistory, IPackage, IPlus, ISearch, IUser } from "@/componentes/icones";
import { useFiltros } from "@/hooks/useFiltros";
import { useSessao } from "@/hooks/useSessao";
import { NOTIFICATIONS } from "@/dados/demo";
import { T } from "@/estilos/tokens";
import estilos from "./Cabecalho.module.css";
import { Logo } from "./Logo";

const OPCOES_DO_MENU = [
  { icone: <IUser size={14} />, rotulo: "Meu perfil", para: "/perfil" },
  { icone: <IPackage size={14} />, rotulo: "Meus anúncios", para: "/meus-anuncios" },
  { icone: <IPlus size={14} />, rotulo: "Minha loja", para: "/minha-loja" },
  { icone: <IHistory size={14} />, rotulo: "Histórico", para: "/historico" },
];

/** Cabeçalho fixo: busca sempre visível, sino, conta e o CTA de anunciar. */
export function Cabecalho() {
  const { usuario, autenticado, sair } = useSessao();
  const { filtros, definirBusca } = useFiltros();
  const navegar = useNavigate();
  const localizacao = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [termo, setTermo] = useState(filtros.busca);

  // Enquanto as notificações não vêm da API, a contagem usa os dados de demonstração.
  const naoLidas = NOTIFICATIONS.filter((notificacao) => !notificacao.read).length;

  const buscar = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (localizacao.pathname !== "/") navegar(termo ? `/?q=${encodeURIComponent(termo)}` : "/");
    else definirBusca(termo);
  };

  return (
    <header className={estilos.cabecalho}>
      <div className={estilos.faixa}>
        <Logo />

        <form className={estilos.busca} role="search" onSubmit={buscar}>
          <label className="apenas-leitor-de-tela" htmlFor="busca-global">
            Buscar anúncios
          </label>
          <span className={estilos.lupa}>
            <ISearch size={15} color="var(--texto-terciario)" />
          </span>
          <input
            id="busca-global"
            className={estilos.campoDeBusca}
            type="search"
            placeholder="Buscar por produto, categoria ou cidade..."
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
          />
        </form>

        <nav className={estilos.navegacao} aria-label="Navegação principal">
          <Link
            to="/"
            className={`${estilos.item} ${localizacao.pathname === "/" ? estilos.itemAtual : ""}`}
            aria-current={localizacao.pathname === "/" ? "page" : undefined}
          >
            Explorar
          </Link>
        </nav>

        <Link
          to="/notificacoes"
          className={estilos.sino}
          aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : "Notificações"}
        >
          <IBell />
          {naoLidas > 0 && (
            <span className={estilos.contador} aria-hidden="true">
              {naoLidas}
            </span>
          )}
        </Link>

        {autenticado && usuario ? (
          <div className={estilos.perfil}>
            <button
              type="button"
              className={estilos.gatilho}
              onClick={() => setMenuAberto((aberto) => !aberto)}
              aria-expanded={menuAberto}
              aria-haspopup="menu"
            >
              <Avatar
                iniciais={usuario.initials}
                cor={usuario.color}
                tamanho={28}
                nome={usuario.name}
                foto={usuario.photo}
              />
              {usuario.name.split(" ")[0]}
              <IChevronDown size={12} color={T.textMid} />
            </button>

            {menuAberto && (
              <>
                <div className={estilos.fundoDoMenu} onClick={() => setMenuAberto(false)} />
                <div className={estilos.menu} role="menu">
                  <div className={estilos.identidade}>
                    <strong>{usuario.name}</strong>
                    <span>
                      {usuario.city ? `${usuario.city}${usuario.state ? `, ${usuario.state}` : ""}` : "Localização não informada"}
                    </span>
                  </div>
                  <div className={estilos.separador} />
                  {OPCOES_DO_MENU.map((opcao) => (
                    <Link
                      key={opcao.para}
                      to={opcao.para}
                      role="menuitem"
                      className={estilos.opcao}
                      onClick={() => setMenuAberto(false)}
                    >
                      <span style={{ color: T.textMid, display: "flex" }} aria-hidden="true">
                        {opcao.icone}
                      </span>
                      {opcao.rotulo}
                    </Link>
                  ))}
                  <div className={estilos.separador} />
                  <button
                    type="button"
                    role="menuitem"
                    className={`${estilos.opcao} ${estilos.sairDaConta}`}
                    onClick={() => {
                      sair();
                      setMenuAberto(false);
                      navegar("/");
                    }}
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={estilos.acoes}>
            <Botao variante="secundario" para="/entrar">
              Entrar
            </Botao>
            <Botao className={estilos.cadastrar} para="/cadastrar">
              Cadastrar
            </Botao>
          </div>
        )}

        <Botao
          para={autenticado ? "/anunciar" : "/entrar?retorno=%2Fanunciar"}
          icone={<IPlus size={14} color="currentColor" />}
        >
          Anunciar
        </Botao>
      </div>
    </header>
  );
}
