import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MOCK_OFFERS, Offer } from "../shared/data";
import { T, fmtPrice } from "../shared/tokens";
import { IStar, IPin, ICheck, IX, IMessageCircle, IArrowLeft } from "../shared/icons";

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

const COND_COLOR: Record<string, string> = { Novo: T.success, "Semi-novo": T.info, Usado: "#FF9500" };

export default function ReceivedOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState(MOCK_OFFERS);
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const accept = (id: string) => navigate("/accept/" + id);
  const reject = (id: string) => setRejected(r => new Set([...r, id]));

  const pending = offers.filter(o => !rejected.has(o.id));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 28px 60px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 24 }}>
        <IArrowLeft size={16} color={T.textMid} />Voltar ao anúncio
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Ofertas recebidas</h1>
        <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>
          <strong style={{ color: T.primary }}>{pending.length}</strong> oferta{pending.length !== 1 ? "s" : ""} para o seu anúncio · iPhone 15 Pro Max 256GB
        </p>
      </div>

      {pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 18, color: T.text }}>Nenhuma oferta ativa</div>
          <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid }}>Aguarde novas ofertas ou edite seu anúncio para atrair mais vendedores.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pending.map(offer => {
            const cc = COND_COLOR[offer.condition] ?? T.textLight;
            return (
              <div key={offer.id} style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 0 }}>
                  {/* Product image */}
                  <div style={{ width: 160, flexShrink: 0, backgroundColor: T.bgMuted }}>
                    <img src={offer.image} alt={offer.title} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 140, display: "block" }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 4 }}>{offer.title}</div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 10, backgroundColor: `${cc}18`, color: cc, fontSize: 11, fontFamily: T.font.display, fontWeight: 600 }}>
                          {offer.condition}
                        </span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: T.font.display, fontWeight: 800, fontSize: 22, color: T.primary }}>{fmtPrice(offer.price)}</div>
                        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight }}>{offer.sentAt}</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {offer.description}
                    </p>

                    {offer.observations && (
                      <div style={{ padding: "8px 12px", backgroundColor: T.bgMuted, borderRadius: 8, fontFamily: T.font.body, fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
                        💬 <em>{offer.observations}</em>
                      </div>
                    )}

                    {/* Seller + meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar initials={offer.seller.initials} color={offer.seller.color} size={30} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.text }}>{offer.seller.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <IStar size={11} />
                          <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.textMid }}>{offer.seller.rating.toFixed(1)}</span>
                          <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight }}>· <IPin size={10} color={T.textLight} /> {offer.distance} km · {offer.location.split(",")[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                      <button onClick={() => accept(offer.id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: T.success, color: "#fff", border: "none", borderRadius: 8, fontFamily: T.font.display, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        <ICheck size={14} />Aceitar
                      </button>
                      <Link to={`/ad/10/offers/${offer.id}/counter`}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: T.pLight, color: T.primary, border: `1.5px solid ${T.pBorder}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                        💱 Contraproposta
                      </Link>
                      <Link to="/chat/chat1"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: T.infoBg, color: T.info, border: `1.5px solid ${T.info}30`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                        <IMessageCircle size={14} color={T.info} />Conversar
                      </Link>
                      <button onClick={() => reject(offer.id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "#fff", color: T.textMid, border: `1.5px solid ${T.border}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 13, cursor: "pointer", marginLeft: "auto" }}>
                        <IX size={13} />Recusar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
