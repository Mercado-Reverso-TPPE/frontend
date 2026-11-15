from __future__ import annotations

from selenium.webdriver.common.by import By

from .base import Pagina

TITULO_DA_VISUALIZACAO = "Informações pessoais"
TITULO_DA_EDICAO = "Dados pessoais"


class Perfil(Pagina):
    """Abre em modo de visualização; "Editar" troca para os formulários."""

    caminho = "/perfil"

    def _titulo_presente(self, texto: str) -> bool:
        return any(
            elemento.is_displayed()
            for elemento in self.driver.find_elements(By.XPATH, f"//h2[normalize-space()='{texto}']")
        )

    def abrir_edicao(self):
        self.espera.until(
            lambda _: self._titulo_presente(TITULO_DA_VISUALIZACAO) or self._titulo_presente(TITULO_DA_EDICAO)
        )
        if not self._titulo_presente(TITULO_DA_EDICAO):
            self.clicar("Editar")
        self.titulo(TITULO_DA_EDICAO, nivel="h2")
        return self

    def esperar_visualizacao(self):
        self.titulo(TITULO_DA_VISUALIZACAO, nivel="h2")
        return self

    def telefone(self) -> str:
        """Valor do campo no formulário de edição."""
        return self.campo("Telefone / WhatsApp").get_attribute("value") or ""

    def telefone_exibido(self) -> str:
        """Telefone mostrado na visualização ("—" quando vazio)."""
        self.esperar_visualizacao()
        valor = self.driver.find_element(
            By.XPATH, "//span[normalize-space()='TELEFONE']/following-sibling::span[1]"
        )
        return valor.text.strip()

    def salvar_telefone(self, telefone: str):
        """Salva o telefone; ao salvar, a tela volta para a visualização com o valor novo."""
        self.abrir_edicao()
        self.preencher("Telefone / WhatsApp", telefone)
        self.clicar("Salvar dados pessoais")
        self.espera.until(lambda _: self._titulo_presente(TITULO_DA_VISUALIZACAO))
        self.espera.until(lambda _: self.telefone_exibido() == (telefone or "—"))
