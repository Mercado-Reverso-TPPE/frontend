from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from .base import Pagina


class CriarAnuncio(Pagina):
    caminho = "/anunciar"

    def escolher_quero_comprar(self):
        """Quando a tela pergunta o tipo do anúncio, escolhe "Quero Comprar"."""
        opcoes = self.driver.find_elements(
            By.XPATH, "//*[(self::button or self::label or self::a) and contains(normalize-space(), 'Quero Comprar')]"
        )
        if opcoes:
            opcoes[0].click()
        return self

    def publicar(self, titulo: str, descricao: str, minimo: str = "100", maximo: str = "200"):
        self.escolher_quero_comprar()
        self.preencher("Título", titulo)
        categoria = Select(self.campo("Categoria"))
        valores = [opcao.get_attribute("value") for opcao in categoria.options if opcao.get_attribute("value")]
        categoria.select_by_value(valores[0])
        self.preencher("Descrição", descricao)
        self.preencher("Mínimo (R$)", minimo)
        self.preencher("Máximo (R$)", maximo)
        self.clicar("Publicar anúncio")
        self.esperar_caminho("/meus-anuncios")
        return self
