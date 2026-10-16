import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { BUYER_ADS, SELLER_ADS, CATEGORIES, BuyerAd, SellerAd } from "../shared/data";
import { T, catColor, fmtRange, fmtPrice } from "../shared/tokens";
import { ISearch, IPin, IStar, ITag, IEye, IPlus, IChevronLeft, IChevronRight, IChevronDown } from "../shared/icons";

type AnyAd = BuyerAd | SellerAd;

// ── Avatar ────────────────────────────────────
function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: size * 0.34, color: "#fff" }}>{initials}</span>
    </div>
  );
}

// ── Buyer card ────────────────────────────────
function BuyerCard({ ad }: { ad: BuyerAd }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const cc = catColor(ad.category);
  return (
    <article onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => navigate(`/ad/${ad.id}`)}
      style={{ backgroundColor: "#fff", border: `1.5px solid ${hovered ? T.primary : T.border}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .15s", boxShadow: hovered ? `0 8px 32px rgba(217,115,56,.10)` : T.shadow.sm, transform: hovered ? "translateY(-2px)" : "none", position: "relative", overflow: "hidden" }}>
      {ad.featured && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#D97338,#F59A5B)" }} />}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, backgroundColor: T.infoBg, color: T.info, fontSize: 11, fontFamily: T.font.display, fontWeight: 600 }}>🛒 Procurando</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 20, backgroundColor: `${cc}15`, color: cc, fontSize: 11, fontFamily: T.font.display, fontWeight: 600 }}><ITag size={10} color={cc} />{ad.category}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: T.font.body, color: T.textLight }}>{ad.timeAgo}</span>
      </div>

      <h2 style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 15, color: T.text, margin: 0, lineHeight: 1.3, letterSpacing: "-0.2px" }}>{ad.title}</h2>
      <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ad.description}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", backgroundColor: T.successBg, borderRadius: 8, border: `1px solid ${T.successBorder}` }}>
        <span style={{ fontSize: 11, color: "#2A9449", fontFamily: T.font.body, fontWeight: 500 }}>Orçamento</span>
        <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 14, color: "#1A7A38" }}>{fmtRange(ad.budget.min, ad.budget.max)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <IPin /><span style={{ fontSize: 12, fontFamily: T.font.body, color: T.textLight, fontWeight: 500 }}>{ad.location}</span>
        <span style={{ marginLeft: 4, padding: "1px 7px", backgroundColor: T.bgMuted, borderRadius: 10, fontSize: 11, color: T.textMid, border: `1px solid ${T.border}`, fontWeight: 500 }}>{ad.distance} km</span>
      </div>

      <div style={{ height: 1, backgroundColor: "#F0F0F0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={ad.buyer.initials} color={ad.buyer.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.text }}>{ad.buyer.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
            <IStar size={11} /><span style={{ fontSize: 11, fontFamily: T.font.body, color: T.textMid }}>{ad.buyer.rating.toFixed(1)} · {ad.buyer.reviews} av.</span>
          </div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 16, color: ad.offers >= 5 ? T.primary : T.text, lineHeight: 1 }}>{ad.offers}</div>
          <div style={{ fontSize: 10, fontFamily: T.font.body, color: T.textLight, textTransform: "uppercase" }}>oferta{ad.offers !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); navigate(`/ad/${ad.id}/offer`); }} style={{ padding: "7px 14px", backgroundColor: hovered ? T.primary : T.bgMuted, color: hovered ? "#fff" : T.text, border: `1.5px solid ${hovered ? T.primary : T.border}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .15s", flexShrink: 0 }}>
          Ofertar
        </button>
      </div>
    </article>
  );
}

// ── Seller card ───────────────────────────────
function SellerCard({ ad }: { ad: SellerAd }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const cc = catColor(ad.category);
  const condColor = ad.condition === "Novo" ? T.success : ad.condition === "Semi-novo" ? T.info : "#FF9500";

  return (
    <article onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => navigate(`/ad/${ad.id}`)}
      style={{ backgroundColor: "#fff", border: `1.5px solid ${hovered ? T.primary : T.border}`, borderRadius: 14, display: "flex", overflow: "hidden", cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .15s", boxShadow: hovered ? "0 8px 32px rgba(217,115,56,.10)" : T.shadow.sm, transform: hovered ? "translateY(-2px)" : "none", position: "relative", minHeight: 190 }}>
      {ad.featured && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,#D97338,#F59A5B)", zIndex: 2 }} />}

      <div style={{ width: 190, minWidth: 190, flexShrink: 0, position: "relative", backgroundColor: T.bgMuted, overflow: "hidden" }}>
        <img src={ad.image} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s", transform: hovered ? "scale(1.04)" : "scale(1)" }} />
        <div style={{ position: "absolute", bottom: 7, left: 7, padding: "2px 8px", backgroundColor: `${condColor}22`, border: `1px solid ${condColor}55`, borderRadius: 10, fontSize: 10, color: condColor, fontFamily: T.font.display, fontWeight: 700, backdropFilter: "blur(4px)" }}>{ad.condition}</div>
      </div>

      <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, backgroundColor: T.pLight, color: T.primary, fontSize: 11, fontFamily: T.font.display, fontWeight: 600 }}>🏷️ Vendendo</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 20, backgroundColor: `${cc}15`, color: cc, fontSize: 11, fontFamily: T.font.display, fontWeight: 600 }}><ITag size={10} color={cc} />{ad.category}</span>
          <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: T.font.body, color: T.textLight }}>{ad.timeAgo}</span>
        </div>
        <h2 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.text, margin: 0, lineHeight: 1.3, letterSpacing: "-0.3px" }}>{ad.title}</h2>
        <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>{ad.description}</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 20, color: T.primary }}>{fmtPrice(ad.price)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><IPin /><span style={{ fontSize: 11, color: T.textLight }}>{ad.distance} km</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><IEye /><span style={{ fontSize: 11, color: T.textLight }}>{ad.views}</span></div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid #F0F0F0`, paddingTop: 10 }}>
          <Avatar initials={ad.seller.initials} color={ad.seller.color} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.text }}>{ad.seller.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><IStar size={11} /><span style={{ fontSize: 11, color: T.textMid }}>{ad.seller.rating.toFixed(1)}</span></div>
          </div>
          <button onClick={e => { e.stopPropagation(); navigate(`/ad/${ad.id}/offer`); }} style={{ padding: "7px 16px", backgroundColor: hovered ? T.primary : T.bgMuted, color: hovered ? "#fff" : T.text, border: `1.5px solid ${hovered ? T.primary : T.border}`, borderRadius: 8, fontFamily: T.font.display, fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .15s", flexShrink: 0 }}>
            Ofertar
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Compact carousel card ─────────────────────
function CompactCard({ ad }: { ad: AnyAd }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isBuyer = ad.kind === "buyer";
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => navigate(`/ad/${ad.id}`)}
      style={{ width: 210, flexShrink: 0, borderRadius: 12, overflow: "hidden", border: `1.5px solid ${hovered ? T.primary : T.border}`, backgroundColor: "#fff", cursor: "pointer", boxShadow: hovered ? "0 6px 20px rgba(217,115,56,.12)" : T.shadow.sm, transition: "all .15s" }}>
      <div style={{ height: 120, backgroundColor: T.bgMuted, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isBuyer
          ? <div style={{ textAlign: "center" }}><span style={{ fontSize: 32 }}>🛒</span><div style={{ fontSize: 10, fontFamily: T.font.display, fontWeight: 600, color: T.info, marginTop: 4 }}>Procurando</div></div>
          : <img src={(ad as SellerAd).image} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s", transform: hovered ? "scale(1.05)" : "scale(1)" }} />}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 12, color: T.text, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6 }}>{ad.title}</div>
        <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 14, color: isBuyer ? "#1A7A38" : T.primary }}>
          {isBuyer ? fmtRange((ad as BuyerAd).budget.min, (ad as BuyerAd).budget.max) : fmtPrice((ad as SellerAd).price)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}><IPin size={11} color={T.textLight} /><span style={{ fontSize: 10, color: T.textLight }}>{ad.distance} km · {ad.location.split(",")[0]}</span></div>
      </div>
    </div>
  );
}

// ── Carousel section ──────────────────────────
function CarouselSection({ title, subtitle, icon, ads, accent = T.primary }: { title: string; subtitle: string; icon: string; ads: AnyAd[]; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: "left" | "right") => ref.current?.scrollBy({ left: d === "right" ? 240 : -240, behavior: "smooth" });
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 20, backgroundColor: accent, borderRadius: 2 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 17, color: T.text, letterSpacing: "-0.3px" }}>{title}</span></div>
            <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight, marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["left","right"] as const).map(d => (
            <button key={d} onClick={() => scroll(d)} style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${T.border}`, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {d === "left" ? <IChevronLeft size={15} /> : <IChevronRight size={15} />}
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
        {ads.map((a, i) => <CompactCard key={`${a.kind}-${a.id}-${i}`} ad={a} />)}
      </div>
    </section>
  );
}

// ── Announce banner ───────────────────────────
function AnnounceBanner() {
  return (
    <Link to="/create-ad" style={{ borderRadius: 16, background: "linear-gradient(135deg,#D97338 0%,#C4622B 100%)", padding: "26px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", boxShadow: "0 8px 24px rgba(217,115,56,.28)", textDecoration: "none" }}>
      <div>
        <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: "-0.4px", marginBottom: 6 }}>Não achou o que queria?</div>
        <div style={{ fontFamily: T.font.body, fontSize: 14, color: "rgba(255,255,255,.82)", lineHeight: 1.5 }}>Publique sua demanda e deixe os vendedores te encontrarem. É grátis.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", backgroundColor: "#fff", borderRadius: 10, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, color: T.primary, flexShrink: 0 }}>
        <IPlus color={T.primary} />Anunciar agora
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────
const ALL_ADS: AnyAd[] = [...BUYER_ADS, ...SELLER_ADS];
const RECOMMENDED: AnyAd[] = [BUYER_ADS[0], SELLER_ADS[0], BUYER_ADS[2], SELLER_ADS[1], BUYER_ADS[4], SELLER_ADS[2]];
const LOCAL_ADS: AnyAd[] = [SELLER_ADS[0], BUYER_ADS[1], SELLER_ADS[3], BUYER_ADS[3], SELLER_ADS[1]];
const USER_CITY = "São Paulo, SP";
const USER_TAGS = ["Eletrônicos", "Informática", "Games"];

export default function Home() {
  const [adKind, setAdKind] = useState<"all" | "buyer" | "seller">("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  const filtered = ALL_ADS.filter(ad => {
    if (adKind === "buyer" && ad.kind !== "buyer") return false;
    if (adKind === "seller" && ad.kind !== "seller") return false;
    if (activeCategory !== "all" && ad.category !== activeCategory) return false;
    const q = search.toLowerCase();
    return q === "" || ad.title.toLowerCase().includes(q) || ad.description.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "distance") return a.distance - b.distance;
    if (sort === "price_high") { const pa = a.kind === "seller" ? a.price : a.budget.max; const pb = b.kind === "seller" ? b.price : b.budget.max; return pb - pa; }
    return a.id - b.id;
  });

  const chunk1 = sorted.slice(0, 6);
  const chunk2 = sorted.slice(6);

  function AdCard({ ad }: { ad: AnyAd }) {
    return ad.kind === "buyer" ? <BuyerCard ad={ad} /> : <SellerCard ad={ad} />;
  }
  function AdGrid({ ads }: { ads: AnyAd[] }) {
    if (!ads.length) return null;
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>{ads.map(a => <AdCard key={`${a.kind}-${a.id}`} ad={a} />)}</div>;
  }

  const KindTab = ({ value, label }: { value: typeof adKind; label: string }) => (
    <button onClick={() => setAdKind(value)} style={{ padding: "8px 18px", borderRadius: 9, border: "none", backgroundColor: adKind === value ? T.text : "transparent", color: adKind === value ? "#fff" : T.textMid, fontFamily: T.font.display, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* Hero strip */}
      <div style={{ background: "linear-gradient(135deg,#FDF3EC 0%,#FEF8F5 60%,#fff 100%)", borderBottom: `1px solid #F0E4D8`, padding: "24px 0" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>

            <h1 style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 26, color: T.text, margin: "0 0 8px", letterSpacing: "-0.7px", lineHeight: 1.2 }}>
              Você anuncia o que quer.<br /><span style={{ color: T.primary }}>Os vendedores te encontram.</span>
            </h1>
            <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0, lineHeight: 1.6 }}>Publique sua demanda gratuitamente e receba ofertas de vendedores próximos a você.</p>
          </div>
          <div style={{ display: "flex", flexShrink: 0 }}>
            {[{ v: "2.847", l: "anúncios ativos", i: "📋" }, { v: "314", l: "cidades cobertas", i: "🏙️" }, { v: "18,4k", l: "vendedores", i: "🤝" }].map((s, i) => (
              <div key={s.l} style={{ textAlign: "center", padding: "12px 22px", borderLeft: i > 0 ? `1px solid #F0DDD0` : "none" }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{s.i}</div>
                <div style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 20, color: T.primary, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.textLight, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ backgroundColor: "#fff", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 64, zIndex: 40 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 0 6px", borderBottom: `1px solid #F4F4F4`, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, backgroundColor: T.bgMuted, borderRadius: 12, padding: 3 }}>
              <KindTab value="all" label="🌐 Todos" />
              <KindTab value="buyer" label="🛒 Procurando" />
              <KindTab value="seller" label="🏷️ Vendendo" />
            </div>
            <div style={{ height: 18, width: 1, backgroundColor: T.border, margin: "0 6px" }} />
            <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.textLight }}>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${isActive ? T.primary : T.border}`, backgroundColor: isActive ? T.pLight : "#fff", color: isActive ? T.primary : T.textMid, fontFamily: T.font.display, fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", transition: "all .12s" }}>
                  {cat.label}
                  <span style={{ backgroundColor: isActive ? T.primary : "#F0F0F0", color: isActive ? "#fff" : T.textLight, borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>
                    {cat.count >= 1000 ? `${(cat.count / 1000).toFixed(1)}k` : cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main feed */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 28px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: T.font.display, fontWeight: 700, fontSize: 18, color: T.text }}>{sorted.length} anúncio{sorted.length !== 1 ? "s" : ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: T.font.body, fontSize: 13, color: T.textLight }}>Ordenar:</span>
            <div style={{ position: "relative" }}>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "7px 28px 7px 12px", border: `1.5px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font.display, fontWeight: 600, color: T.text, backgroundColor: "#fff", cursor: "pointer", outline: "none", appearance: "none" }}>
                <option value="recent">Mais recentes</option>
                <option value="distance">Mais próximos</option>
                <option value="price_high">Maior valor</option>
              </select>
              <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><IChevronDown color={T.textMid} /></div>
            </div>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontFamily: T.font.display, fontWeight: 600, fontSize: 18, color: T.text, marginBottom: 8 }}>Nenhum anúncio encontrado</div>
            <p style={{ fontFamily: T.font.body, fontSize: 14, color: T.textMid, margin: 0 }}>Tente mudar os filtros</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <AdGrid ads={chunk1} />
            <CarouselSection title="Recomendados para você" subtitle={`Baseado nos seus interesses: ${USER_TAGS.join(", ")}`} icon="🎯" ads={RECOMMENDED} />
            <AnnounceBanner />
            {chunk2.length > 0 && <AdGrid ads={chunk2} />}
            <CarouselSection title={`Perto de você · ${USER_CITY}`} subtitle="Anúncios na sua cidade para negociar com facilidade" icon="📍" ads={LOCAL_ADS} accent={T.info} />
            <div style={{ textAlign: "center" }}>
              <button style={{ padding: "12px 40px", border: `1.5px solid ${T.border}`, borderRadius: 10, backgroundColor: "#fff", fontFamily: T.font.display, fontWeight: 600, fontSize: 14, color: T.text, cursor: "pointer" }}>
                Carregar mais anúncios
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <Link to="/create-ad" style={{ position: "fixed", bottom: 28, right: 28, zIndex: 100, display: "flex", alignItems: "center", gap: 8, padding: "14px 22px", background: "linear-gradient(135deg,#E8803F,#D97338)", color: "#fff", border: "none", borderRadius: 50, fontFamily: T.font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 24px rgba(217,115,56,.45)", textDecoration: "none" }}>
        <IPlus size={18} color="#fff" />Anunciar
      </Link>
    </div>
  );
}
