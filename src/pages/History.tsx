import { useState } from "react";
import { HISTORY } from "../shared/data";
import { T, fmtPrice } from "../shared/tokens";
import { ICheck, IX } from "../shared/icons";

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

type Tab = "all" | "buy" | "sell" | "closed";

export default function History() {
  const [tab, setTab] = useState<Tab>("all");

  const filtered = HISTORY.filter(h => tab === "all" || h.kind === tab);

  const concluded = HISTORY.filter(h => h.status === "concluded").length;
  const totalValue = HISTORY.filter(h => h.status === "concluded").reduce((a, h) => a + h.value, 0);

  const Pill = ({ value, label }: { value: Tab; label: string }) => (
    <button onClick={() => setTab(value)} style={{
      padding: "7px 16px", borderRadius: 20,
      border: `1.5px solid ${tab === value ? T.primary : T.border}`,
      backgroundColor: tab === value ? T.pLight : "#fff",
      color: tab === value ? T.primary : T.textMid,
      fontFamily: T.font.display, fontWeight: tab === value ? 700 : 500, fontSize: 13,
      cursor: "pointer", whiteSpace: "nowrap",
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 28px 60px" }}>
      <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 24px", letterSpacing: "-0.5px" }}>Histórico</h1>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Negociações concluídas", value: concluded, color: T.success, bg: T.successBg },
          { label: "Volume negociado", value: fmtPrice(totalValue), color: T.primary, bg: T.pLight },
          { label: "Total de negociações", value: HISTORY.length, color: T.info, bg: T.infoBg },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg, border: `1px solid ${s.color}22`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", scrollbarWidth: "none" }}>
        <Pill value="all" label="Todos" />
        <Pill value="buy" label="🛒 Compras" />
        <Pill value="sell" label="🏷️ Vendas" />
        <Pill value="closed" label="❌ Encerradas" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: T.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 16, color: T.text }}>Nenhum item nesta categoria</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, backgroundColor: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <Avatar initials={h.personInitials} color={h.personColor} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text, marginBottom: 2 }}>{h.product}</div>
                <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid }}>
                  {h.kind === "buy" ? "Comprado de" : h.kind === "sell" ? "Vendido para" : "Com"} {h.person} · {h.date}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: h.kind === "buy" ? T.primary : T.success, marginBottom: 4 }}>
                  {h.kind === "buy" ? "-" : "+"}{fmtPrice(h.value)}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, backgroundColor: h.status === "concluded" ? T.successBg : T.errorBg, border: `1px solid ${h.status === "concluded" ? T.successBorder : "#FFD0CE"}` }}>
                  {h.status === "concluded" ? <ICheck size={11} color={T.success} /> : <IX size={11} color={T.error} />}
                  <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 10, color: h.status === "concluded" ? T.success : T.error }}>
                    {h.status === "concluded" ? "Concluído" : "Cancelado"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
