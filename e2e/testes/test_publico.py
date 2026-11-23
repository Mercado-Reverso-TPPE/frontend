"""Cenários sem sessão: home, login inválido, rota privada e recarga de rota profunda."""

import pytest
from selenium.webdriver.common.by import By

from paginas import Cabecalho, Entrar, Feed


def test_home_deslogado_mostra_hero_convite_e_anuncios_do_brasil(driver, base_url):
    """Sem sessão, a home é pública: hero, convite para entrar e a lista nacional.
    As métricas do hero não entram na conta: somem quando `/estatisticas` cai no limite
    de requisições anônimas do backend."""
    feed = Feed(driver, base_url).abrir()

    hero = feed.hero()
    assert "Você anuncia o que quer." in hero.text
    convite = feed.convite()
    assert feed.botao("Entrar", dentro=convite).is_displayed()
    assert feed.botao("Criar conta", dentro=convite).is_displayed()
    assert feed.seletor_de_localidade().first_selected_option.text.strip().endswith("Brasil")
    feed.esperar_lista()


@pytest.mark.sessao
def test_home_logado_mostra_abas_e_categorias(logado, base_url):
    feed = Feed(logado, base_url).abrir()

    feed.hero()
    assert feed.abas().find_elements(By.TAG_NAME, "button")
    chips = feed.chips_de_categoria()
    assert chips[0].text.startswith("Todos")


def test_login_com_senha_errada_mostra_mensagem_generica(driver, base_url):
    pagina = Entrar(driver, base_url).abrir()
    pagina.entrar("conta-de-teste-inexistente@exemplo.com", "senha-errada-123")

    assert pagina.mensagem_de_erro() == "E-mail ou senha inválidos."
    assert pagina.caminho_atual == "/entrar"
    assert not Cabecalho(driver, base_url).esta_logado()


@pytest.mark.sessao
def test_rota_privada_redireciona_e_volta_ao_destino(driver, base_url, credenciais):
    pagina = Entrar(driver, base_url)
    pagina.abrir("/meus-anuncios")

    pagina.esperar_caminho("/entrar")
    assert pagina.parametros.get("retorno") == "/meus-anuncios"

    pagina.entrar_e_esperar(*credenciais)
    pagina.esperar_caminho("/meus-anuncios")


@pytest.mark.parametrize("rota", ["/meus-anuncios", "/perfil", "/anuncios/qualquer-id", "/redefinir-senha?uid=x&token=y"])
def test_recarregar_rota_profunda_nao_da_404(driver, base_url, rota):
    pagina = Feed(driver, base_url).abrir(rota)
    driver.refresh()
    pagina.esperar_aplicacao()

    corpo = driver.find_element(By.TAG_NAME, "body").text
    assert "404: NOT_FOUND" not in corpo
    assert "quero." in driver.title
