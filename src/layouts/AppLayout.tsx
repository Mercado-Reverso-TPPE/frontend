import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../shared/AuthContext";
import { ISearch, IBell, IPlus, IUser, IHistory, IChevronDown } from "../shared/icons";
import { T } from "../shared/tokens";
import { NOTIFICATIONS } from "../shared/data";
import { useState } from "react";

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

export default function AppLayout() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchVal.trim()) {
      navigate(`/?q=${encodeURIComponent(searchVal)}`);
    }
  };

  return (
    <div style={{ fontFamily: T.font.body, backgroundColor: T.bg, color: T.text, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", gap: 20, height: 64 }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, backgroundColor: T.primary, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ISearch size={17} color="#fff" />
            </div>
            <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 21, color: T.text, letterSpacing: "-0.6px" }}>
              quero<span style={{ color: T.primary }}>.</span>
            </span>
          </Link>

          {/* Search */}
          <div className="hdr-search" style={{ flex: 1, position: "relative", maxWidth: 560 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <ISearch size={15} color="#AAAAAA" />
            </div>
            <input
              type="text"
              placeholder="Buscar por produto, categoria ou cidade..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ width: "100%", padding: "10px 14px 10px 40px", border: `1.5px solid ${searchFocused ? T.primary : T.border}`, borderRadius: 10, fontSize: 14, fontFamily: T.font.body, color: T.text, backgroundColor: T.bgMuted, outline: "none", transition: "border-color .15s", boxSizing: "border-box" }}
            />
          </div>

          {/* Nav links */}
          <nav className="hdr-nav" style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
            <Link to="/" style={{ padding: "8px 12px", fontFamily: T.font.display, fontWeight: 500, fontSize: 14, color: location.pathname === "/" ? T.primary : T.textMid, textDecoration: "none", borderRadius: 8 }}>Explorar</Link>
          </nav>

          {/* Notification bell */}
          <Link to="/notifications" style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6, color: T.textMid, display: "flex", textDecoration: "none" }}>
            <IBell />
            {unread > 0 && (
              <span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, backgroundColor: T.error, borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font.display }}>
                {unread}
              </span>
            )}
          </Link>

          {/* Auth / User */}
          {isLoggedIn && user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 6px 6px", border: `1.5px solid ${T.border}`, borderRadius: 10, backgroundColor: "#fff", cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
              >
                <Avatar initials={user.initials} color={user.color} size={28} />
                <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>{user.name.split(" ")[0]}</span>
                <IChevronDown size={12} color={T.textMid} />
              </button>

              {menuOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setMenuOpen(false)} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: 6, minWidth: 180, boxShadow: T.shadow.md, zIndex: 50 }}>
                    {[
                      { icon: <IUser size={14} />, label: "Meu perfil", to: "/profile" },
                      { icon: <IPlus size={14} />, label: "Meus anúncios", to: "/my-ads" },
                      { icon: <IHistory size={14} />, label: "Histórico", to: "/history" },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, color: T.text, textDecoration: "none", fontSize: 13, fontFamily: T.font.display, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.bgMuted)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <span style={{ color: T.textMid }}>{item.icon}</span>{item.label}
                      </Link>
                    ))}
                    <div style={{ height: 1, backgroundColor: T.border, margin: "4px 0" }} />
                    <button onClick={() => { logout(); setMenuOpen(false); navigate("/"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, color: T.error, fontSize: 13, fontFamily: T.font.display, fontWeight: 500, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Link to="/login" style={{ padding: "8px 16px", border: `1.5px solid ${T.border}`, borderRadius: 8, backgroundColor: "transparent", fontSize: 14, fontFamily: T.font.display, fontWeight: 600, color: T.text, textDecoration: "none", whiteSpace: "nowrap" }}>
                Entrar
              </Link>
              <Link to="/register" className="hdr-auth-text" style={{ padding: "9px 18px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#E8803F,#D97338)", fontSize: 14, fontFamily: T.font.display, fontWeight: 700, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, boxShadow: T.shadow.primary, whiteSpace: "nowrap" }}>
                Cadastrar
              </Link>
            </div>
          )}

          {/* Anunciar CTA */}
          <Link to={isLoggedIn ? "/create-ad" : "/login"} style={{ padding: "9px 18px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#E8803F,#D97338)", fontSize: 14, fontFamily: T.font.display, fontWeight: 700, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, boxShadow: T.shadow.primary, flexShrink: 0 }}>
            <IPlus size={14} color="#fff" /><span className="hdr-anunciar-text">Anunciar</span>
          </Link>
        </div>
      </header>

      {/* Page content */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, backgroundColor: T.bgMuted, padding: "24px 28px", flexShrink: 0 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, backgroundColor: T.primary, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ISearch size={13} color="#fff" />
            </div>
            <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.text }}>quero<span style={{ color: T.primary }}>.</span></span>
          </Link>
          <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight }}>© 2026 Quero. Plataforma de compras reversa.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Sobre", "Termos", "Privacidade", "Ajuda"].map(l => (
              <a key={l} href="#" style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
