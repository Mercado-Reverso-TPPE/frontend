from __future__ import annotations

from selenium.webdriver.common.by import By

from .base import Pagina


class Perfil(Pagina):
    caminho = "/perfil"

    def abrir_edicao(self):
        """O perfil pode abrir em modo de visualização; nesse caso, clica em "Editar"."""
        self.titulo("Dados pessoais", nivel="h2")
        botoes = self.driver.find_elements(
            By.XPATH, "//button[normalize-space()='Editar' or normalize-space()='Editar perfil']"
        )
        if botoes and botoes[0].is_displayed():
            botoes[0].click()
        return self

    def telefone(self) -> str:
        return self.campo("Telefone / WhatsApp").get_attribute("value") or ""

    def salvar_telefone(self, telefone: str):
        self.abrir_edicao()
        self.preencher("Telefone / WhatsApp", telefone)
        self.clicar("Salvar dados pessoais")
        self.texto_visivel("Dados pessoais salvos.")
