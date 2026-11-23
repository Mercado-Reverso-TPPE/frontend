from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from .base import Pagina, literal_xpath


class MeusAnuncios(Pagina):
    caminho = "/meus-anuncios"

    def item(self, titulo: str) -> WebElement:
        cabecalho = self.espera.until(
            lambda driver: driver.find_element(By.XPATH, f"//main//li//h2[normalize-space()={literal_xpath(titulo)}]")
        )
        return cabecalho.find_element(By.XPATH, "ancestor::li[1]")

    def status(self, titulo: str) -> str:
        badge = self.item(titulo).find_element(By.XPATH, ".//h2/following-sibling::*[1]")
        return badge.text.strip()

    def esperar_status(self, titulo: str, status: str):
        self.espera.until(lambda _: self.status(titulo) == status)

    def pausar(self, titulo: str):
        self.clicar("Pausar", dentro=self.item(titulo))
        self.esperar_status(titulo, "Pausado")

    def reativar(self, titulo: str):
        self.clicar("Reativar", dentro=self.item(titulo))
        self.esperar_status(titulo, "Ativo")

    def encerrar(self, titulo: str):
        self.clicar("Encerrar", dentro=self.item(titulo))
        dialogo = self.espera.until(lambda driver: driver.find_element(By.CSS_SELECTOR, "[role='dialog']"))
        self.clicar("Encerrar anúncio", dentro=dialogo)
        self.esperar_status(titulo, "Encerrado")

    def titulos_abertos(self, prefixo: str) -> list[str]:
        """Títulos com o prefixo que ainda não foram encerrados (para limpar a produção)."""
        self.espera.until(
            lambda driver: driver.find_elements(By.CSS_SELECTOR, "main ul li h2")
            or self.existe_texto("Você ainda não publicou nada")
        )
        abertos = []
        for titulo in self.driver.find_elements(
            By.XPATH, f"//main//li//h2[starts-with(normalize-space(), {literal_xpath(prefixo)})]"
        ):
            item = titulo.find_element(By.XPATH, "ancestor::li[1]")
            if item.find_elements(By.XPATH, ".//button[normalize-space()='Encerrar']"):
                abertos.append(titulo.text.strip())
        return abertos
