from __future__ import annotations

from .base import Pagina


class Historico(Pagina):
    caminho = "/historico"

    def esperar_carregar(self):
        self.titulo("Histórico", nivel="h1")
        return self
