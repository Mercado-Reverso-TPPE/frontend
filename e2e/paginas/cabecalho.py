from __future__ import annotations

import re

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base import Pagina

# `data-testid` primeiro; os atributos de acessibilidade valem para builds publicados
# antes de os test ids existirem.
MENU_DA_CONTA = "[data-testid='menu-da-conta'], header button[aria-haspopup='menu']"
SINO = "[data-testid='sino'], header a[href='/notificacoes']"


class Cabecalho(Pagina):
    """Cabeçalho fixo: busca global, sino, menu da conta e "Anunciar"."""

    def buscar(self, termo: str):
        campo = self.campo("Buscar anúncios")
        self.preencher("Buscar anúncios", termo)
        campo.submit()

    def _menu_da_conta(self):
        return self.espera.until(EC.presence_of_element_located((By.CSS_SELECTOR, MENU_DA_CONTA)))

    def esta_logado(self) -> bool:
        return bool(self.driver.find_elements(By.CSS_SELECTOR, MENU_DA_CONTA))

    def esperar_logado(self):
        self._menu_da_conta()
        return self

    def esperar_deslogado(self):
        self.botao("Entrar")
        return self

    def avatar(self):
        return self._menu_da_conta().find_element(By.CSS_SELECTOR, "img, [role='img']")

    def sair(self):
        self._menu_da_conta().click()
        self.clicar("Sair")
        self.esperar_deslogado()

    def nao_lidas_no_sino(self) -> int:
        rotulo = self.espera.until(EC.presence_of_element_located((By.CSS_SELECTOR, SINO))).get_attribute("aria-label") or ""
        encontrado = re.search(r"(\d+) não lidas", rotulo)
        return int(encontrado.group(1)) if encontrado else 0
