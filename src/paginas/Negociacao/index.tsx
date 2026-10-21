import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { CHAT_MESSAGES, MOCK_OFFERS } from "@/dados/demo";
import { T } from "@/estilos/tokens";
import { fmtPrice } from "@/utils/formato";
import { IStar, IArrowLeft, ISend, IMessageCircle } from "@/componentes/icones";

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

interface Msg { id: string; from: "me" | "them"; text: string; at: string; }

export default function Negociacao() {
  const navigate = useNavigate();
  const offer = MOCK_OFFERS[0];
  const seller = offer.seller;
  const [messages, setMessages] = useState<Msg[]>(CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    setMessages(m => [...m, { id: `m${Date.now()}`, from: "me", text: input.trim(), at: time }]);
    setInput("");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 0 0", display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>

      {/* Chat header */}
      <div style={{ backgroundColor: "#fff", borderBottom: `1px solid ${T.border}`, padding: "16px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMid, padding: 0, display: "flex" }}>
            <IArrowLeft size={20} />
          </button>

          <Avatar initials={seller.initials} color={seller.color} size={40} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text }}>{seller.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <IStar size={11} />
              <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textMid }}>{seller.rating.toFixed(1)} · {seller.city}</span>
            </div>
          </div>

          {/* Context: product + value */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <img src={offer.image} alt={offer.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.primary }}>{fmtPrice(offer.price)}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: T.success }} />
                <span style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 10, color: T.success }}>Aceito</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product strip */}
        <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: T.bgMuted, borderRadius: 10, fontFamily: T.font.body, fontSize: 12, color: T.textMid }}>
          <strong style={{ color: T.text }}>{offer.title}</strong> · {offer.condition} · {offer.location}
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, backgroundColor: "#FAFAFA" }}>
        {/* Date label */}
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "inline-block", padding: "4px 12px", backgroundColor: "#E8E8E8", borderRadius: 10, fontFamily: T.font.body, fontSize: 11, color: T.textMid }}>Hoje</span>
        </div>

        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
            {msg.from === "them" && <Avatar initials={seller.initials} color={seller.color} size={28} />}

            <div style={{ maxWidth: "72%" }}>
              <div style={{
                padding: "12px 16px",
                backgroundColor: msg.from === "me" ? T.primary : "#fff",
                color: msg.from === "me" ? "#fff" : T.text,
                borderRadius: msg.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                boxShadow: T.shadow.sm,
                fontFamily: T.font.body,
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
              <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.textLight, marginTop: 4, textAlign: msg.from === "me" ? "right" : "left" }}>
                {msg.at}
              </div>
            </div>

            {msg.from === "me" && <Avatar initials="MS" color={T.primary} size={28} />}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Conclude CTA */}
      <div style={{ backgroundColor: "#fff", borderTop: `1px solid ${T.border}`, padding: "10px 24px 6px", display: "flex", justifyContent: "center" }}>
        <Link to="/negociacoes/chat1/concluir" style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.textMid, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
          🤝 Finalizar negociação
        </Link>
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ backgroundColor: "#fff", borderTop: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          style={{ flex: 1, padding: "12px 16px", border: `1.5px solid ${T.border}`, borderRadius: 24, fontSize: 14, fontFamily: T.font.body, color: T.text, outline: "none", transition: "border-color .15s", backgroundColor: T.bgMuted }}
          onFocus={e => (e.target.style.borderColor = T.primary)}
          onBlur={e => (e.target.style.borderColor = T.border)}
        />
        <button type="submit" disabled={!input.trim()}
          style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: input.trim() ? T.primary : T.bgMuted, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "not-allowed", transition: "background-color .15s", flexShrink: 0 }}>
          <ISend size={17} color={input.trim() ? "#fff" : T.textLight} />
        </button>
      </form>
    </div>
  );
}
