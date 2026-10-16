import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { MOCK_OFFERS, NEGOTIATION } from "../shared/data";
import { T, fmtPrice } from "../shared/tokens";
import { IArrowLeft, ICheck, IX } from "../shared/icons";

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

export default function CounterOffer() {
  const navigate = useNavigate();
  const offer = MOCK_OFFERS[0];
  const [history, setHistory] = useState(NEGOTIATION);
  const [newValue, setNewValue] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const lastStep = history[history.length - 1];
  const status = submitted ? "Aguardando resposta do vendedor" : "Aguardando sua resposta";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue) return;
    setHistory(h => [...h, { actor: "buyer", type: "counter", value: Number(newValue), message: message || undefined, at: "01/09 17:30" }]);
    setSubmitted(true);
    setNewValue("");
    setMessage("");
  };

  const stepMeta = (actor: "buyer" | "seller", type: string) => {
    if (actor === "buyer") return { label: "Sua proposta", bg: T.pLight, border: T.pBorder, color: T.primary, align: "right" as const };
    return { label: "Proposta do vendedor", bg: T.bgMuted, border: T.border, color: T.text, align: "left" as const };
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 28px 60px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 24 }}>
        <IArrowLeft size={16} color={T.textMid} />Voltar
      </button>

      <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Negociação de preço</h1>
      <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: "0 0 24px" }}>Histórico de propostas para <strong>{offer.title}</strong></p>

      {/* Seller info strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", backgroundColor: T.bgMuted, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <Avatar initials={offer.seller.initials} color={offer.seller.color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text }}>{offer.seller.name}</div>
          <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid }}>Vendedor</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 18, color: T.primary }}>{fmtPrice(lastStep.value)}</div>
          <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight }}>Proposta atual</div>
        </div>
      </div>

      {/* Negotiation timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {history.map((step, i) => {
          const meta = stepMeta(step.actor, step.type);
          const isFirst = i === 0;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: meta.align === "right" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "80%", padding: "14px 16px", backgroundColor: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 12, boxShadow: T.shadow.sm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight, fontWeight: 500 }}>{meta.label}</span>
                  {isFirst && <span style={{ padding: "1px 7px", backgroundColor: `${T.info}18`, color: T.info, borderRadius: 6, fontSize: 10, fontFamily: T.font.display, fontWeight: 600 }}>Oferta inicial</span>}
                </div>
                <div style={{ fontFamily: T.font.display, fontWeight: 800, fontSize: 22, color: meta.color }}>{fmtPrice(step.value)}</div>
                {step.message && <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid, margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>"{step.message}"</p>}
                <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight, marginTop: 6 }}>{step.at}</div>
              </div>
            </div>
          );
        })}

        {/* Status indicator */}
        <div style={{ textAlign: "center", padding: "8px 16px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", backgroundColor: submitted ? T.successBg : T.pLight, border: `1px solid ${submitted ? T.successBorder : T.pBorder}`, borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: submitted ? T.success : T.primary }} />
            <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: submitted ? T.success : T.primary }}>{status}</span>
          </span>
        </div>
      </div>

      {/* Counter form */}
      {!submitted ? (
        <div style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.text, margin: "0 0 16px" }}>💱 Fazer contraproposta</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text, display: "block", marginBottom: 6 }}>Novo valor (R$)</label>
              <input required type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Ex: 4400"
                style={{ padding: "12px 14px", border: `1.5px solid ${T.primary}`, borderRadius: 10, fontSize: 20, fontFamily: T.font.display, fontWeight: 700, color: T.primary, width: "100%", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text, display: "block", marginBottom: 6 }}>Mensagem (opcional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Explique sua proposta ao vendedor..." rows={3}
                style={{ padding: "11px 14px", border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", color: T.text, width: "100%", boxSizing: "border-box", outline: "none", resize: "vertical", lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = T.primary)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={{ flex: 1, padding: "12px", backgroundColor: T.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Enviar contraproposta
              </button>
              <button type="button" onClick={() => navigate("/accept/o1")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", backgroundColor: T.successBg, color: T.success, border: `1.5px solid ${T.successBorder}`, borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                <ICheck size={15} />Aceitar {fmtPrice(lastStep.value)}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 14, padding: 22, textAlign: "center" }}>
          <ICheck size={28} color={T.success} />
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: "#1A7A38", marginTop: 10 }}>Contraproposta enviada!</div>
          <p style={{ fontFamily: T.font.body, fontSize: 13, color: "#2A9449", margin: "6px 0 16px" }}>Você será notificado quando o vendedor responder.</p>
          <Link to="/chat/chat1" style={{ display: "inline-block", padding: "10px 20px", backgroundColor: T.primary, color: "#fff", borderRadius: 9, fontFamily: T.font.display, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            Conversar pelo chat
          </Link>
        </div>
      )}
    </div>
  );
}
