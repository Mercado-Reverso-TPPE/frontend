==================================================
TELAS DO MVP
==================================================

Crie somente as telas necessárias para demonstrar o MVP.

------------------------------------------
1. LOGIN
------------------------------------------

Criar uma tela simples de login.

Campos:
- E-mail
- Senha

Ações:
- Entrar
- Esqueci minha senha
- Criar conta

------------------------------------------
2. CADASTRO
------------------------------------------

Criar tela de cadastro.

Campos:
- Nome
- E-mail
- Senha
- Telefone
- Cidade
- Estado

Permitir escolher:
- Comprador
- Vendedor
- Ambos

Após cadastro, levar para a tela inicial.

------------------------------------------
3. PERFIL
------------------------------------------

Criar uma tela simples de perfil.

Mostrar:
- Avatar
- Nome
- Avaliação
- Cidade/Estado
- Telefone
- Tipo de usuário

Permitir editar:
- Nome
- Telefone
- Localização
- Foto/avatar

Não criar configurações complexas.

------------------------------------------
4. CRIAR ANÚNCIO "PROCURA-SE"
------------------------------------------

Criar uma tela para o comprador publicar o que está procurando.

Campos:

- Título
- Categoria
- Descrição
- Estado de conservação desejado
- Localização
- Raio de busca em KM
- Orçamento mínimo
- Orçamento máximo
- Indicador de urgência

Botao criar anuncio

Após publicar:
mostrar confirmação e levar para o detalhe do anúncio.

------------------------------------------
5. MEUS ANÚNCIOS
------------------------------------------

Criar uma tela onde o comprador consegue visualizar suas demandas.

Exemplo:

Meus anúncios

[Ativo]
iPhone 15 Pro Max 256GB
R$ 4.200 — R$ 5.000
7 ofertas

[Ativo]
Bicicleta de Montanha 29"
R$ 1.200 — R$ 2.500
3 ofertas

Permitir:
- Editar
- Pausar
- Reativar
- Encerrar

Não criar funcionalidades administrativas complexas.

------------------------------------------
6. DETALHE DO ANÚNCIO
------------------------------------------

Criar uma tela de detalhe da demanda.

Mostrar:

- Título
- Categoria
- Descrição
- Localização
- Raio de busca
- Orçamento
- Estado desejado
- Data de publicação
- Status
- Perfil do comprador
- Quantidade de ofertas recebidas

Para o comprador:
mostrar as ofertas recebidas.

Para o vendedor:
mostrar botão:
"Fazer oferta"

------------------------------------------
7. BUSCAR ANÚNCIOS
------------------------------------------

A busca por anuncios pode continuar sendo a tela inicial

Permitir:

Busca por:
- Título
- Descrição
- Cidade

Filtros:
- Categoria
- Distância
- Faixa de orçamento
- Status

Ordenação:
- Mais recentes
- Mais ofertas
- Maior orçamento
- Mais próximos


------------------------------------------
8. FAZER OFERTA
------------------------------------------

Criar uma tela/modal para o vendedor responder a uma demanda.

Campos:

- Produto
- Foto do produto
- Descrição
- Estado de conservação
- Preço da oferta
- Observações

Não incluir:
- Prazo de entrega
- Frete
- Logística
- Checkout
- Pagamento

A plataforma NÃO será responsável por entrega ou logística.
Essas questões são combinadas diretamente entre comprador e vendedor.

Botão:
"Enviar oferta"

Após enviar:
mostrar:
"Oferta enviada com sucesso."

------------------------------------------
9. OFERTAS RECEBIDAS
------------------------------------------

Criar uma tela para o comprador visualizar as ofertas recebidas em seu anúncio.

Cada oferta deve mostrar:

- Avatar do vendedor
- Nome
- Avaliação
- Produto ofertado
- Foto
- Descrição
- Estado
- Preço
- Localização
- Distância
- Observações

Ações:

- Ver oferta
- Conversar
- Aceitar
- Recusar
- Fazer contraproposta

NÃO criar comparação lado a lado.

O comprador pode analisar cada oferta individualmente.

------------------------------------------
10. CONTRAPROPOSTA
------------------------------------------

Criar fluxo simples de negociação de preço.

Comprador pode clicar:
"Fazer contraproposta"

Informar:
- Novo valor
- Mensagem opcional

Vendedor pode:

- Aceitar
- Recusar
- Fazer outra contraproposta

Mostrar claramente o histórico da negociação:

Oferta inicial:
R$ 4.700

Contraproposta:
R$ 4.400

Nova proposta:
R$ 4.550

Status:
"Aguardando resposta"

------------------------------------------
11. CHAT
------------------------------------------

Criar uma área simples de mensagens.

O chat deve estar relacionado a uma negociação.

Mostrar no topo:

- Nome da outra pessoa
- Foto/avatar
- Avaliação
- Produto
- Valor atual da negociação
- Status

Área de mensagens.

Campo:
"Digite uma mensagem..."

Botão:
Enviar

O chat serve para combinar detalhes diretamente entre comprador e vendedor.

Não criar:
- chamadas
- anexos complexos
- pagamentos
- checkout
- logística

------------------------------------------
12. ACEITAR OU RECUSAR OFERTA
------------------------------------------

Quando o comprador aceitar uma oferta:

Mostrar uma confirmação:

"Você escolheu esta oferta"

Mostrar:
- Vendedor
- Produto
- Valor
- Localização

Botão:
"Confirmar escolha"

Após confirmar:
- Oferta fica aceita
- Demais ofertas ficam encerradas
- Anúncio muda de status
- Negociação continua pelo chat

Também permitir recusar ofertas individualmente.

após aceitar a oferta deve ser criado um chat entre o vendedor e o
comprador para eles discutirem mais detalhes
------------------------------------------
13. CONCLUIR NEGOCIAÇÃO
------------------------------------------

Criar uma tela simples para finalizar a negociação.

O vendedor pode registrar:

"Venda concluída"

ou

"Venda não realizada"

Se concluída:
- Encerrar anúncio
- Registrar no histórico
- Permitir avaliação

Não criar fluxo de pagamento.

------------------------------------------
14. NOTIFICAÇÕES
------------------------------------------

Criar uma central simples de notificações.

Mostrar notificações para:

- Nova oferta
- Nova contraproposta
- Nova mensagem
- Oferta aceita
- Oferta recusada
- Negociação concluída
- Nova avaliação

Adicionar indicador de notificações não lidas no header.

------------------------------------------
15. AVALIAÇÃO
------------------------------------------

Após a conclusão da negociação, permitir avaliar a outra pessoa.

Campos:

- Nota de 1 a 5 estrelas
- Comentário

Mostrar avaliações no perfil.

------------------------------------------
16. HISTÓRICO
------------------------------------------

Criar uma tela simples de histórico.

Mostrar:

- Produto/anúncio
- Pessoa envolvida
- Valor
- Data
- Status

Permitir visualizar:

- Compras
- Vendas
- Negociações encerradas