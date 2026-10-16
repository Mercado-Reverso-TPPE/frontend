import { useState } from "react";
import { useNavigate } from "react-router";
import { MOCK_OFFERS } from "../shared/data";
import { T } from "../shared/tokens";
import { IStar, IArrowLeft, ICheck } from "../shared/icons";

export default function Review() {
  const navigate = useNavigate();
  const offer = MOCK_OFFERS[0];
  const seller = offer.seller;
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const LABELS = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente!"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setDone(true); }, 900);
  };

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 28px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, backgroundColor: "#FFFAE0", border: "1px solid #F5E066", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ fontSize: 40 }}>⭐</span>
        </div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 10px" }}>Avaliação enviada!</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, margin: "0 0 28px", lineHeight: 1.6 }}>
          Obrigado por avaliar <strong>{seller.name}</strong>. Isso ajuda a comunidade a confiar mais nas negociações.
        </p>
        <button onClick={() => navigate("/")} style={{ padding: "12px 28px", backgroundColor: T.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 28px 60px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 28 }}>
        <IArrowLeft size={16} />Voltar
      </button>

      <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Avaliar negociação</h1>
      <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: "0 0 28px" }}>Como foi sua experiência com este vendedor?</p>

      {/* Person */}
      <div style={{ display: "flex", gap: 14, padding: "18px", backgroundColor: T.bgMuted, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 28, alignItems: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: seller.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 18, color: "#fff" }}>{seller.initials}</span>
        </div>
        <div>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.text }}>{seller.name}</div>
          <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{offer.title}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Star rating */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text, marginBottom: 16 }}>Nota geral</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 10 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transform: n <= (hoverRating || rating) ? "scale(1.15)" : "scale(1)", transition: "transform .1s" }}>
                <IStar size={40} color="#FFD60A" filled={n <= (hoverRating || rating)} />
              </button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 15, color: "#B8960A" }}>
              {LABELS[hoverRating || rating]}
            </div>
          )}
        </div>

        {/* Comment */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text }}>Comentário (opcional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Conte como foi a experiência: pontualidade, comunicação, estado do produto..."
            rows={4} style={{ padding: "12px 14px", border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", color: T.text, width: "100%", boxSizing: "border-box", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => (e.target.style.borderColor = T.primary)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
          <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight }}>Sua avaliação ficará visível no perfil do vendedor.</span>
        </div>

        <button type="submit" disabled={!rating || submitting}
          style={{ padding: "14px", background: rating ? "linear-gradient(135deg,#E8803F,#D97338)" : T.bgMuted, color: rating ? "#fff" : T.textLight, border: "none", borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 16, cursor: rating && !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {submitting ? "Enviando..." : <><ICheck size={16} />Enviar avaliação</>}
        </button>
      </form>
    </div>
  );
}
