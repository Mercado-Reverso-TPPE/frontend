import { useState } from "react";
import { Link } from "react-router";
import { NOTIFICATIONS, Notification } from "../shared/data";
import { T } from "../shared/tokens";
import { IBell, IMessageCircle, ICheck, IX, IStar, IPackage } from "../shared/icons";

const TYPE_META: Record<Notification["type"], { icon: JSX.Element; color: string; bg: string }> = {
  offer:     { icon: <IPackage size={16} color="#D97338" />, color: T.primary, bg: T.pLight },
  counter:   { icon: <span style={{ fontSize: 14 }}>💱</span>, color: "#5856D6", bg: "#F0EEFF" },
  message:   { icon: <IMessageCircle size={16} color={T.info} />, color: T.info, bg: T.infoBg },
  accepted:  { icon: <ICheck size={16} color={T.success} />, color: T.success, bg: T.successBg },
  rejected:  { icon: <IX size={16} color={T.error} />, color: T.error, bg: T.errorBg },
  concluded: { icon: <span style={{ fontSize: 14 }}>🤝</span>, color: "#5856D6", bg: "#F0EEFF" },
  review:    { icon: <IStar size={16} color="#FFD60A" />, color: "#B8960A", bg: "#FFFAE0" },
};

export default function Notifications() {
  const [items, setItems] = useState(NOTIFICATIONS);

  const markAll = () => setItems(ns => ns.map(n => ({ ...n, read: true })));
  const markOne = (id: string) => setItems(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const unread = items.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 28px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 28, color: T.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Notificações</h1>
          {unread > 0 && <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid }}>{unread} não {unread === 1 ? "lida" : "lidas"}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.font.display, fontWeight: 600, fontSize: 13, color: T.primary, padding: 0 }}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <IBell size={40} color={T.border} />
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 16, color: T.text, marginTop: 12 }}>Sem notificações</div>
          <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid }}>Você está em dia!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(n => {
            const meta = TYPE_META[n.type];
            return (
              <Link
                key={n.id}
                to={n.link}
                onClick={() => markOne(n.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px",
                  backgroundColor: n.read ? "#fff" : "#FDFAF7",
                  border: `1.5px solid ${n.read ? T.border : T.pBorder}`,
                  borderRadius: 12, textDecoration: "none", transition: "all .12s",
                  position: "relative",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = n.read ? T.border : T.pBorder)}
              >
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text, marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.textLight, marginTop: 6 }}>{n.at}</div>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: T.primary, flexShrink: 0, marginTop: 6 }} />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
