/**
 * Dados de demonstração.
 *
 * Única fonte de dados falsos da aplicação. Nenhuma tela deve declarar mock
 * próprio: quando o contrato da API chegar, os recursos em `api/` passam a
 * buscar de verdade e este arquivo sai de cena sem tocar nas telas.
 */

import type {
  AnyAd,
  BuyerAd,
  ChatMessage,
  HistoryItem,
  NegotiationStep,
  Notification,
  Offer,
  SellerAd,
  User,
} from "@/api/tipos";

export type {
  AnyAd,
  BuyerAd,
  ChatMessage,
  HistoryItem,
  NegotiationStep,
  Notification,
  Offer,
  SellerAd,
  User,
} from "@/api/tipos";

// ── Mock users ────────────────────────────────

export const ME: User = {
  id: "me", name: "Maria S.", initials: "MS", color: "#D97338",
  rating: 4.9, reviews: 34, city: "São Paulo", state: "SP",
  phone: "(11) 98765-4321", role: "both", joinedAt: "Mar 2024",
};

const users: Record<string, User> = {
  carlos: { id: "carlos", name: "Carlos M.", initials: "CM", color: "#D97338", rating: 4.8, reviews: 23, city: "São Paulo", state: "SP", phone: "(11) 91234-5678", role: "buyer", joinedAt: "Jan 2024" },
  ana: { id: "ana", name: "Ana P.", initials: "AP", color: "#007AFF", rating: 5.0, reviews: 8, city: "Campinas", state: "SP", phone: "(19) 99876-5432", role: "buyer", joinedAt: "Feb 2024" },
  rafael: { id: "rafael", name: "Rafael S.", initials: "RS", color: "#34C759", rating: 4.6, reviews: 41, city: "Rio de Janeiro", state: "RJ", phone: "(21) 98765-4321", role: "buyer", joinedAt: "Nov 2023" },
  marcos: { id: "marcos", name: "Marcos L.", initials: "ML", color: "#FF6B35", rating: 4.9, reviews: 15, city: "Belo Horizonte", state: "MG", phone: "(31) 99123-4567", role: "buyer", joinedAt: "Dec 2023" },
  julia: { id: "julia", name: "Julia F.", initials: "JF", color: "#9B59B6", rating: 4.7, reviews: 29, city: "Curitiba", state: "PR", phone: "(41) 98654-3210", role: "buyer", joinedAt: "Oct 2023" },
  lucas: { id: "lucas", name: "Lucas T.", initials: "LT", color: "#5856D6", rating: 4.9, reviews: 37, city: "São Paulo", state: "SP", phone: "(11) 97654-3210", role: "seller", joinedAt: "Aug 2023" },
  bruno: { id: "bruno", name: "Bruno K.", initials: "BK", color: "#FF2D55", rating: 5.0, reviews: 12, city: "São Paulo", state: "SP", phone: "(11) 96543-2109", role: "seller", joinedAt: "Sep 2023" },
  carla: { id: "carla", name: "Carla R.", initials: "CR", color: "#007AFF", rating: 4.7, reviews: 64, city: "Campinas", state: "SP", phone: "(19) 95432-1098", role: "seller", joinedAt: "Jun 2023" },
  diego: { id: "diego", name: "Diego M.", initials: "DM", color: "#34C759", rating: 4.5, reviews: 9, city: "São Paulo", state: "SP", phone: "(11) 94321-0987", role: "seller", joinedAt: "Jan 2024" },
};

// ── Mock ads ──────────────────────────────────

