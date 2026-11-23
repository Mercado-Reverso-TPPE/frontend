"""Home pública: o visitante navega sem conta e só o detalhe exige entrar."""

from urllib.parse import parse_qs, urlparse

import pytest

from paginas import Entrar, Feed


@pytest.mark.sessao
def test_visitante_filtra_por_sp_e_categoria_entra_e_cai_no_anuncio(driver, base_url, credenciais):
    feed = Feed(driver, base_url).abrir()
    feed.convite()

    feed.filtrar_por_uf("SP")
    categoria = feed.filtrar_por_categoria_com_resultados()
    assert feed.parametros["uf"] == "SP"
    feed.esperar_lista()
    for card in feed.cards():
        assert "SP" in card.text
        assert categoria in card.text

    titulo, destino = feed.clicar_no_primeiro_card()

    # O clique leva ao login, guardando o anúncio para depois.
    feed.esperar_caminho("/entrar")
    retorno = feed.parametros["retorno"]
    assert retorno.startswith("/anuncios/")
    assert parse_qs(urlparse(destino).query)["retorno"] == [retorno]

    Entrar(driver, base_url).entrar_e_esperar(*credenciais)

    feed.esperar_caminho(retorno)
    assert feed.titulo(titulo, nivel="h1").is_displayed()
