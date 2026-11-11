"""Base dos Page Objects: navegação, esperas e seletores por rótulo e papel.

Os seletores preferem o que a pessoa vê (rótulo do campo, texto do botão,
título) e só caem para `data-testid` quando o texto não é estável.
"""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

ESPERA_PADRAO = 20


def literal_xpath(texto: str) -> str:
    """Texto como literal XPath, mesmo com aspas simples e duplas."""
    if "'" not in texto:
        return f"'{texto}'"
    if '"' not in texto:
        return f'"{texto}"'
    partes = texto.split("'")
    return "concat(" + ", \"'\", ".join(f"'{parte}'" for parte in partes) + ")"


class Pagina:
    caminho = "/"

    def __init__(self, driver: WebDriver, base_url: str):
        self.driver = driver
        self.base_url = base_url.rstrip("/")
        self.espera = WebDriverWait(driver, ESPERA_PADRAO)

    # ── Navegação ────────────────────────────────────────────────────────
    def abrir(self, caminho: str | None = None):
        self.driver.get(f"{self.base_url}{caminho or self.caminho}")
        self.esperar_aplicacao()
        return self

    def esperar_aplicacao(self):
        """A SPA montou: o cabeçalho ou o layout de autenticação apareceu."""
        self.espera.until(EC.presence_of_element_located((By.CSS_SELECTOR, "header, main")))

    @property
    def caminho_atual(self) -> str:
        return urlparse(self.driver.current_url).path

    @property
    def parametros(self) -> dict[str, str]:
        consulta = parse_qs(urlparse(self.driver.current_url).query)
        return {chave: valores[0] for chave, valores in consulta.items()}

    def esperar_caminho(self, caminho: str):
        self.espera.until(lambda _: self.caminho_atual == caminho)

    # ── Seletores ────────────────────────────────────────────────────────
    def campo(self, rotulo: str) -> WebElement:
        """Controle de formulário pelo texto do `<label>` (ignora o `*` de obrigatório)."""
        label = self.espera.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//label[normalize-space(text()[1])={literal_xpath(rotulo)}]")
            )
        )
        return self.driver.find_element(By.ID, label.get_attribute("for"))

    def preencher(self, rotulo: str, valor: str):
        elemento = self.campo(rotulo)
        elemento.clear()
        # `clear()` não dispara o onChange do React em todo navegador.
        elemento.send_keys("a")  # Ctrl+A, Backspace
        elemento.send_keys(valor)
        return elemento

    def botao(self, nome: str, dentro: WebElement | None = None) -> WebElement:
        """Botão ou link com aparência de botão, pelo texto visível ou `aria-label`."""
        xpath = (
            f".//*[(self::button or self::a) and (normalize-space()={literal_xpath(nome)}"
            f" or @aria-label={literal_xpath(nome)})]"
        )
        raiz = dentro or self.driver
        return self.espera.until(lambda _: self._visivel(raiz.find_elements(By.XPATH, xpath)))

    def clicar(self, nome: str, dentro: WebElement | None = None):
        elemento = self.botao(nome, dentro)
        self.espera.until(lambda _: elemento.is_enabled() and elemento.get_attribute("aria-disabled") != "true")
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", elemento)
        elemento.click()

    def titulo(self, texto: str, nivel: str = "*") -> WebElement:
        """Título visível; `nivel` restringe a tag (`h1`, `h2`…)."""
        filtro = "self::h1 or self::h2 or self::h3" if nivel == "*" else f"self::{nivel}"
        xpath = f"//*[{filtro}][normalize-space()={literal_xpath(texto)}]"
        return self.espera.until(EC.visibility_of_element_located((By.XPATH, xpath)))

    def texto_visivel(self, texto: str) -> WebElement:
        xpath = f"//*[normalize-space()={literal_xpath(texto)}]"
        return self.espera.until(EC.visibility_of_element_located((By.XPATH, xpath)))

    def existe_texto(self, texto: str) -> bool:
        xpath = f"//*[normalize-space()={literal_xpath(texto)}]"
        return any(elemento.is_displayed() for elemento in self.driver.find_elements(By.XPATH, xpath))

    def por_testid(self, testid: str) -> WebElement:
        return self.espera.until(EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{testid}']")))

    @staticmethod
    def _visivel(elementos: list[WebElement]) -> WebElement | bool:
        return next((elemento for elemento in elementos if elemento.is_displayed()), False)