export const BUYER_ADS: BuyerAd[] = [
  { kind: "buyer", id: 1, title: "iPhone 15 Pro Max 256GB", description: "Procuro em ótimo estado, sem marcas na tela ou carcaça. Aceito qualquer cor, bateria acima de 85%. Com nota fiscal de preferência.", category: "Eletrônicos", budget: { min: 4200, max: 5000 }, conditionWanted: "Semi-novo", location: "São Paulo, SP", radius: 25, distance: 3.2, timeAgo: "12 min", publishedAt: "01/09/2026", offers: 7, featured: true, status: "active", buyer: users.carlos },
  { kind: "buyer", id: 2, title: "Bicicleta de Montanha 29\"", description: "Quero uma MTB em bom estado, full ou hardtail. Aro 29, freio a disco, marchas Shimano.", category: "Esportes", budget: { min: 1200, max: 2500 }, conditionWanted: "Qualquer", location: "Campinas, SP", radius: 50, distance: 8.7, timeAgo: "1 hora", publishedAt: "01/09/2026", offers: 3, status: "active", buyer: users.ana },
  { kind: "buyer", id: 3, title: "Notebook para Programação", description: "Preciso de mínimo 16GB RAM e SSD 512GB. Dell, Lenovo ou HP. Pode ser i5 última geração ou Ryzen 5.", category: "Informática", budget: { min: 2800, max: 4000 }, conditionWanted: "Semi-novo", location: "Rio de Janeiro, RJ", radius: 30, distance: 15.1, timeAgo: "2 horas", publishedAt: "01/09/2026", offers: 12, featured: true, status: "active", buyer: users.rafael },
  { kind: "buyer", id: 4, title: "PS5 com 2 Controles", description: "Busco PS5 disc edition ou digital com pelo menos 2 controles. Aceito versão slim.", category: "Games", budget: { min: 2800, max: 3500 }, conditionWanted: "Semi-novo", location: "Belo Horizonte, MG", radius: 10, distance: 5.4, timeAgo: "3 horas", publishedAt: "01/09/2026", offers: 9, urgent: true, status: "active", buyer: users.marcos },
  { kind: "buyer", id: 5, title: "Sony A7 III ou IV", description: "Procuro Sony A7 III ou A7 IV com lente 24-70mm. Estado impecável, todos os acessórios originais.", category: "Eletrônicos", budget: { min: 8000, max: 12000 }, conditionWanted: "Semi-novo", location: "Curitiba, PR", radius: 100, distance: 22.3, timeAgo: "5 horas", publishedAt: "31/08/2026", offers: 4, status: "active", buyer: users.julia },
];

export const MY_ADS: BuyerAd[] = [
  { kind: "buyer", id: 10, title: "iPhone 15 Pro Max 256GB", description: "Procuro em ótimo estado, sem marcas na tela. Aceito qualquer cor.", category: "Eletrônicos", budget: { min: 4200, max: 5000 }, conditionWanted: "Semi-novo", location: "São Paulo, SP", radius: 25, distance: 0, timeAgo: "há 1 dia", publishedAt: "31/08/2026", offers: 7, featured: true, status: "active", buyer: ME },
  { kind: "buyer", id: 11, title: "Bicicleta de Montanha 29\"", description: "Quero MTB aro 29 em bom estado com freio a disco.", category: "Esportes", budget: { min: 1200, max: 2500 }, conditionWanted: "Qualquer", location: "São Paulo, SP", radius: 50, distance: 0, timeAgo: "há 3 dias", publishedAt: "29/08/2026", offers: 3, status: "active", buyer: ME },
  { kind: "buyer", id: 12, title: "Smart TV 55\" 4K", description: "Procuro TV 55 polegadas 4K, Samsung ou LG, com HDR.", category: "Eletrônicos", budget: { min: 1200, max: 2200 }, conditionWanted: "Semi-novo", location: "São Paulo, SP", radius: 20, distance: 0, timeAgo: "há 1 semana", publishedAt: "25/08/2026", offers: 0, status: "paused", buyer: ME },
  { kind: "buyer", id: 13, title: "Fender Stratocaster", description: "Busco Strat American Standard ou Professional.", category: "Instrumentos", budget: { min: 5000, max: 8000 }, conditionWanted: "Semi-novo", location: "São Paulo, SP", radius: 50, distance: 0, timeAgo: "há 2 semanas", publishedAt: "18/08/2026", offers: 2, status: "closed", buyer: ME },
];

