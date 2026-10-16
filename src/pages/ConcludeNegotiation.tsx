import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { MOCK_OFFERS } from "../shared/data";
import { T, fmtPrice } from "../shared/tokens";
import { ICheck, IX, IArrowLeft } from "../shared/icons";

export default function ConcludeNegotiation() {
  const navigate = useNavigate();
  const offer = MOCK_OFFERS[0];
  const [choice, setChoice] = useState<"concluded" | "not_concluded" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = () => {
    if (!choice) return;
    setConfirming(true);
    setTimeout(() => { setConfirming(false); setDone(true); }, 900);
  };

  if (done) {
    const concluded = choice === "concluded";
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 28px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, backgroundColor: concluded ? T.successBg : T.bgMuted, border: `1px solid ${concluded ? T.successBorder : T.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          {concluded ? <ICheck size={36} color={T.success} /> : <IX size={36} color={T.textLight} />}
        </div>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          {concluded ? "Negociação concluída! 🎉" : "Negociação encerrada"}
        </h1>
        <p style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, margin: "0 0 28px", lineHeight: 1.6 }}>
          {concluded
            ? `A venda do ${offer.title} foi registrada com sucesso. O anúncio foi encerrado.`
            : "A negociação foi encerrada sem venda. O anúncio continua disponível para outras ofertas."}
        </p>

        {concluded ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/review/chat1" style={{ display: "inline-block", padding: "12px 24px", backgroundColor: T.primary, color: "#fff", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              ⭐ Avaliar {offer.seller.name}
            </Link>
            <Link to="/history" style={{ display: "inline-block", padding: "12px 24px", backgroundColor: T.bgMuted, color: T.text, border: `1.5px solid ${T.border}`, borderRadius: 10, fontFamily: T.font.display, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              Ver histórico
            </Link>
          </div>
        ) : (
          <Link to="/" style={{ display: "inline-block", padding: "12px 24px", backgroundColor: T.primary, color: "#fff", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Explorar outros anúncios
          </Link>
        )}
      </div>
    );
  }

  const Option = ({ value, icon, label, desc, color, bg, border }: { value: typeof choice; icon: React.ReactNode; label: string; desc: string; color: string; bg: string; border: string }) => (
    <button type="button" onClick={() => setChoice(value as typeof choice)}
      style={{ flex: 1, padding: "22px 16px", border: `2px solid ${choice === value ? color : T.border}`, borderRadius: 14, backgroundColor: choice === value ? bg : "#fff", cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: bg, border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        {icon}
      </div>
      <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: choice === value ? color : T.text, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>{desc}</div>
    </button>
  );

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 28px 60px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 28 }}>
        <IArrowLeft size={16} />Voltar ao chat
      </button>

      <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Finalizar negociação</h1>
      <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: "0 0 28px", lineHeight: 1.5 }}>
        Como foi a negociação com <strong>{offer.seller.name}</strong> pelo <strong>{offer.title}</strong>?
      </p>

      {/* Offer recap */}
      <div style={{ display: "flex", gap: 12, padding: "14px 18px", backgroundColor: T.bgMuted, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <img src={offer.image} alt={offer.title} style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text }}>{offer.title}</div>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.primary }}>{fmtPrice(offer.price)}</div>
          <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid }}>com {offer.seller.name}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Option
          value="concluded"
          icon={<ICheck size={24} color={T.success} />}
          label="Venda concluída"
          desc="A negociação foi bem-sucedida e a venda realizada"
          color={T.success} bg={T.successBg} border={T.successBorder}
        />
        <Option
          value="not_concluded"
          icon={<IX size={24} color={T.textMid} />}
          label="Venda não realizada"
          desc="A negociação foi encerrada sem que a venda acontecesse"
          color={T.textMid} bg={T.bgMuted} border={T.border}
        />
      </div>

      <button onClick={handleConfirm} disabled={!choice || confirming}
        style={{ width: "100%", padding: "14px", background: choice ? "linear-gradient(135deg,#E8803F,#D97338)" : T.bgMuted, color: choice ? "#fff" : T.textLight, border: "none", borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 16, cursor: choice && !confirming ? "pointer" : "not-allowed", transition: "all .2s" }}>
        {confirming ? "Registrando..." : "Confirmar"}
      </button>
    </div>
  );
}
