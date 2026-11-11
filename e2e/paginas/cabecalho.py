from __future__ import annotations

import re

from selenium.webdriver.common.by import By

from .base import Pagina


class Cabecalho(Pagina):
    """Cabeçalho fixo: busca global, sino, menu da conta e "Anunciar"."""

    def buscar(self, termo: str):
        campo = self.campo("Buscar anúncios")
        self.preencher("Buscar anúncios", termo)
        campo.submit()

    def esta_logado(self) -> bool:
        return bool(self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='menu-da-conta']"))

    def esperar_logado(self):
        self.por_testid("menu-da-conta")
        return self

    def esperar_deslogado(self):
        self.botao("Entrar")
        return self

    def avatar(self):
        return self.por_testid("menu-da-conta").find_element(By.CSS_SELECTOR, "img, [role='img']")

    def sair(self):
        self.por_testid("menu-da-conta").click()
        self.clicar("Sair")
        self.esperar_deslogado()

    def nao_lidas_no_sino(self) -> int:
        rotulo = self.por_testid("sino").get_attribute("aria-label") or ""
        encontrado = re.search(r"(\d+) não lidas", rotulo)
        return int(encontrado.group(1)) if encontrado else 0
