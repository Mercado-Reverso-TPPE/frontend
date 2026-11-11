"""Page Objects das telas cobertas pelos testes ponta a ponta."""

from .base import Pagina
from .cabecalho import Cabecalho
from .criar_anuncio import CriarAnuncio
from .entrar import Entrar
from .feed import Feed
from .historico import Historico
from .meus_anuncios import MeusAnuncios
from .notificacoes import Notificacoes
from .perfil import Perfil

__all__ = [
    "Cabecalho",
    "CriarAnuncio",
    "Entrar",
    "Feed",
    "Historico",
    "MeusAnuncios",
    "Notificacoes",
    "Pagina",
    "Perfil",
]
