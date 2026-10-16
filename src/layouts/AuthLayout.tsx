import { Outlet, Link } from "react-router";
import { ISearch } from "../shared/icons";
import { T } from "../shared/tokens";

export default function AuthLayout() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FDF6F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: T.font.body }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginBottom: 32 }}>
        <div style={{ width: 38, height: 38, backgroundColor: T.primary, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ISearch size={19} color="#fff" />
        </div>
        <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 24, color: T.text, letterSpacing: "-0.7px" }}>
          quero<span style={{ color: T.primary }}>.</span>
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 440, backgroundColor: "#fff", borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(0,0,0,.07)", padding: "40px 36px" }}>
        <Outlet />
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: T.textLight, fontFamily: T.font.body }}>
        © 2026 Quero. Plataforma de compras reversa.
      </p>
    </div>
  );
}
