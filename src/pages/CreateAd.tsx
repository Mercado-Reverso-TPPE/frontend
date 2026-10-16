import { useState } from "react";
import { useNavigate } from "react-router";
import { T } from "../shared/tokens";
import { ICheck, IMapPin, ICamera } from "../shared/icons";

const CATEGORIES = ["Eletrônicos","Informática","Veículos","Games","Esportes","Casa & Jardim","Instrumentos","Moda","Outros"];
const CONDITIONS = ["Novo", "Semi-novo", "Usado", "Qualquer"];
const RADII = ["5 km","10 km","25 km","50 km","100 km","Qualquer distância"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>{label}</label>
      {children}
      {hint && <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight }}>{hint}</span>}
    </div>
  );
}

const inputStyle = { padding: "11px 14px", border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", color: T.text, outline: "none", width: "100%", boxSizing: "border-box" as const, transition: "border-color .15s" };
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.borderColor = T.primary);
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.borderColor = T.border);

export default function CreateAd() {
  const navigate = useNavigate();
  const [adType, setAdType] = useState<"buy" | "sell">("buy");
  const [form, setForm] = useState({ title: "", category: "", description: "", condition: "Qualquer", location: "", radius: "25 km", budgetMin: "", budgetMax: "", price: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 900);
  };

  if (submitted) {
    const isSell = adType === "sell";
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 28px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <ICheck size={36} color={T.success} />
        </div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Anúncio publicado!</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, margin: "0 0 28px", lineHeight: 1.6 }}>
          {isSell
            ? <>Seu anúncio de venda de <strong>"{form.title}"</strong> está no ar.</>
            : <>Sua busca por <strong>"{form.title}"</strong> está no ar. Vendedores próximos serão notificados.</>}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/ad/10")} style={{ padding: "12px 24px", backgroundColor: T.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Ver meu anúncio
          </button>
          <button onClick={() => navigate("/my-ads")} style={{ padding: "12px 24px", backgroundColor: T.bgMuted, color: T.text, border: `1.5px solid ${T.border}`, borderRadius: 10, fontFamily: T.font.display, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Meus anúncios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 28px 60px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 20px", letterSpacing: "-0.5px" }}>Criar anúncio</h1>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 12 }}>
          {(["buy", "sell"] as const).map(type => {
            const active = adType === type;
            const config = type === "buy"
              ? { emoji: "🛒", label: "Quero Comprar", desc: "Publique o que você procura e receba ofertas" }
              : { emoji: "🏷️", label: "Quero Vender", desc: "Anuncie seu produto para compradores interessados" };
            return (
              <button key={type} type="button" onClick={() => setAdType(type)}
                style={{ flex: 1, padding: "16px 14px", border: `2px solid ${active ? T.primary : T.border}`, borderRadius: 12, backgroundColor: active ? T.pLight : "#fff", cursor: "pointer", textAlign: "left", transition: "all .15s", position: "relative" }}>
                {active && (
                  <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, backgroundColor: T.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ICheck size={10} color="#fff" />
                  </div>
                )}
                <div style={{ fontSize: 24, marginBottom: 6 }}>{config.emoji}</div>
                <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 14, color: active ? T.primary : T.text, marginBottom: 3 }}>{config.label}</div>
                <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight, lineHeight: 1.4 }}>{config.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Section: Basic info */}
        <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>📝 Informações básicas</div>

          <Field label="Título do anúncio" hint={adType === "buy" ? "Seja específico sobre o produto que procura" : "Descreva seu produto de forma atrativa"}>
            <input required type="text" value={form.title} onChange={e => set("title")(e.target.value)}
              placeholder={adType === "buy" ? "Ex: iPhone 14 Pro Max 256GB" : "Ex: iPhone 14 Pro Max 256GB Space Black"}
              style={inputStyle} onFocus={focus} onBlur={blur} />
          </Field>

          <Field label="Categoria">
            <select required value={form.category} onChange={e => set("category")(e.target.value)} style={{ ...inputStyle, appearance: "none", backgroundColor: "#fff" }} onFocus={focus} onBlur={blur}>
              <option value="">Selecionar categoria</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Descrição" hint={adType === "buy" ? "Detalhe o estado desejado, acessórios, etc." : "Descreva o estado do produto, tempo de uso, itens incluídos, etc."}>
            <textarea required value={form.description} onChange={e => set("description")(e.target.value)}
              placeholder={adType === "buy" ? "Ex: Procuro em ótimo estado, sem arranhões na tela..." : "Ex: Produto em excelente estado, comprado há 6 meses..."}
              rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={focus} onBlur={blur} />
          </Field>

          <Field label={adType === "buy" ? "Estado de conservação desejado" : "Estado de conservação"}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(adType === "buy" ? CONDITIONS : CONDITIONS.slice(0, 3)).map(c => (
                <button key={c} type="button" onClick={() => set("condition")(c)}
                  style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${form.condition === c ? T.primary : T.border}`, backgroundColor: form.condition === c ? T.pLight : "#fff", color: form.condition === c ? T.primary : T.textMid, fontFamily: T.font.display, fontWeight: form.condition === c ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          </Field>

          {/* Photo upload - only for sell */}
          {adType === "sell" && (
            <Field label="Foto do produto" hint="Opcional · Anúncios com foto recebem mais propostas">
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 10 }} />
                  <button type="button" onClick={() => setImagePreview(null)} style={{ position: "absolute", top: 8, right: 8, padding: "4px 12px", backgroundColor: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Remover</button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 20px", border: `2px dashed ${T.border}`, borderRadius: 10, cursor: "pointer", backgroundColor: T.bgMuted }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <ICamera size={28} color={T.textLight} />
                  <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid }}>Adicionar foto</span>
                  <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight }}>PNG, JPG ou WEBP · máx. 10MB</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setImagePreview(URL.createObjectURL(f));
                  }} />
                </label>
              )}
            </Field>
          )}
        </div>

        {/* Section: Location */}
        <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>📍 Localização</div>

          <Field label="Cidade / bairro de referência">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <IMapPin size={15} color={T.textLight} />
              </div>
              <input required type="text" value={form.location} onChange={e => set("location")(e.target.value)} placeholder="Ex: São Paulo, SP" style={{ ...inputStyle, paddingLeft: 38 }} onFocus={focus} onBlur={blur} />
            </div>
          </Field>

          {adType === "buy" && (
            <Field label="Raio de busca" hint="Quanto mais amplo, mais vendedores receberão seu anúncio">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {RADII.map(r => (
                  <button key={r} type="button" onClick={() => set("radius")(r)}
                    style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${form.radius === r ? T.primary : T.border}`, backgroundColor: form.radius === r ? T.pLight : "#fff", color: form.radius === r ? T.primary : T.textMid, fontFamily: T.font.display, fontWeight: form.radius === r ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
                    {r}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>

        {/* Section: Budget (buy) or Price (sell) */}
        <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
            {adType === "buy" ? "💰 Orçamento" : "💰 Preço"}
          </div>

          {adType === "buy" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Mínimo (R$)" hint="Menor valor aceitável">
                  <input type="number" value={form.budgetMin} onChange={e => set("budgetMin")(e.target.value)} placeholder="0" style={inputStyle} onFocus={focus} onBlur={blur} />
                </Field>
                <Field label="Máximo (R$)" hint="Limite do seu orçamento">
                  <input required type="number" value={form.budgetMax} onChange={e => set("budgetMax")(e.target.value)} placeholder="0" style={inputStyle} onFocus={focus} onBlur={blur} />
                </Field>
              </div>
              {form.budgetMin && form.budgetMax && (
                <div style={{ backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, padding: "10px 14px", fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: "#1A7A38" }}>
                  Faixa: R$ {Number(form.budgetMin).toLocaleString("pt-BR")} — R$ {Number(form.budgetMax).toLocaleString("pt-BR")}
                </div>
              )}
            </>
          ) : (
            <Field label="Preço (R$)">
              <input required type="number" value={form.price} onChange={e => set("price")(e.target.value)} placeholder="0,00"
                style={{ ...inputStyle, fontSize: 20, fontFamily: T.font.display, fontWeight: 700, color: T.primary }} onFocus={focus} onBlur={blur} />
            </Field>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1, boxShadow: T.shadow.primary }}>
          {loading ? "Publicando..." : "Publicar anúncio"}
        </button>
      </form>
    </div>
  );
}
