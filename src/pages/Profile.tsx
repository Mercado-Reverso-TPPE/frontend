import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../shared/AuthContext";
import { ME } from "../shared/data";
import { T } from "../shared/tokens";
import { IStar, IEdit, ICheck, ICamera, IPackage, IHistory } from "../shared/icons";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ALL_CATEGORIES = ["Eletrônicos","Informática","Veículos","Games","Esportes","Casa & Jardim","Instrumentos","Moda","Livros","Colecionáveis","Outros"];

function Avatar({ initials, color, size = 80 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => <IStar key={i} size={16} filled={i <= Math.round(rating)} color={i <= Math.round(rating) ? "#FFD60A" : T.border} />)}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { buyer: "Comprador", seller: "Vendedor", both: "Comprador e Vendedor" };
const ROLE_EMOJI: Record<string, string> = { buyer: "🛒", seller: "🏷️", both: "🔄" };

export default function Profile() {
  const { user: authUser } = useAuth();
  const user = authUser ?? ME;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: user.name, phone: user.phone, city: user.city, state: user.state });
  const [interests, setInterests] = useState<string[]>(["Eletrônicos", "Informática", "Games"]);
  const toggleInterest = (cat: string) => setInterests(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const inp = (label: string, key: keyof typeof form, type = "text") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.textMid, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      {editing ? (
        <input type={type} value={form[key]} onChange={e => set(key)(e.target.value)}
          style={{ padding: "9px 12px", border: `1.5px solid ${T.primary}`, borderRadius: 8, fontSize: 14, fontFamily: T.font.body, color: T.text, outline: "none" }} />
      ) : (
        <div style={{ fontFamily: T.font.body, fontSize: 15, color: T.text, padding: "9px 0" }}>{form[key]}</div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 28px 60px" }}>
      <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 28px", letterSpacing: "-0.5px" }}>Meu Perfil</h1>

      {saved && (
        <div style={{ backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <ICheck size={16} color={T.success} />
          <span style={{ fontFamily: T.font.body, fontSize: 14, color: "#1A7A38" }}>Perfil atualizado com sucesso!</span>
        </div>
      )}

      {/* Avatar + identity */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, marginBottom: 16, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Avatar initials={user.initials} color={user.color} size={88} />
          {editing && (
            <button style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, backgroundColor: T.primary, border: "3px solid #fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ICamera size={13} color="#fff" />
            </button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 22, color: T.text, marginBottom: 4 }}>{form.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Stars rating={user.rating} />
            <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{user.rating.toFixed(1)} · {user.reviews} avaliações</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", backgroundColor: T.pLight, border: `1px solid ${T.pBorder}`, borderRadius: 20 }}>
            <span style={{ fontSize: 13 }}>{ROLE_EMOJI[user.role]}</span>
            <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.primary }}>{ROLE_LABEL[user.role]}</span>
          </div>
          <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight, marginTop: 8 }}>Membro desde {user.joinedAt}</div>
        </div>

        <button onClick={() => editing ? handleSave() : setEditing(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: editing ? T.primary : T.bgMuted, color: editing ? "#fff" : T.text, border: `1.5px solid ${editing ? T.primary : T.border}`, borderRadius: 9, fontFamily: T.font.display, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          {editing ? <><ICheck size={14} />Salvar</> : <><IEdit size={14} />Editar</>}
        </button>
      </div>

      {/* Editable fields */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, marginBottom: 16 }}>
        <h2 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.text, margin: "0 0 20px" }}>Informações pessoais</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {inp("Nome", "name")}
          {inp("Telefone", "phone", "tel")}
          {inp("Cidade", "city")}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.textMid, textTransform: "uppercase", letterSpacing: "0.5px" }}>Estado</label>
            {editing ? (
              <select value={form.state} onChange={e => set("state")(e.target.value)}
                style={{ padding: "9px 12px", border: `1.5px solid ${T.primary}`, borderRadius: 8, fontSize: 14, fontFamily: T.font.body, color: T.text, backgroundColor: "#fff", outline: "none" }}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <div style={{ fontFamily: T.font.body, fontSize: 15, color: T.text, padding: "9px 0" }}>{form.state}</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 20 }}>
          <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.textMid, textTransform: "uppercase", letterSpacing: "0.5px" }}>E-mail</label>
          <div style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, padding: "9px 0" }}>maria@email.com <span style={{ fontSize: 11, color: T.textLight }}>(não editável)</span></div>
        </div>
      </div>

      {/* Interest categories */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, marginBottom: 16 }}>
        <h2 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.text, margin: "0 0 6px" }}>Categorias de interesse</h2>
        <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textLight, margin: "0 0 16px" }}>Usado para personalizar suas recomendações no feed.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_CATEGORIES.map(cat => {
            const active = interests.includes(cat);
            return (
              <button key={cat} type="button" onClick={() => toggleInterest(cat)}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${active ? T.primary : T.border}`, backgroundColor: active ? T.pLight : "#fff", color: active ? T.primary : T.textMid, fontFamily: T.font.display, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 5 }}>
                {active && <ICheck size={11} color={T.primary} />}
                {cat}
              </button>
            );
          })}
        </div>
        {interests.length > 0 && (
          <div style={{ marginTop: 12, fontFamily: T.font.body, fontSize: 12, color: T.textLight }}>
            {interests.length} categoria{interests.length !== 1 ? "s" : ""} selecionada{interests.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { icon: <IPackage size={20} color={T.primary} />, label: "Meus anúncios", desc: "4 anúncios ativos", to: "/my-ads" },
          { icon: <IHistory size={20} color={T.info} />, label: "Histórico", desc: "5 negociações", to: "/history" },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ display: "flex", alignItems: "center", gap: 14, backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", textDecoration: "none", transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.primary; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border; }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.bgMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
            <div>
              <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 14, color: T.text }}>{item.label}</div>
              <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
