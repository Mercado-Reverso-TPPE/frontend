from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base import Pagina
from .cabecalho import Cabecalho


class Entrar(Pagina):
    caminho = "/entrar"

    def entrar(self, email: str, senha: str):
        self.preencher("E-mail", email)
        self.preencher("Senha", senha)
        formulario = self.campo("Senha").find_element(By.XPATH, "ancestor::form")
        self.clicar("Entrar", dentro=formulario)
        return self

    def entrar_e_esperar(self, email: str, senha: str):
        self.entrar(email, senha)
        Cabecalho(self.driver, self.base_url).esperar_logado()
        return self

    def mensagem_de_erro(self) -> str:
        alerta = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']")))
        return alerta.text.strip()
