"""Cenários com a conta de teste: sessão, busca, anúncios, notificações e perfil."""

import time

import pytest

from paginas import Cabecalho, CriarAnuncio, Feed, MeusAnuncios, Notificacoes, Perfil

pytestmark = pytest.mark.sessao


def test_entrar_mostra_o_avatar_e_sair_encerra(logado, base_url):
    cabecalho = Cabecalho(logado, base_url)

    assert cabecalho.avatar().is_displayed()
    cabecalho.sair()
    assert not cabecalho.esta_logado()


def test_busca_e_categoria_ficam_na_url_e_mudam_a_lista(logado, base_url):
    feed = Feed(logado, base_url).abrir()
    antes = feed.esperar_lista()

    Cabecalho(logado, base_url).buscar("a")
    feed.espera.until(lambda _: feed.parametros.get("q") == "a")
    feed.esperar_lista()

    feed.filtrar_por_categoria(1)
    depois = feed.esperar_lista()
    assert feed.parametros.get("q") == "a"
    assert feed.parametros.get("categoria")
    assert depois != antes or "Nenhum anúncio" in depois


def test_detalhe_volta_ao_feed_com_os_filtros(logado, base_url):
    feed = Feed(logado, base_url).abrir("/?ordenar=recentes")
    resumo = feed.esperar_lista()
    if "Nenhum anúncio" in resumo:
        pytest.skip("Não há anúncios ao alcance da conta de teste para abrir o detalhe.")
    filtros = feed.parametros

    feed.abrir_primeiro_anuncio()
    logado.back()

    feed.esperar_caminho("/")
    assert feed.parametros == filtros


@pytest.mark.escrita
def test_criar_pausar_reativar_e_encerrar_anuncio(logado, base_url, titulo_unico, limpar_anuncios):
    CriarAnuncio(logado, base_url).abrir().publicar(
        titulo_unico, "Anúncio criado pelos testes ponta a ponta. Será encerrado ao final."
    )

    meus = MeusAnuncios(logado, base_url)
    assert meus.status(titulo_unico) == "Ativo"
    meus.pausar(titulo_unico)
    meus.reativar(titulo_unico)
    meus.encerrar(titulo_unico)


def test_marcar_todas_como_lidas_zera_o_sino(logado, base_url):
    pagina = Notificacoes(logado, base_url).abrir().esperar_carregar()
    pagina.marcar_todas_como_lidas()

    assert Cabecalho(logado, base_url).nao_lidas_no_sino() == 0


@pytest.mark.escrita
def test_editar_telefone_no_perfil(logado, base_url):
    perfil = Perfil(logado, base_url).abrir()
    perfil.abrir_edicao()
    original = perfil.telefone()
    novo = f"(61) 9{int(time.time()) % 10000:04d}-0000"

    try:
        perfil.salvar_telefone(novo)
        logado.refresh()
        perfil.esperar_aplicacao()
        perfil.abrir_edicao()
        perfil.espera.until(lambda _: perfil.telefone() == novo)
    finally:
        # Devolve o telefone original para a conta de teste ficar como estava.
        perfil.abrir_edicao()
        if perfil.telefone() != original:
            perfil.salvar_telefone(original)
