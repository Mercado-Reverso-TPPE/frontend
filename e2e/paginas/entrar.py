from __future__ import annotations

import time

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base import Pagina
from .cabecalho import Cabecalho

# O backend aceita 5 `POST /sessoes` por minuto; passado o limite, espera a janela virar.
ESPERA_DO_LIMITE_DE_LOGIN = 61


class Entrar(Pagina):
    caminho = "/entrar"

    def entrar(self, email: str, senha: str):
        self.preencher("E-mail", email)
        self.preencher("Senha", senha)
        formulario = self.campo("Senha").find_element(By.XPATH, "ancestor::form")
        self.clicar("Entrar", dentro=formulario)
        return self

    def entrar_e_esperar(self, email: str, senha: str):
        """Entra e espera o menu da conta. Se o login não passar (o limite de 5 por
        minuto do backend estourou), espera a janela virar e envia o formulário de novo,
        na mesma tela, para não perder o `?retorno=`."""
        cabecalho = Cabecalho(self.driver, self.base_url)
        self.entrar(email, senha)
        try:
            cabecalho.esperar_logado()
        except TimeoutException:
            if self.caminho_atual != "/entrar":
                raise  # saiu da tela de login: o problema não é o limite de tentativas
            time.sleep(ESPERA_DO_LIMITE_DE_LOGIN)
            self.entrar(email, senha)
            cabecalho.esperar_logado()
        return self

    def mensagem_de_erro(self) -> str:
        alerta = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']")))
        return alerta.text.strip()
