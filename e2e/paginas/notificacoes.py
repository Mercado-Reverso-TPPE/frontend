from __future__ import annotations

from selenium.webdriver.common.by import By

from .base import Pagina
from .cabecalho import Cabecalho


class Notificacoes(Pagina):
    caminho = "/notificacoes"

    def esperar_carregar(self):
        self.titulo("Notificações", nivel="h1")
        self.espera.until(
            lambda driver: driver.find_elements(By.XPATH, "//*[@role='status' and (contains(., 'não lida') or contains(., 'Tudo lido'))]")
            or self.existe_texto("Nenhuma notificação por aqui")
        )
        return self

    def marcar_todas_como_lidas(self):
        botoes = self.driver.find_elements(By.XPATH, "//button[normalize-space()='Marcar todas como lidas']")
        if botoes:
            botoes[0].click()
        cabecalho = Cabecalho(self.driver, self.base_url)
        self.espera.until(lambda _: cabecalho.nao_lidas_no_sino() == 0)
