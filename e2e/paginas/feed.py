from __future__ import annotations

import re

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base import Pagina, literal_xpath


class Feed(Pagina):
    caminho = "/"

    def hero(self):
        return self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "section[aria-labelledby='hero-titulo']")))

    def grupo(self, rotulo: str):
        return self.espera.until(
            EC.visibility_of_element_located((By.XPATH, f"//*[@role='group' and @aria-label={literal_xpath(rotulo)}]"))
        )

    def abas(self):
        return self.grupo("Tipo de anúncio")

    def chips_de_categoria(self):
        """Chips da trilha (o primeiro é "Todos"); espera as categorias da API chegarem."""
        grupo = self.grupo("Categorias")
        self.espera.until(lambda _: len(grupo.find_elements(By.TAG_NAME, "button")) > 1)
        return grupo.find_elements(By.TAG_NAME, "button")

    def filtrar_por_categoria(self, indice: int = 1) -> str:
        """Clica no chip de categoria pela posição e devolve o nome dele."""
        chip = self.chips_de_categoria()[indice]
        nome = chip.text.split("\n")[0].strip()
        chip.click()
        self.espera.until(lambda _: "categoria" in self.parametros)
        return nome

    def esperar_lista(self) -> str:
        """Espera o feed sair do carregamento e devolve o resumo ("N anúncios" ou o vazio)."""
        resumo = self.espera.until(
            lambda driver: next(
                (
                    elemento
                    for elemento in driver.find_elements(By.XPATH, "//main//h2 | //main//h3")
                    if elemento.is_displayed()
                    and (re.search(r"^\d[\d.]* anúncios?$", elemento.text) or "Nenhum anúncio" in elemento.text)
                ),
                False,
            )
        )
        return resumo.text

    def links_de_anuncios(self):
        return [
            link
            for link in self.driver.find_elements(By.CSS_SELECTOR, "main a[href^='/anuncios/']")
            if link.is_displayed() and re.match(r"^/anuncios/[^/]+$", link.get_attribute("pathname") or "")
        ]

    def abrir_primeiro_anuncio(self) -> str:
        link = self.espera.until(lambda _: next(iter(self.links_de_anuncios()), False))
        destino = link.get_attribute("pathname")
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", link)
        link.click()
        self.esperar_caminho(destino)
        return destino
