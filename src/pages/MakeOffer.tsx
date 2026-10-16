import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ALL_ADS, MY_ADS, BuyerAd, SellerAd } from "../shared/data";
import { T, fmtRange } from "../shared/tokens";
import { IArrowLeft, ICheck, ICamera } from "../shared/icons";

const CONDITIONS = ["Novo", "Semi-novo", "Usado"];

export default function MakeOffer() {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();
  const id = Number(adId);
  const ad = [...ALL_ADS, ...MY_ADS].find(a => a.id === id);
  const isBuyerAd = ad?.kind === "buyer";

  const [form, setForm] = useState({ product: "", description: "", condition: "Semi-novo", price: "", observations: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 900);
  };

  const inputStyle = { padding: "11px 14px", border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", color: T.text, outline: "none", width: "100%", boxSizing: "border-box" as const };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = T.primary);
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = T.border);

  if (submitted) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 28px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <ICheck size={36} color={T.success} />
        </div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 10px" }}>
          {isBuyerAd ? "Oferta enviada com sucesso!" : "Proposta enviada!"}
        </h1>
        <p style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, margin: "0 0 8px", lineHeight: 1.6 }}>
          {isBuyerAd
            ? "O comprador será notificado e poderá aceitar, recusar ou fazer uma contraproposta."
            : "O vendedor será notificado e poderá aceitar ou fazer uma contraproposta."}
        </p>
        <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textLight, margin: "0 0 28px" }}>Você receberá uma notificação com a resposta.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/")} style={{ padding: "11px 24px", backgroundColor: T.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Explorar mais anúncios
          </button>
          <button onClick={() => navigate(-1)} style={{ padding: "11px 24px", backgroundColor: T.bgMuted, color: T.text, border: `1.5px solid ${T.border}`, borderRadius: 10, fontFamily: T.font.display, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Ver anúncio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 28px 60px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 24 }}>
        <IArrowLeft size={16} color={T.textMid} />Voltar
      </button>

      {/* Ad context */}
      {ad && (
        <Link to={`/ad/${adId}`} style={{ display: "flex", gap: 14, padding: "16px 20px", backgroundColor: T.pLight, border: `1.5px solid ${T.pBorder}`, borderRadius: 12, marginBottom: 28, textDecoration: "none" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.primary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {isBuyerAd ? "🛒 Respondendo ao anúncio" : "🏷️ Fazendo proposta para"}
            </div>
            <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{ad.title}</div>
            {isBuyerAd
              ? <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: "#1A7A38" }}>{fmtRange((ad as BuyerAd).budget.min, (ad as BuyerAd).budget.max)}</div>
              : <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.primary }}>R$ {(ad as SellerAd).price?.toLocaleString("pt-BR")}</div>}
          </div>
        </Link>
      )}

      <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
        {isBuyerAd ? "Fazer oferta" : "Fazer proposta"}
      </h1>
      <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: "0 0 28px" }}>
        {isBuyerAd
          ? "Descreva o produto que você tem disponível para este comprador."
          : "Informe o valor que você quer pagar e deixe uma mensagem para o vendedor."}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {isBuyerAd ? (
          <>
            {/* Full offer form for seller responding to buyer ad */}
            <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>📦 Produto</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Nome do produto</label>
                <input required type="text" value={form.product} onChange={e => set("product")(e.target.value)} placeholder="Ex: iPhone 14 Pro Max 256GB Space Black" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>

              {/* Image upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Foto do produto</label>
                {imagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={imagePreview} alt="preview" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 10 }} />
                    <button type="button" onClick={() => setImagePreview(null)} style={{ position: "absolute", top: 8, right: 8, padding: "4px 12px", backgroundColor: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Remover</button>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 20px", border: `2px dashed ${T.border}`, borderRadius: 10, cursor: "pointer", backgroundColor: T.bgMuted, transition: "border-color .15s" }}
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
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Descrição detalhada</label>
                <textarea required value={form.description} onChange={e => set("description")(e.target.value)} placeholder="Descreva o estado do produto, tempo de uso, itens incluídos, etc." rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={focus} onBlur={blur} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Estado de conservação</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {CONDITIONS.map(c => (
                    <button key={c} type="button" onClick={() => set("condition")(c)}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${form.condition === c ? T.primary : T.border}`, backgroundColor: form.condition === c ? T.pLight : "#fff", color: form.condition === c ? T.primary : T.textMid, fontFamily: T.font.display, fontWeight: form.condition === c ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>💰 Preço</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Preço da oferta (R$)</label>
                <input required type="number" value={form.price} onChange={e => set("price")(e.target.value)} placeholder="0,00" style={{ ...inputStyle, fontSize: 20, fontFamily: T.font.display, fontWeight: 700, color: T.primary }} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Observações (opcional)</label>
                <textarea value={form.observations} onChange={e => set("observations")(e.target.value)} placeholder="Ex: Disponível para encontro presencial em SP..." rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Simple proposal form for buyer proposing to seller */}
            <div style={{ backgroundColor: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>💰 Sua proposta</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Valor que deseja pagar (R$)</label>
                <input required type="number" value={form.price} onChange={e => set("price")(e.target.value)} placeholder="0,00"
                  style={{ ...inputStyle, fontSize: 22, fontFamily: T.font.display, fontWeight: 700, color: T.primary }} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>Mensagem para o vendedor (opcional)</label>
                <textarea value={form.observations} onChange={e => set("observations")(e.target.value)}
                  placeholder="Ex: Tenho interesse no produto. Posso retirar pessoalmente em SP..." rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </>
        )}

        <div style={{ padding: "12px 16px", backgroundColor: T.bgMuted, borderRadius: 10, fontFamily: T.font.body, fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
          ℹ️ <strong>A plataforma não gerencia entrega ou logística.</strong> O local e a forma de entrega são combinados diretamente entre comprador e vendedor pelo chat.
        </div>

        <button type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1, boxShadow: T.shadow.primary }}>
          {loading ? "Enviando..." : isBuyerAd ? "💼 Enviar oferta" : "📨 Enviar proposta"}
        </button>
      </form>
    </div>
  );
}
