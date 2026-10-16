import { useState } from "react";
import { Link } from "react-router";
import { MY_ADS, BuyerAd } from "../shared/data";
import { T, fmtRange } from "../shared/tokens";
import { IPlus, IEdit, ICheck } from "../shared/icons";

type Status = "active" | "paused" | "closed";

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  active: { label: "Ativo", color: T.success, bg: T.successBg, border: T.successBorder },
  paused: { label: "Pausado", color: "#FF9500", bg: "#FFF8EE", border: "#FFD8A0" },
  closed: { label: "Encerrado", color: T.textLight, bg: T.bgMuted, border: T.border },
};

export default function MyAds() {
  const [ads, setAds] = useState<BuyerAd[]>(MY_ADS);
  const [confirm, setConfirm] = useState<{ id: number; action: "close" } | null>(null);

  const toggle = (id: number) => setAds(list => list.map(a => a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a));
  const close = (id: number) => { setAds(list => list.map(a => a.id === id ? { ...a, status: "closed" } : a)); setConfirm(null); };

  const active = ads.filter(a => a.status === "active").length;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 28px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Meus anúncios</h1>
          <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{active} ativo{active !== 1 ? "s" : ""} · {ads.length} no total</span>
        </div>
        <Link to="/create-ad" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none" }}>
          <IPlus size={15} color="#fff" />Novo anúncio
        </Link>
      </div>

      {ads.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 18, color: T.text, marginBottom: 8 }}>Nenhum anúncio ainda</div>
          <Link to="/create-ad" style={{ display: "inline-block", padding: "11px 24px", backgroundColor: T.primary, color: "#fff", borderRadius: 10, textDecoration: "none", fontFamily: T.font.display, fontWeight: 700, fontSize: 14 }}>Criar primeiro anúncio</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ads.map(ad => {
            const sm = STATUS_META[ad.status];
            return (
              <div key={ad.id} style={{ backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {/* Status dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: sm.color, flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: ad.status === "closed" ? T.textMid : T.text }}>{ad.title}</span>
                    <span style={{ padding: "2px 9px", borderRadius: 10, backgroundColor: sm.bg, border: `1px solid ${sm.border}`, fontSize: 11, fontFamily: T.font.display, fontWeight: 600, color: sm.color }}>{sm.label}</span>
                    {ad.urgent && ad.status === "active" && <span style={{ padding: "2px 8px", borderRadius: 10, backgroundColor: T.errorBg, fontSize: 11, fontFamily: T.font.display, fontWeight: 600, color: T.error }}>⚡ Urgente</span>}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 14, color: "#1A7A38" }}>{fmtRange(ad.budget.min, ad.budget.max)}</span>
                    <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>
                      <strong style={{ color: ad.offers > 0 ? T.primary : T.text }}>{ad.offers}</strong> oferta{ad.offers !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight }}>{ad.publishedAt}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  {ad.status !== "closed" && (
                    <>
                      <Link to={`/ad/${ad.id}`} style={{ padding: "7px 14px", border: `1.5px solid ${T.border}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.text, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                        <IEdit size={13} />Ver
                      </Link>

                      {ad.offers > 0 && (
                        <Link to="/ad/10/offers" style={{ padding: "7px 14px", border: `1.5px solid ${T.info}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 700, fontSize: 12, color: T.info, textDecoration: "none", backgroundColor: T.infoBg }}>
                          {ad.offers} oferta{ad.offers !== 1 ? "s" : ""}
                        </Link>
                      )}

                      <button onClick={() => toggle(ad.id)} style={{ padding: "7px 14px", border: `1.5px solid ${T.border}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.textMid, backgroundColor: "#fff", cursor: "pointer" }}>
                        {ad.status === "active" ? "Pausar" : "Reativar"}
                      </button>

                      <button onClick={() => setConfirm({ id: ad.id, action: "close" })} style={{ padding: "7px 14px", border: `1.5px solid ${T.errorBg}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.error, backgroundColor: T.errorBg, cursor: "pointer" }}>
                        Encerrar
                      </button>
                    </>
                  )}

                  {ad.status === "closed" && (
                    <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight, padding: "7px 0" }}>Encerrado em {ad.publishedAt}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm close modal */}
      {confirm && (
        <>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setConfirm(null)}>
            <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 18, color: T.text, margin: "0 0 8px" }}>Encerrar anúncio?</h3>
              <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: "0 0 20px", lineHeight: 1.5 }}>
                Esta ação encerrará o anúncio e notificará os vendedores que fizeram ofertas.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${T.border}`, borderRadius: 9, fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text, backgroundColor: "#fff", cursor: "pointer" }}>Cancelar</button>
                <button onClick={() => close(confirm.id)} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 9, fontFamily: T.font.display, fontWeight: 700, fontSize: 14, color: "#fff", backgroundColor: T.error, cursor: "pointer" }}>
                  <ICheck size={14} color="#fff" style={{ marginRight: 6 }} />Encerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
