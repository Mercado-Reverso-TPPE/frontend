import { useParams, Link, useNavigate } from "react-router";
import { ALL_ADS, MY_ADS, MOCK_OFFERS } from "@/dados/demo";
import { T, catColor, comAlfa } from "@/estilos/tokens";
import { fmtDistancia, fmtPrice, fmtRange } from "@/utils/formato";
import { IStar, IPin, ITag, IMessageCircle, IArrowLeft, IEye, IClock } from "@/componentes/icones";

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

export default function AnuncioDetalhe() {
  const { id: adId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const id = Number(adId);
  const ad = [...ALL_ADS, ...MY_ADS].find(a => a.id === id);

  if (!ad) {
    return (
      <div style={{ textAlign: "center", padding: "80px 28px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 22, color: T.text }}>Anúncio não encontrado</h2>
        <Link to="/" style={{ color: T.primary, fontFamily: T.font.display, fontWeight: 600 }}>Voltar para o início</Link>
      </div>
    );
  }

  const isBuyerAd = ad.kind === "buyer";
  const cc = catColor(ad.category);
  const person = isBuyerAd ? ad.buyer : ad.seller;
  const offers = MOCK_OFFERS.filter(o => o.adId === 10); // simulate

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 60px" }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.textMid, padding: 0, marginBottom: 24 }}>
        <IArrowLeft size={16} color={T.textMid} />Voltar
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Header card */}
          <div style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 28, position: "relative", overflow: "hidden" }}>
            {isBuyerAd && ad.featured && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.primary},#F59A5B)` }} />
            )}
            {!isBuyerAd && (
              <img src={(ad as typeof ad & { image: string }).image} alt={ad.title} style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 10, marginBottom: 20 }} />
            )}

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, backgroundColor: isBuyerAd ? T.infoBg : T.pLight, color: isBuyerAd ? T.info : T.primary, fontSize: 12, fontFamily: T.font.display, fontWeight: 600 }}>
                {isBuyerAd ? "🛒 Procurando" : "🏷️ Vendendo"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, backgroundColor: comAlfa(cc, 0.08), color: cc, fontSize: 12, fontFamily: T.font.display, fontWeight: 600 }}>
                <ITag size={10} color={cc} />{ad.category}
              </span>
              {!isBuyerAd && <span style={{ padding: "4px 10px", borderRadius: 20, backgroundColor: comAlfa(T.info, 0.08), color: T.info, fontSize: 12, fontFamily: T.font.display, fontWeight: 600 }}>{(ad as any).condition}</span>}
            </div>

            <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 14px", letterSpacing: "-0.5px" }}>{ad.title}</h1>
            <p style={{ fontFamily: T.font.body, fontSize: 15, color: T.textMid, margin: "0 0 20px", lineHeight: 1.7 }}>{ad.description}</p>

            {/* Price / Budget */}
            {isBuyerAd ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: T.successBg, borderRadius: 10, border: `1px solid ${T.successBorder}`, marginBottom: 16 }}>
                <span style={{ fontFamily: T.font.body, fontSize: 13, color: "#2A9449" }}>Orçamento</span>
                <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 20, color: "#1A7A38" }}>{fmtRange(ad.budget.min, ad.budget.max)}</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontFamily: T.font.display, fontWeight: 800, fontSize: 28, color: T.primary }}>{fmtPrice((ad as any).price)}</span>
              </div>
            )}

            {/* Meta */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { icon: <IPin size={13} />, text: `${ad.location} · ${fmtDistancia(ad.distance)}` },
                { icon: <IClock size={13} />, text: `Publicado ${ad.timeAgo}` },
                isBuyerAd
                  ? { icon: <span style={{ fontSize: 13 }}>📍</span>, text: `Raio de busca: ${ad.radius} km` }
                  : { icon: <IEye size={13} />, text: `${(ad as any).views} visualizações` },
                isBuyerAd
                  ? { icon: <span style={{ fontSize: 13 }}>🎯</span>, text: `Estado desejado: ${ad.conditionWanted}` }
                  : null,
              ].filter(Boolean).map((m, i) => m && (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: T.textLight }}>{m.icon}</span>
                  <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          {isBuyerAd && offers.length > 0 && false && (
            <div style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <h2 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 18, color: T.text, margin: 0 }}>
                  Ofertas recebidas <span style={{ color: T.primary }}>({offers.length})</span>
                </h2>
                <Link to="/anuncios/10/ofertas" style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.primary, textDecoration: "none" }}>Ver todas →</Link>
              </div>

              {offers.slice(0, 2).map(o => (
                <div key={o.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
                  <img src={o.image} alt={o.title} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text }}>{o.title}</div>
                    <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid, marginTop: 2 }}>{o.seller.name} · {o.sentAt}</div>
                    <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: T.primary, marginTop: 4 }}>{fmtPrice(o.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Person card */}
          <div style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
            <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 13, color: T.textMid, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
              {isBuyerAd ? "Comprador" : "Vendedor"}
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <Avatar initials={person.initials} color={person.color} size={48} />
              <div>
                <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text }}>{person.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                  <IStar size={13} />
                  <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{person.rating.toFixed(1)} · {person.reviews} avaliações</span>
                </div>
                <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight, marginTop: 2 }}>Membro desde {person.joinedAt}</div>
              </div>
            </div>
            <div style={{ height: 1, backgroundColor: T.border, marginBottom: 14 }} />
            <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}><IPin size={12} color={T.textLight} /> {person.city}, {person.state}</div>
          </div>

          {/* CTA — derived from ad kind, no toggle needed */}
          {isBuyerAd ? (
            <Link to={`/anuncios/${adId}/ofertar`} style={{ display: "block", padding: "14px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "center", textDecoration: "none", boxShadow: T.shadow.primary }}>
              💼 Fazer oferta
            </Link>
          ) : (
            <>
              <Link to={`/anuncios/${adId}/ofertar`} style={{ display: "block", padding: "14px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "center", textDecoration: "none", boxShadow: T.shadow.primary }}>
                📨 Fazer proposta
              </Link>
              <Link to="/negociacoes/chat1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", backgroundColor: T.infoBg, border: `1.5px solid ${T.info}`, color: T.info, borderRadius: 12, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                <IMessageCircle size={18} color={T.info} />Conversar
              </Link>
            </>
          )}

          {/* Status card */}
          <div style={{ backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: T.success }} />
              <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 13, color: "#1A7A38" }}>Anúncio ativo</span>
            </div>
            <span style={{ fontFamily: T.font.body, fontSize: 12, color: "#2A9449" }}>{ad.kind === "buyer" ? `Publicado em ${ad.publishedAt}` : `Publicado há ${ad.timeAgo}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
