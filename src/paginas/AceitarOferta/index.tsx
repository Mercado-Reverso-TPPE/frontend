import { useState } from "react";
import { useNavigate } from "react-router";
import { MOCK_OFFERS } from "@/dados/demo";
import { T } from "@/estilos/tokens";
import { fmtPrice } from "@/utils/formato";
import { IStar, IPin, IArrowLeft, ICheck, IMessageCircle } from "@/componentes/icones";

function Avatar({ initials, color, size = 52 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

export default function AceitarOferta() {
  const navigate = useNavigate();
  const offer = MOCK_OFFERS[0];
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => { setConfirming(false); setConfirmed(true); }, 900);
  };

  if (confirmed) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 28px", textAlign: "center" }}>
        <div style={{ width: 88, height: 88, backgroundColor: T.successBg, border: `2px solid ${T.successBorder}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <ICheck size={40} color={T.success} />
        </div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Oferta aceita! 🎉</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, margin: "0 0 8px", lineHeight: 1.6 }}>
          Você escolheu a oferta de <strong>{offer.seller.name}</strong> por <strong style={{ color: T.primary }}>{fmtPrice(offer.price)}</strong>.
        </p>
        <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textLight, margin: "0 0 28px" }}>
          As demais ofertas foram encerradas. Um chat foi criado para você combinar os detalhes da negociação.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/negociacoes/chat1")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", backgroundColor: T.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: T.shadow.primary }}>
            <IMessageCircle size={18} color="#fff" />Ir para o chat
          </button>
          <button onClick={() => navigate("/")} style={{ padding: "13px 24px", backgroundColor: T.bgMuted, color: T.text, border: `1.5px solid ${T.border}`, borderRadius: 10, fontFamily: T.font.display, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 28px 60px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 28 }}>
        <IArrowLeft size={16} />Voltar
      </button>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Você escolheu esta oferta</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>Confirme para encerrar as demais propostas e iniciar o chat.</p>
      </div>

      {/* Offer summary card */}
      <div style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
        <img src={offer.image} alt={offer.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
        <div style={{ padding: 22 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 6 }}>{offer.title}</div>
          <div style={{ fontFamily: T.font.display, fontWeight: 800, fontSize: 28, color: T.primary, marginBottom: 16 }}>{fmtPrice(offer.price)}</div>

          {/* Seller */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: `1px solid ${T.border}` }}>
            <Avatar initials={offer.seller.initials} color={offer.seller.color} />
            <div>
              <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text }}>{offer.seller.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <IStar size={13} />
                <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{offer.seller.rating.toFixed(1)} · {offer.seller.reviews} avaliações</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
            <IPin size={13} color={T.textLight} />
            <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{offer.location} · {offer.distance} km de você</span>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div style={{ padding: "14px 16px", backgroundColor: "#FFF8EE", border: "1px solid #FFD8A0", borderRadius: 10, marginBottom: 20 }}>
        <p style={{ fontFamily: T.font.body, fontSize: 13, color: "#8A5800", margin: 0, lineHeight: 1.5 }}>
          ⚠️ <strong>Atenção:</strong> ao confirmar, as demais <strong>{MOCK_OFFERS.length - 1} ofertas</strong> serão recusadas automaticamente e os vendedores serão notificados.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ flex: 1, padding: "13px", border: `1.5px solid ${T.border}`, borderRadius: 10, backgroundColor: "#fff", fontFamily: T.font.display, fontWeight: 600, fontSize: 15, color: T.text, cursor: "pointer" }}>
          Cancelar
        </button>
        <button onClick={handleConfirm} disabled={confirming}
          style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: "linear-gradient(135deg,#34C759,#28A346)", color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: confirming ? "not-allowed" : "pointer", opacity: confirming ? 0.8 : 1 }}>
          <ICheck size={18} />
          {confirming ? "Confirmando..." : "Confirmar escolha"}
        </button>
      </div>
    </div>
  );
}
