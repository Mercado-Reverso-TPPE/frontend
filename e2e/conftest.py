"""Configuração dos testes ponta a ponta (Selenium + pytest).

Variáveis de ambiente:
    E2E_BASE_URL   URL alvo (padrão: produção).
    E2E_EMAIL      e-mail da conta de teste dedicada (nunca uma conta pessoal).
    E2E_SENHA      senha da conta de teste.
    E2E_HEADLESS   "0" abre o Chrome com janela, para depurar.
    E2E_ARTEFATOS  pasta das capturas e logs de falha (padrão: e2e/artefatos).
"""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

import pytest
from selenium import webdriver

from paginas import Cabecalho, Entrar, MeusAnuncios

URL_DE_PRODUCAO = "https://quero-frontend.vercel.app"
PREFIXO_DE_TESTE = "[E2E]"
ARTEFATOS = Path(os.environ.get("E2E_ARTEFATOS", Path(__file__).parent / "artefatos"))


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.environ.get("E2E_BASE_URL", URL_DE_PRODUCAO).rstrip("/")


@pytest.fixture(scope="session")
def credenciais() -> tuple[str, str]:
    email, senha = os.environ.get("E2E_EMAIL"), os.environ.get("E2E_SENHA")
    if not email or not senha:
        pytest.skip("Defina E2E_EMAIL e E2E_SENHA com a conta de teste para os cenários com sessão.")
    return email, senha


@pytest.fixture
def driver():
    opcoes = webdriver.ChromeOptions()
    if os.environ.get("E2E_HEADLESS", "1") != "0":
        opcoes.add_argument("--headless=new")
    opcoes.add_argument("--window-size=1440,1000")
    opcoes.add_argument("--no-sandbox")
    opcoes.add_argument("--disable-dev-shm-usage")
    opcoes.add_argument("--lang=pt-BR")
    opcoes.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    navegador = webdriver.Chrome(options=opcoes)
    yield navegador
    navegador.quit()


@pytest.fixture
def logado(driver, base_url, credenciais):
    """Driver com a sessão da conta de teste aberta."""
    email, senha = credenciais
    Entrar(driver, base_url).abrir().entrar_e_esperar(email, senha)
    return driver


@pytest.fixture
def titulo_unico() -> str:
    """Título de anúncio marcado como dado de teste, para a limpeza achar depois."""
    return f"{PREFIXO_DE_TESTE} Teste ponta a ponta {uuid.uuid4().hex[:8]}"


@pytest.fixture
def limpar_anuncios(logado, base_url):
    """Ao final, encerra qualquer anúncio de teste que tenha ficado ativo ou pausado."""
    yield
    pagina = MeusAnuncios(logado, base_url)
    try:
        pagina.abrir()
        if not Cabecalho(logado, base_url).esta_logado():
            return
        for titulo in pagina.titulos_abertos(PREFIXO_DE_TESTE):
            pagina.encerrar(titulo)
    except Exception as erro:  # a limpeza não pode esconder a falha original
        print(f"Falha ao limpar anúncios de teste: {erro}")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Salva captura de tela, HTML e console do navegador quando um teste falha."""
    resultado = yield
    relatorio = resultado.get_result()
    if relatorio.when != "call" or not relatorio.failed:
        return
    navegador = item.funcargs.get("driver")
    if navegador is None:
        return
    ARTEFATOS.mkdir(parents=True, exist_ok=True)
    nome = item.nodeid.replace("/", "_").replace("::", "__")
    try:
        navegador.save_screenshot(str(ARTEFATOS / f"{nome}.png"))
        (ARTEFATOS / f"{nome}.html").write_text(navegador.page_source, encoding="utf-8")
        logs = navegador.get_log("browser")
        (ARTEFATOS / f"{nome}.console.json").write_text(json.dumps(logs, ensure_ascii=False, indent=2), encoding="utf-8")
        (ARTEFATOS / f"{nome}.url.txt").write_text(navegador.current_url, encoding="utf-8")
    except Exception as erro:
        print(f"Não foi possível salvar os artefatos de {item.nodeid}: {erro}")
