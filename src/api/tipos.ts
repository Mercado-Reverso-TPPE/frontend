/**
 * Tipos do domínio do Quero.
 *
 * Espelham o contrato da API. Enquanto o contrato oficial não é publicado,
 * estes tipos descrevem o que as telas consomem e servem de alvo para os
 * dados de demonstração em `dados/demo.ts`.
 */

export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  rating: number;
  reviews: number;
  city: string;
  state: string;
  phone: string;
  role: "buyer" | "seller" | "both";
  joinedAt: string;
  /** Presentes no perfil da própria pessoa, vindos de `GET /perfil`. */
  email?: string;
  photo?: string;
}

export interface BuyerAd {
  kind: "buyer";
  id: number;
  title: string;
  description: string;
  category: string;
  budget: { min: number; max: number };
  conditionWanted: string;
  location: string;
  radius: number;
  distance: number;
  timeAgo: string;
  publishedAt: string;
  offers: number;
  urgent?: boolean;
  featured?: boolean;
  status: "active" | "paused" | "closed";
  buyer: User;
}

export interface SellerAd {
  kind: "seller";
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: "Novo" | "Semi-novo" | "Usado";
  image: string;
  location: string;
  distance: number;
  timeAgo: string;
  views: number;
  urgent?: boolean;
  featured?: boolean;
  status: "active" | "paused" | "closed";
  seller: User;
}

export type AnyAd = BuyerAd | SellerAd;

export interface Offer {
  id: string;
  adId: number;
  title: string;
  image: string;
  description: string;
  condition: "Novo" | "Semi-novo" | "Usado";
  price: number;
  observations: string;
  location: string;
  distance: number;
  status: "pending" | "accepted" | "rejected" | "countered";
  seller: User;
  sentAt: string;
}

export interface NegotiationStep {
  actor: "buyer" | "seller";
  type: "offer" | "counter" | "accept" | "reject";
  value: number;
  message?: string;
  at: string;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  at: string;
}

export interface Notification {
  id: string;
  type: "offer" | "counter" | "message" | "accepted" | "rejected" | "concluded" | "review";
  title: string;
  body: string;
  at: string;
  read: boolean;
  link: string;
}

export interface HistoryItem {
  id: string;
  kind: "buy" | "sell" | "closed";
  product: string;
  person: string;
  personColor: string;
  personInitials: string;
  value: number;
  date: string;
  status: "concluded" | "cancelled";
}