export const SELLER_ADS: SellerAd[] = [
  { kind: "seller", id: 101, title: "MacBook Pro 14\" M3 Pro — 18GB RAM", description: "Perfeito estado, comprado há 8 meses. Vem com caixa original, carregador MagSafe e película.", category: "Informática", price: 13500, condition: "Semi-novo", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop&auto=format", location: "São Paulo, SP", distance: 2.1, timeAgo: "30 min", views: 284, featured: true, status: "active", seller: users.lucas },
  { kind: "seller", id: 102, title: "PS5 Disc Edition + God of War Ragnarök", description: "Console em perfeito estado. Acompanha 3 jogos físicos e 2 controles DualSense.", category: "Games", price: 3200, condition: "Semi-novo", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=400&fit=crop&auto=format", location: "São Paulo, SP", distance: 4.8, timeAgo: "1 hora", views: 512, urgent: true, status: "active", seller: users.bruno },
  { kind: "seller", id: 103, title: "iPhone 14 Pro 256GB Space Black", description: "Sem marcas, bateria 91%. Na caixa original com todos os acessórios. Nota fiscal e garantia Apple.", category: "Eletrônicos", price: 4800, condition: "Semi-novo", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=400&fit=crop&auto=format", location: "Campinas, SP", distance: 7.3, timeAgo: "2 horas", views: 391, status: "active", seller: users.carla },
  { kind: "seller", id: 104, title: "Scott Scale 980 Aro 29 — 2023", description: "MTB hardtail em excelente estado. Revisada na bike shop. Grupo Shimano Deore 12v.", category: "Esportes", price: 4500, condition: "Semi-novo", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format", location: "São Paulo, SP", distance: 11.2, timeAgo: "4 horas", views: 147, status: "active", seller: users.diego },
];

export const ALL_ADS: AnyAd[] = [...BUYER_ADS, ...SELLER_ADS];

// ── Mock offers (for ad #10 — the user's iPhone ad) ──

export const MOCK_OFFERS: Offer[] = [
  { id: "o1", adId: 10, title: "iPhone 14 Pro Max 256GB", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=300&fit=crop&auto=format", description: "Em excelente estado, sem nenhum arranhão. Bateria em 93%, testada agora. Nota fiscal e caixa original.", condition: "Semi-novo", price: 4700, observations: "Tenho disponibilidade para encontro em SP capital essa semana.", location: "São Paulo, SP", distance: 2.3, status: "pending", seller: users.lucas, sentAt: "há 20 min" },
  { id: "o2", adId: 10, title: "iPhone 14 Pro Max 128GB", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop&auto=format", description: "Bem conservado, sem marcas. Bateria 88%. Desistência de compra, por isso estou vendendo.", condition: "Semi-novo", price: 4200, observations: "Pode ser parcelado no cartão pessoalmente.", location: "Campinas, SP", distance: 7.8, status: "pending", seller: users.carla, sentAt: "há 1 hora" },
  { id: "o3", adId: 10, title: "iPhone 15 256GB (não Pro)", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop&auto=format", description: "Optei por trocar meu iPhone 15 padrão. Estado excelente, 4 meses de uso apenas.", condition: "Semi-novo", price: 4900, observations: "Posso enviar fotos adicionais ou vídeo de funcionamento.", location: "São Paulo, SP", distance: 5.1, status: "countered", seller: users.bruno, sentAt: "há 3 horas" },
];

// ── Negotiation history ──────────────────────

export const NEGOTIATION: NegotiationStep[] = [
  { actor: "seller", type: "offer", value: 4700, at: "01/09 14:30" },
  { actor: "buyer", type: "counter", value: 4400, message: "O preço está um pouco acima do meu orçamento. Consegue chegar em R$ 4.400?", at: "01/09 15:10" },
  { actor: "seller", type: "counter", value: 4550, message: "Posso fazer R$ 4.550, abaixo disso fica inviável para mim.", at: "01/09 16:00" },
];

// ── Mock chat messages ───────────────────────

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: "m1", from: "them", text: "Olá! Vi que você aceitou minha oferta pelo iPhone 14 Pro Max. Podemos combinar o local de entrega?", at: "14:30" },
  { id: "m2", from: "me", text: "Oi Lucas! Sim, pode combinar. Estou disponível no centro de SP.", at: "14:35" },
  { id: "m3", from: "them", text: "Ótimo! Que tal o Metrô Paulista? Tenho disponibilidade terça-feira das 12h às 14h.", at: "14:37" },
  { id: "m4", from: "me", text: "Perfeito, terça-feira às 13h no Metrô Paulista combina bem. Vou levar o dinheiro em espécie ou prefere PIX?", at: "14:40" },
  { id: "m5", from: "them", text: "PIX é ótimo para mim! Vou levar o carregador original, a caixa e a nota fiscal também.", at: "14:42" },
  { id: "m6", from: "me", text: "Perfeito! Obrigada Lucas. Até terça então 👍", at: "14:43" },
];

// ── Mock notifications ───────────────────────

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "offer", title: "Nova oferta recebida", body: "Lucas T. fez uma oferta de R$ 4.700 no seu anúncio de iPhone 15 Pro Max.", at: "há 20 min", read: false, link: "/anuncios/10/ofertas" },
  { id: "n2", type: "counter", title: "Contraproposta recebida", body: "Bruno K. respondeu sua contraproposta: R$ 4.550.", at: "há 1 hora", read: false, link: "/anuncios/10/ofertas/o3/contraproposta" },
  { id: "n3", type: "message", title: "Nova mensagem de Lucas T.", body: "Que tal o Metrô Paulista? Tenho disponibilidade terça-feira.", at: "há 2 horas", read: false, link: "/negociacoes/chat1" },
  { id: "n4", type: "accepted", title: "Oferta aceita!", body: "Sua oferta para o Notebook foi aceita por Rafael S.", at: "há 1 dia", read: true, link: "/negociacoes/chat2" },
  { id: "n5", type: "offer", title: "Nova oferta recebida", body: "Carla R. fez uma oferta de R$ 4.200 no seu anúncio de iPhone 15.", at: "há 1 dia", read: true, link: "/anuncios/10/ofertas" },
  { id: "n6", type: "review", title: "Nova avaliação recebida", body: "Diego M. avaliou sua negociação com nota 5 estrelas.", at: "há 3 dias", read: true, link: "/perfil" },
  { id: "n7", type: "concluded", title: "Negociação concluída", body: "A negociação da Bicicleta Scott foi marcada como concluída.", at: "há 5 dias", read: true, link: "/historico" },
];

// ── History items ────────────────────────────

export const HISTORY: HistoryItem[] = [
  { id: "h1", kind: "buy", product: "MacBook Pro 14\" M3 Pro", person: "Lucas T.", personColor: "#5856D6", personInitials: "LT", value: 13500, date: "15/08/2026", status: "concluded" },
  { id: "h2", kind: "sell", product: "iPad Air 5ª geração", person: "Ana P.", personColor: "#007AFF", personInitials: "AP", value: 2800, date: "02/08/2026", status: "concluded" },
  { id: "h3", kind: "buy", product: "PS4 Pro + 5 jogos", person: "Bruno K.", personColor: "#FF2D55", personInitials: "BK", value: 1600, date: "20/07/2026", status: "concluded" },
  { id: "h4", kind: "closed", product: "Smart TV 65\" QLED", person: "Diego M.", personColor: "#34C759", personInitials: "DM", value: 3800, date: "10/07/2026", status: "cancelled" },
  { id: "h5", kind: "sell", product: "AirPods Pro 2ª geração", person: "Carlos M.", personColor: "#D97338", personInitials: "CM", value: 1200, date: "01/07/2026", status: "concluded" },
];

export const CATEGORIES = [
  { id: "all", label: "Todos", count: 3291 },
  { id: "Eletrônicos", label: "Eletrônicos", count: 641 },
  { id: "Veículos", label: "Veículos", count: 334 },
  { id: "Informática", label: "Informática", count: 402 },
  { id: "Games", label: "Games", count: 189 },
  { id: "Esportes", label: "Esportes", count: 276 },
  { id: "Casa & Jardim", label: "Casa & Jardim", count: 315 },
  { id: "Instrumentos", label: "Instrumentos", count: 87 },
  { id: "Outros", label: "Outros", count: 186 },
];
