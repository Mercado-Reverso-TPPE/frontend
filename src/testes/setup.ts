import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { definirTokenDeAcesso } from "@/api/cliente";
import { reiniciarDemoDeMeusAnuncios } from "@/api/meusAnuncios";
import { reiniciarDemoDeOfertas } from "@/api/ofertas";

// A sessão guarda o token de renovação no sessionStorage e o de acesso no
// módulo do cliente; nenhum teste pode herdar a sessão nem a API falsa do anterior.
afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  definirTokenDeAcesso(null);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  reiniciarDemoDeMeusAnuncios();
  reiniciarDemoDeOfertas();
});
