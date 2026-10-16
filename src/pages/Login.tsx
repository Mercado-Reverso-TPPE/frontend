import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../shared/AuthContext";
import { T } from "../shared/tokens";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { login(); navigate("/"); }, 800);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  const field = (label: string, value: string, onChange: (v: string) => void, type = "text", placeholder = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required
        style={{ padding: "11px 14px", border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: T.font.body, color: T.text, outline: "none", transition: "border-color .15s" }}
        onFocus={e => (e.target.style.borderColor = T.primary)}
        onBlur={e => (e.target.style.borderColor = T.border)}
      />
    </div>
  );

  if (forgot) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <button onClick={() => setForgot(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, fontFamily: T.font.display, fontWeight: 600, fontSize: 13, padding: 0, marginBottom: 12 }}>← Voltar</button>
          <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>Recuperar senha</h1>
          <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: "8px 0 0 0" }}>Enviaremos um link de redefinição para seu e-mail.</p>
        </div>

        {forgotSent ? (
          <div style={{ backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
            <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 15, color: "#1A7A38" }}>E-mail enviado!</div>
            <p style={{ fontFamily: T.font.body, fontSize: 13, color: "#2A9449", margin: "4px 0 0" }}>Verifique sua caixa de entrada e siga as instruções.</p>
          </div>
        ) : (
          <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {field("E-mail", email, setEmail, "email", "seu@email.com")}
            <button type="submit" style={{ padding: "12px", backgroundColor: T.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Enviar link de recuperação
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Bem-vindo de volta</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>Entre na sua conta para continuar negociando.</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {field("E-mail", email, setEmail, "email", "seu@email.com")}
        {field("Senha", password, setPassword, "password", "••••••••")}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => setForgot(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, fontFamily: T.font.body, fontSize: 13, fontWeight: 500, padding: 0 }}>
            Esqueci minha senha
          </button>
        </div>

        <button type="submit" disabled={loading} style={{ padding: "13px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1, marginTop: 4 }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: T.border }} />
        <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight }}>ou</span>
        <div style={{ flex: 1, height: 1, backgroundColor: T.border }} />
      </div>

      <p style={{ textAlign: "center", fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>
        Não tem conta?{" "}
        <Link to="/register" style={{ color: T.primary, fontWeight: 600, textDecoration: "none" }}>Criar conta grátis</Link>
      </p>
    </div>
  );
}
