import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useSessao } from "@/hooks/useSessao";
import { T } from "@/estilos/tokens";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function Cadastrar() {
  const { entrar } = useSessao();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const retorno = parametros.get("retorno") ?? "/";
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", city: "", state: "SP" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { entrar(); navigate(retorno, { replace: true }); }, 900);
  };

  const inp = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key)(e.target.value)} placeholder={placeholder} required
        style={{ padding: "10px 13px", border: `1.5px solid ${T.border}`, borderRadius: 9, fontSize: 14, fontFamily: T.font.body, color: T.text, outline: "none" }}
        onFocus={e => (e.target.style.borderColor = T.primary)}
        onBlur={e => (e.target.style.borderColor = T.border)}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 24, color: T.text, margin: "0 0 5px", letterSpacing: "-0.5px" }}>Criar conta gratuita</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>Comece a negociar em menos de 2 minutos.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {inp("Nome completo", "name", "text", "Seu nome")}
        {inp("E-mail", "email", "email", "seu@email.com")}
        {inp("Senha", "password", "password", "Mínimo 8 caracteres")}
        {inp("Telefone / WhatsApp", "phone", "tel", "(11) 99999-9999")}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 10 }}>
          {inp("Cidade", "city", "text", "São Paulo")}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Estado</label>
            <select value={form.state} onChange={e => set("state")(e.target.value)}
              style={{ padding: "10px 8px", border: `1.5px solid ${T.border}`, borderRadius: 9, fontSize: 14, fontFamily: T.font.body, color: T.text, backgroundColor: "#fff", outline: "none", height: 43 }}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ padding: "13px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1, marginTop: 4 }}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p style={{ textAlign: "center", fontFamily: T.font.body, fontSize: 12, color: T.textLight, margin: 0 }}>
          Ao criar conta você concorda com os{" "}
          <a href="#" style={{ color: T.primary, textDecoration: "none" }}>Termos de Uso</a> e{" "}
          <a href="#" style={{ color: T.primary, textDecoration: "none" }}>Política de Privacidade</a>.
        </p>
      </form>

      <p style={{ textAlign: "center", fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>
        Já tem conta?{" "}
        <Link to="/entrar" style={{ color: T.primary, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
      </p>
    </div>
  );
}
