# Projeto: Modelo Scratch - Action Platformer (Arquivo 01)

*Nota: Projeto de plataforma focado em combate. Apresenta física customizada baseada em velocidade vertical (vspeed), inteligência artificial de perseguição e um sistema robusto de Máquina de Estados usando Blocos Customizados (Funções).*

## Arquitetura Geral

O projeto é dividido em três Atores (Sprites) principais:

1\. **Jogador:** Controlado pelo usuário, com sistemas de pulo, ataque e invulnerabilidade temporária (i-frames).

2\. **Slash:** Hitbox (Área de colisão) do ataque, que segue o jogador de forma invisível até ser acionada.

3\. **Goblin:** Inimigo com IA de perseguição (segue o eixo X do jogador) e sistema de recuo (Knockback) ao tomar dano.

---

## Ator 1: Jogador (Player)

Variáveis locais: `vspeed`, `attacking?`, `Life` (5), `damage`.

A lógica roda em "Sempre" (Forever) através de 5 Blocos Customizados:

* **Gravidade:** * Altera o Y por `vspeed` e diminui `vspeed` em -1 continuamente.

  * Colisão com o chão (Laranja) zera a `vspeed`.

* **Movimentação:** * Se NÃO estiver atacando (`attacking?` = 0):

    * **Setas Direita/Esquerda:** Move 4 pixels para os lados. Se tocar na parede (Marrom), retrocede -4 pixels.

    * **Pulo (Tecla Z):** Se tocar no chão, define `vspeed` para 12.

  * **Detecção de Rampa:** Usa um loop interno subindo o Y em +1 para não travar em subidas.

* **Ataque:** * **Tecla X:** Se não estiver atacando, define `attacking?` = 1.

  * Executa a animação de ataque (troca de fantasias com espera de 0.1s).

  * Envia a mensagem `slash` (Ativa a hitbox) -> Espera 0.1s -> Envia `slash_stop` (Desativa).

  * Retorna `attacking?` para 0.

* **Animação:** Lê o valor de `vspeed` e das teclas de direção para definir se o sprite deve exibir a fantasia *standing*, *walk*, *jumping* ou *falling*.

* **Dano (I-Frames):** * Se `damage` = 0 e tocar na cor da arma do inimigo: Perde -1 de `Life` e define `damage` = 1.

  * Se `damage` = 1: Pisca o sprite usando o efeito "Fantasma" (Ghost effect) em ciclos de +10/-10 repetidas vezes antes de voltar a ficar vulnerável (`damage` = 0).

---

## Ator 2: Slash (Hitbox do Ataque)

Fica invisível o tempo todo, mas segue as coordenadas X/Y do **Jogador**.

* **Orientação:** Verifica a direção atual do Jogador (90 ou -90) e aponta para o mesmo lado, garantindo que o ataque saia para frente.

* **Mensagens:** * Ao receber `slash` -> Mostra o sprite (Show).

  * Ao receber `slash_stop` -> Esconde o sprite (Hide).

---

## Ator 3: Goblin (Inimigo)

Variáveis locais: `vspeed`, `attacking?`, `Life` (3).

Compartilha os mesmos sistemas de Gravidade e Rampa do Jogador (adaptados para suas próprias cores de cenário), mas brilha na IA:

* **Movimentação (Inteligência de Perseguição):**

  * Lê constantemente a `posição x do Jogador`.

  * Se Jogador.X > Goblin.X -> Aponta para 90 e anda para a Direita (+2).

  * Se Jogador.X < Goblin.X -> Aponta para -90 e anda para a Esquerda (-2).

  * **Pulo Inteligente:** Se colidir com as cores de "quina" ou obstáculo, o Goblin define sua `vspeed` para 12 para tentar pular e alcançar o jogador.

* **Ataque (Distância):** * Se a distância até o Jogador for menor que 50 pixels -> Trava o movimento (`attacking?` = 1), faz a animação de ataque, espera 2 segundos (cooldown) e volta a andar.

* **Dano e Knockback:** * Se tocar na cor do ataque do jogador (Cinza do Slash):

    * Sofre um repuxo para trás de -8 passos (Knockback) repetidas vezes.

    * Perde -1 de `Life`.

  * Se `Life` = 0 -> Esconde o sprite (Morre).

# Projeto: Modelo Scratch - Movimentação Top-Down com Colisão e Câmera Suave (Arquivo 02)

*Nota: Projeto originado de um tutorial do YouTube. Apresenta uma engine Top-Down muito otimizada com rolagem de tela (Scroll), interpolação de câmera (Lerp) e um sistema de colisão em dois eixos usando "Hitbox".*

## Arquitetura Geral e Game Loop

O projeto utiliza um sistema de controle de atualização (Tick) muito elegante para evitar dessincronização visual.

* **Palco (Stage):** É o maestro do jogo. Ao clicar na Bandeira Verde, ele roda um loop infinito (`Sempre`) que apenas envia a mensagem `tick:PositionPlayer´`. Isso garante que todos os cálculos ocorram no mesmo "frame".

* **Variáveis Globais (Câmera e Input):** `scrollX`, `scrollY`, `inputX`, `inputY`, `_speed` (Velocidade base = 5).

## Ator 1: Player (Jogador)

Utiliza variáveis locais `_x` e `_y` (sua posição absoluta no mundo, não na tela) e organiza tudo em Blocos Customizados (sem atualização de tela para não piscar).

* **Gatilho de Atualização:** Ao receber `tick:PositionPlayer´`, executa a `Movement` e depois a `MoveCamera`.

* **Bloco Customizado: Movement (Input e Hitbox)**

  1. Troca a fantasia para "Hitbox" (um retângulo perfeito) para garantir que a colisão não bugue com os braços ou pernas do sprite principal.

  2. **Eixo X:** Calcula `inputX` subtraindo a Tecla A da Tecla D (Se D apertado = 1; Se A = -1; Se ambos = 0). Chama a função de movimento enviando `(inputX * _speed)`.

  3. **Eixo Y:** Faz o mesmo para as teclas W e S, calculando `inputY` e chamando o movimento vertical.

  4. **Retorno Visual:** Se houver movimento horizontal, aponta para `(inputX * 90)` e devolve a fantasia para "Cat" (Gato).

* **Bloco Customizado: Move [dx] [dy] (O Motor de Colisão)**

  * Desacopla o teste de X e Y para o personagem não grudar na parede.

  * Tenta se mover para o destino desejado.

  * `Se tocando em "wall"` -> Volta para a posição original de segurança e interrompe a leitura (`stop this script`).

  * Se não bater em nada -> Consolida a posição alterando as variáveis reais `_x` e `_y` com o valor de `dx` e `dy`.

* **Bloco Customizado: MoveCamera (Interpolação/Lerp)**

  * Em vez de travar a câmera no jogador, ela cria um atraso suave muito usado em jogos profissionais.

  * Fórmula: Adiciona a `scrollX` o valor de `((_x - scrollX) * 0.1)`. Isso faz a câmera viajar 10% da distância até o jogador a cada tick, criando um movimento muito orgânico.

## Ator 2: Wall (Cenário / Parede)

* Utiliza variáveis locais próprias `_x` e `_y` (neste caso, 0,0) para definir onde a parede existe no "Mundo".

* **Posicionamento Relativo:** Ao receber `tick:PositionPlayer´`, ele vai para a coordenada X: `(_x - scrollX)` e Y: `(_y - scrollY)`. Isso cria a ilusão de que o cenário está rolando enquanto o jogador fica relativamente centralizado na tela.

# Projeto: Modelo Scratch - Space Invaders (Arquivo 03)

*Nota: Releitura do clássico de arcade criada de forma independente. Destaca-se pelo uso de Listas para gerenciamento de posições e um sistema de mensagens (Broadcast) para coordenar o movimento sincronizado da colmeia de inimigos.*

## Variáveis e Listas Globais

* **Variáveis:** `Direcao` (direita/esquerda), `VelocidadeInimigo`, `DistanciaInimigo`, `tiro` (contador/cooldown), `Comecar` (booleana de estado).

* **Lista `PosInimigo`:** Armazena as coordenadas X iniciais para a geração da grade de clones, permitindo que o enxame seja gerado de forma dinâmica.

---

## Ator 1: Player (Nave)

* **Controles:** Movimentação lateral (Setas ou A/D) limitada às bordas da tela.

* **Sistema de Tiro:** * Ao pressionar Espaço, verifica a variável `tiro`.

  * Se estiver liberado, envia o broadcast `tiro` e inicia um pequeno cooldown.

* **Condição de Derrota:** Ao receber a mensagem `AtingiuPlayer`, o jogador é destruído ou o jogo termina.

## Ator 2: Inimigo (Swarm Logic)

Este é o cérebro do projeto. Em vez de cada inimigo agir por conta própria, eles seguem um comando centralizado.

* **Geração da Grade:** No início, o Ator percorre a lista `PosInimigo` e cria um clone para cada item, definindo a formação inicial.

* **Movimentação Sincronizada:** * Os clones se movem lateralmente baseados na variável global `Direcao` multiplicada por `VelocidadeInimigo`.

  * **Detecção de Borda:** Quando *qualquer* clone toca a borda da tela, ele envia a mensagem `borda`.

* **Descida em Bloco:** Ao receber `borda`, todos os clones invertem o valor da variável `Direcao` e descem uma quantidade fixa no eixo Y (ex: -10).

## Ator 3: BulletPlayer (Projétil do Jogador)

* **Gatilho:** Criado como clone ao receber o sinal `tiro`.

* **Comportamento:** Move-se para cima (`mude y por 10`) até tocar no `Inimigo` ou na borda superior.

* **Interação:** Ao tocar no inimigo, envia o broadcast `Atingiu` para eliminar o alvo e se destrói.

## Ator 4: BulletEnemy (Projétil Inimigo)

* **IA de Ataque:** Os clones dos inimigos geram clones desta bala em intervalos baseados em uma semente aleatória.

* **Comportamento:** Move-se para baixo até tocar no `Player` ou na borda inferior.

# Projeto: Modelo Scratch - Tank vs Espaçonave (Arquivo 04)

*Nota: Projeto co-criado com foco em mecânicas de "Tank Controls" (rotação e aceleração relativas) e "Turret Aiming" (mira independente atrelada ao mouse).*

## Arquitetura Geral

O jogador controla um tanque dividido em duas partes (Base e Canhão), permitindo mover-se em uma direção enquanto atira em outra. Os inimigos funcionam como um *spawner* contínuo de naves que caem do topo da tela.

---

## Ator 1: Tanque (Base de Movimento)

Responsável exclusivamente pela locomoção usando lógica de Movimento Relativo (passos na direção do ângulo atual).

* **Controles de Rotação (Eixo angular):** * `A` -> Gira 9 graus para a esquerda.

  * `D` -> Gira 9 graus para a direita.

* **Controles de Aceleração (Eixo linear):** * `W` -> Move 3 passos (avança para onde a frente do tanque aponta).

  * `S` -> Move -3 passos (dá ré).

* **Sistema de Punição:** Se tocar na cor preta (`#131313`), o tanque é imediatamente teleportado de volta para a posição inicial no lado esquerdo da tela (X: -210, Y: 0).

## Ator 2: Canhão (Mira Independente)

Funciona como uma "Torreta" montada sobre a base do tanque.

* **Fixação (Mounting):** Possui um loop contínuo de `vá para Tanque`. Fica na camada da frente para sobrepor visualmente a base.

* **Mira (Aiming):** Aponta constantemente na direção do ponteiro do mouse, ignorando a rotação da base do tanque.

* **Disparo:** Se o botão do mouse for pressionado, cria um clone do ator `Tiro` e aciona um *cooldown* aguardando 0.5 segundos antes de permitir o próximo tiro.

## Ator 3: Tiro (Projétil do Jogador)

* **Setup Inicial:** O ator original fica escondido (Hide) e grudado no tanque (`vá para Tanque`), servindo apenas como ponto de origem para os clones.

* **Comportamento do Clone:** * Ao nascer, aponta imediatamente para o mouse e se torna visível.

  * Entra em um loop de movimento contínuo (`mova 5 passos`).

  * **Garbage Collection:** Se o tiro tocar na borda da tela (`_edge_`), o clone é deletado para não sobrecarregar a memória.

## Ator 4: Inimigo (Espaçonave Alvo)

* **Gerador (Spawner):** O ator original fica invisível. A cada 2 segundos, ele cria um clone de si mesmo na tela. *(Nota: O original também possui um loop paralelo de movimento lateral que quica nas bordas).*

* **Comportamento do Clone:** * Torna-se visível e aponta direto para baixo (180 graus).

  * Move-se 5 passos continuamente. Se tocar nas bordas da tela, ele quica.

* **Resolução de Dano:** Se o clone colidir com o ator `Tiro`, o inimigo é destruído (clone deletado).

# Projeto: Modelo Scratch - Tiro ao Alvo Simples (Arquivo 05)

*Nota: Projeto pedagógico introdutório estilo "Code Along". Foca nos conceitos primários de Eixo Y, Clones e temporizadores simples (Cooldown).*

## Arquitetura Geral

O jogo é composto por 3 atores principais: um atirador (Player) fixo no lado esquerdo, um alvo fixo no lado direito, e o projétil que viaja entre eles.

---

## Ator 1: Player

Fica posicionado no canto esquerdo da tela (X: -200). Possui duas lógicas rodando em paralelo a partir da Bandeira Verde:

* **Movimentação Vertical (Eixo Y):**

  * Se a Seta para Cima for pressionada -> Adiciona 10 ao Y.

  * Se a Seta para Baixo for pressionada -> Subtrai 10 do Y.

* **Sistema de Tiro (Clonagem):**

  * Se a tecla Espaço for pressionada -> Cria um clone do ator `bala`.

  * **Feedback e Cooldown:** Toca o som "Pew" e aguarda 0.5 segundos. *(Nota: Essa espera é crucial para ensinar aos alunos como evitar que o jogador crie 60 balas por segundo segurando o botão).*

## Ator 2: bala (Projétil)

Utiliza a técnica do "Ator Âncora". O objeto original nunca entra no jogo, servindo apenas como fábrica de clones.

* **Âncora (Bandeira Verde):** Esconde o sprite original e entra em um loop infinito de `vá para posição x do Player` e `vá para posição y do Player`. Isso garante que as balas sempre nasçam exatamente de onde o jogador está.

* **Comportamento do Tiro (Quando começar como clone):**

  * Mostra o sprite.

  * Entra em um loop `Repita até tocar na borda`.

  * Dentro do loop, move-se para a direita (Adiciona 10 ao eixo X).

  * **Colisão:** Se tocar no ator `Alvo` durante o trajeto, o clone deleta a si mesmo. Se não tocar em nada e chegar na borda, o loop encerra e o clone também é deletado (Garbage Collection).

## Ator 3: Alvo

* Serve estritamente como um objeto de colisão (Hitbox passiva).

* Fica posicionado no canto direito (X: 200). Nesta iteração do projeto, ele não possui scripts de movimento ou de destruição próprios.

# Projeto: Modelo Scratch - Teclado Musical / Piano Remix (Arquivo 06)

*Nota: Projeto focado em interatividade de interface (Point and Click) e na utilização da Extensão de Música do Scratch para gerar notas MIDI dinâmicas.*

## Arquitetura Geral e Variáveis

O projeto simula uma oitava completa de um teclado musical (dó a dó). Não há um Game Loop principal rodando no Palco; tudo é guiado por eventos acionados pelo mouse do usuário.

* **Extensão:** Utiliza a biblioteca oficial `music` do Scratch.

* **Variável Global (Slider):** `which instrument` (Qual instrumento). Essa variável é exibida na tela como um controle deslizante (Slider) configurado para ir de 1 a 21. Isso permite que o usuário troque o som do teclado em tempo real (ex: de Piano para Marimba ou Sintetizador).

---

## Atores: Teclas (NoteC até NoteC8)

O projeto é composto por 13 atores, representando as teclas brancas e pretas (Sustenidos). A lógica estrutural é exatamente a mesma para todos, mudando apenas o valor numérico da nota.

* **Lógica de Interação (Event: When this sprite clicked):**

  1. **Feedback Visual (Press):** Assim que clicado, o Ator muda para a fantasia 2 (ex: `c2`), que geralmente possui um sombreamento ou deslocamento para simular a tecla sendo afundada.

  2. **Feedback Sonoro (Extensão Music):** * O sistema lê o valor atual do Slider global e define o instrumento (`set instrument to [which instrument]`).

     * Toca a nota MIDI correspondente por 0.5 batidas (`play note [X] for 0.5 beats`).

  3. **Feedback Visual (Release):** O script aguarda 0.1 segundos e devolve o Ator para a fantasia 1 (tecla em repouso).

* **Mapeamento das Notas (Padrão MIDI):**

  * `NoteC` (Dó): Nota 60

  * `NoteC#` (Dó Sustenido): Nota 61

  * `NoteD` (Ré): Nota 62

  * `NoteD#` (Ré Sustenido): Nota 63

  * `NoteE` (Mi): Nota 64

  * `NoteF` (Fá): Nota 65

  * `Note F#` (Fá Sustenido): Nota 66

  * `NoteG` (Sol): Nota 67

  * `NoteG#` (Sol Sustenido): Nota 68

  * `Note A` (Lá): Nota 69

  * `NoteA#` (Lá Sustenido): Nota 70

  * `NoteB` (Si): Nota 71

  * `NoteC8` (Dó Agudo): Nota 72

# Projeto: Modelo Scratch - Plataforma 4M (Arquivo 07)

*Nota: Projeto desenvolvido com uma turma avançada. O foco não é a construção da lógica do zero, mas a utilização de uma "Engine Física" robusta para focar em Level Design e adição de mecânicas de fase.*

## Variáveis Globais (A Física do Jogo)

O projeto inicializa um conjunto completo de variáveis simulando um ambiente físico real:

* `Gravidade` = -1

* `Força do Pulo` = 12

* `Aceleração` = 1.5

* `Resistência` (Atrito/Friction) = 0.8

* `Velocidade X` e `Velocidade Y` (Vetores de movimento)

* `Caindo` (Gatilho de estado de queda)

* `Último Valor` (Memória de posição para correção de colisão)

* `Fases` = Controle do nível atual (Inicia em 1).

---

## Ator 1: Player (A Engine de Movimento)

Toda a movimentação e colisão é tratada em um Bloco Customizado (`Movimento - em passos`), isolando a matemática complexa do loop principal.

* **Física Horizontal (X):**

  * As setas Esquerda/Direita adicionam ou subtraem a `Aceleração` da `Velocidade X`.

  * Constantemente multiplica a `Velocidade X` pela `Resistência` (0.8), criando uma desaceleração suave (efeito de deslize natural) quando o jogador solta a tecla.

* **Física Vertical (Y) e Pulo:**

  * Subtrai constantemente a `Gravidade` da `Velocidade Y`.

  * **Pulo:** Se a tecla Espaço/Cima for pressionada E a variável `Caindo` for menor que 3, define a `Velocidade Y` para a `Força do Pulo` (12).

* **Sistema de Colisão Preciso:**

  * O código tenta mover o personagem. Se ele tocar no ator `Fases` (o mapa), ele imediatamente reverte para a variável `Último Valor` (a posição segura anterior) e zera a velocidade daquele eixo, impedindo que atravesse paredes ou o chão.

* **Transição de Tela:** Se o jogador tocar na Borda (`_edge_`), adiciona +1 à variável `Fases` e teleporta o jogador de volta para a posição inicial (X: -200, Y: -130).

---

## Ator 2: Fases (O Gerenciador de Level Design)

* Fica travado na posição X: 0, Y: 0.

* **Troca Dinâmica:** Possui um loop infinito que usa o bloco `mude para a fantasia [Fases]`. Como as fantasias têm os nomes ou ordens numéricas, o cenário muda automaticamente quando a variável global sobe de valor, dispensando dezenas de blocos "Se Fase = 2, mude para cenário 2".

---

## Ator 3: Falso (Mecânicas de Fase Dinâmicas)

Serve como elementos interativos (plataformas falsas ou passagens secretas) que só existem em níveis específicos.

* Lê a variável `Fases` constantemente.

* Se `Fases` = 3: Vai para uma coordenada específica, muda para a fantasia "F3" e aparece (`mostre`).

* Se `Fases` = 4: Vai para outra coordenada, muda para a fantasia "F4" e aparece.

* Se não for nenhuma dessas fases, ele fica escondido (`esconda`).

# Projeto: Modelo Scratch - Plataforma (Teste de Física GML) (Arquivo 08)

*Nota: Projeto fundamental de pesquisa e desenvolvimento (P\&D) pedagógico. Demonstra a aplicação direta de conceitos de física de motores profissionais (como GameMaker) traduzidos para a lógica de blocos do Scratch.*

## Variáveis (A "Engine" Física)

O projeto emula as constantes de física de motores avançados usando variáveis globais e locais bem definidas:

* **Constantes Globais:**

  * `GRAVITY` = -1

  * `JUMP FORCE` = 12

  * `ACCELERATION` = 1.5

  * `RESISTANCE` (Friction/Atrito) = 0.8

* **Vetores Locais (Player):**

  * `speed x` (equivalente ao hspeed)

  * `speed y` (equivalente ao vspeed)

  * `last value` (equivalente ao xprevious/yprevious)

  * `falling` (contador de quadros em queda para Coyote Time/Prevenção de pulo duplo)

---

## Ator 1: Player (Motor de Movimento e Colisão)

Toda a complexidade roda em um loop principal que chama o Bloco Customizado `Move - in steps`, realizando o que chamamos na programação de **Sub-Stepping** (dividir o movimento em passos menores para evitar que o personagem atravesse paredes).

* **Entrada e Inércia (Input & Friction):**

  * Setas Esquerda/Direita manipulam a variável `speed x` somando ou subtraindo a `ACCELERATION`.

  * A cada frame, `speed x` é multiplicada por `RESISTANCE` (0.8). Isso cria a inércia: ao soltar a tecla, o valor não zera de uma vez, mas decai suavemente, simulando o atrito com o chão.

* **Gravidade e Pulo:**

  * `speed y` sofre a adição constante de `GRAVITY` (-1).

  * Se o jogador apertar Pulo (W, Espaço ou Seta para Cima) E a variável `falling` for menor que 3 -> `speed y` assume o valor de `JUMP FORCE` (12).

* **O Bloco Customizado: Colisão Perfeita (X e Y Separados):**

  A lógica isola os eixos para que o jogador possa deslizar em uma parede caindo sem grudar nela.

  * **Eixo X:** 1. Salva a posição atual (`x position`) na variável `last value`.

    2. Move o personagem baseado em `speed x`.

    3. Se tocar na cor de colisão (`#000000` / Preto) -> Reverte o X para `last value` e zera a `speed x`.

  * **Eixo Y:**

    1. Salva a posição atual (`y position`) na variável `last value`.

    2. Move o personagem baseado em `speed y`.

    3. Se tocar na cor de colisão (`#000000` / Preto) -> Reverte o Y para `last value`, zera a `speed y` e zera o contador `falling` (indicando que está firmemente no chão).

# Projeto: Modelo Scratch - Quiz Show com Listas Paralelas (Arquivo 09)

*Nota: Projeto pedagógico co-criado para o ensino de Estrutura de Dados (Listas). Simula um Game Show de perguntas e respostas para 4 jogadores no mesmo teclado, com forte adaptação temática para o engajamento dos alunos.*

## Estrutura de Dados: Listas Paralelas

O núcleo tecnológico deste jogo é a sincronização de duas listas através de um Índice comum (a variável `numPergunta`).

* **Lista `Perguntas`:** Contém 50 strings (ex: "Qual o nome do personagem do Minecraft?").

* **Lista `Respostas`:** Contém 50 strings sincronizadas (ex: "Steve").

  * *A Lógica:* O item 5 da lista de perguntas sempre será testado contra o item 5 da lista de respostas.

* **Lista `Pontos`:** Uma lista visual que funciona como placar em tempo real na tela.

---

## Ator 1: Stage (Gerenciador do Placar Dinâmico)

O Palco cuida da inicialização e da interface de texto.

* Inicia as variáveis de `Pontos J1` a `J4` com zero e limpa os nomes.

* Mantém um loop infinito que atualiza a lista `Pontos`. Ele concatena (Junta) as variáveis de texto e número para criar uma visualização amigável na tela (ex: "João 5", "Maria 3").

## Ator 2: Apresentador ("Silvio Santos" - O Motor do Quiz)

Responsável pelo fluxo principal do jogo e validação de dados.

* **Fase de Setup:** Usa o bloco de pergunta (`ask and wait`) para capturar e registrar o nome dos 4 jogadores.

* **Sorteio:** Ao receber o sinal `pergunta`, sorteia um valor de 1 a 50 na variável `numPergunta` e exibe o item correspondente da lista `Perguntas`.

* **Avaliação de Resposta:** Quando um jogador aperta o botão, o apresentador faz a pergunta direcionada.

  * Compara a resposta digitada com o item `numPergunta` da lista `Respostas`.

  * Se for exata (`=`): Dá o feedback visual, adiciona +1 ponto àquele jogador e reinicia o loop (`preparação`).

  * Se for errada: Dá o feedback negativo. Usa um `If` extra para garantir que o jogador só perca -1 ponto se sua pontuação atual não for zero (evitando pontuações negativas).

## Ator 3: Botões dos Jogadores (Q, P, Z, M)

Cada tecla representa um jogador. Eles utilizam um sistema clássico de "Interrupção" (Lockout) de Game Shows.

* Ficam escutando a sua tecla respectiva (ex: Tecla `Q` para o Jogador 1).

* Se a tecla for pressionada, envia um sinal (ex: `j1`) e **para seus próprios scripts**.

* **O Lockout:** Se o botão `Q` recebe o sinal `j2`, `j3` ou `j4` (ou seja, outro jogador foi mais rápido), ele executa o bloco `Pare [outros scripts neste ator]`. Isso impede que dois jogadores tentem responder ao mesmo tempo.

## Ator 4: Texto (Feedback de Interface)

Gerencia o ritmo (Pacing) do jogo entre as rodadas.

* Ao receber o sinal de `preparação` (fim de uma rodada), ele mostra o placar completo por 3 segundos.

* Esconde o placar e inicia uma contagem regressiva visual ("preparar...", "apontar...", "go!!!").

* Troca sua fantasia para mostrar qual jogador apertou o botão primeiro.

# Projeto: Modelo Scratch - Catcher / Jogo de Coletar Rápido (Arquivo 10)

*Nota: Projeto desenvolvido com alunos do 3º ano do Fundamental I em 1-2 aulas. Demonstra alta autonomia dos alunos na construção de um loop de jogo completo com mecânicas de pontuação e punição.*

## Variáveis Globais e Palco

* **Variável:** `Pontos` (Exibida na tela em modo "Large", como um placar).

* O cenário é simples, focando a atenção na mecânica de interceptação.

---

## Ator 1: Player (O Coletor - Tigela)

Lógica extremamente limpa e focada no controle horizontal.

* Ao clicar na Bandeira Verde, fixa o jogador na parte inferior central da tela (X: 0, Y: -140).

* **Movimentação:** Um loop infinito monitora as setas do teclado:

  * Seta para Direita -> `Mude x por 15`.

  * Seta para Esquerda -> `Mude x por -15`.

## Ator 2: bola (O Objeto em Queda)

Este ator gerencia tanto o "Spawner" (Gerador) quanto o "Comportamento do Clone", separando perfeitamente a lógica de criação e a lógica de ação.

* **O Gerador (Bandeira Verde):**

  * Zera a variável `Pontos`.

  * Esconde o sprite original para que ele não fique voando pela tela.

  * Inicia um loop infinito de criação:

    1. Vai para o topo da tela (Y: 160).

    2. Sorteia uma posição horizontal aleatória (`X: número aleatório entre -200 e 200`).

    3. Cria um clone de si mesmo.

    4. Aguarda um tempo aleatório entre 1 e 2 segundos antes de gerar a próxima bola.

* **O Clone (Quando começar como clone):**

  * Aparece na tela (`mostre`).

  * Inicia um loop contínuo de queda livre (`mude y por -10`).

  * **Sistema de Recompensas e Punições (Colisão):**

    * **Se tocar no Player (Sucesso):** Toca o som "Meow", adiciona +1 aos `Pontos` e deleta o clone.

    * **Se tocar na Borda (Falha):** Subtrai -1 dos `Pontos` e deleta o clone.

# Projeto: Modelo Scratch - Catcher com Níveis de Dificuldade (Arquivo 11)

*Nota: Evolução do gênero "Catcher" (pegar objetos). Este projeto destaca-se pela implementação de um fluxo completo de UI (Menu Inicial > Seleção de Dificuldade > Jogo) e pelo uso de variáveis de controle para balancear a física do jogo dinamicamente.*

## Arquitetura Geral e Fluxo de Telas (Backdrops)

O Palco (Stage) funciona como o maestro das dificuldades. Ao clicar na Bandeira Verde, o jogo inicia na `TelaInicio`.

* **Sistema de Dificuldade:** Quando o botão de dificuldade é escolhido, o Palco recebe a mensagem `jogo` e configura as variáveis mestre:

  * **Easy (Fácil):** `fallSpeed` = 5, `WaitTime` = 1, `moveSpeed` = 10.

  * **Medium (Médio):** `fallSpeed` = 10, `WaitTime` = 1, `moveSpeed` = 10.

  * **Hard (Difícil):** `fallSpeed` = 15, `WaitTime` = 0.6 (gera bolas muito mais rápido), `moveSpeed` = 17. Além disso, ativa um efeito visual psicodélico de troca de cores.

---

## Atores de Interface (Botões Play, Facil, Medio, Dificil)

Apresentam um polimento de UI (User Interface) excelente para alunos.

* **Hover Effect (Efeito de Mouse):** Todos os botões possuem um loop infinito verificando `se tocando em ponteiro do mouse`. Se sim, mudam para a fantasia "B" (botão pressionado/iluminado); senão, voltam para a fantasia "A".

* **Navegação:** O botão Play envia o sinal `dificuldades` para mostrar as opções. Os botões de opção definem a variável global `dificuldade`, enviam o sinal `jogo` e trocam o cenário para a tela de gameplay.

---

## Ator 1: Copo (Player)

* Ao receber o sinal `jogo`, ele aparece no fundo da tela.

* **Movimentação:** Monitora as setas Esquerda/Direita (ou teclas A e D). Diferente do Arquivo 10 que usava valores fixos, aqui ele se move usando a variável `moveSpeed` (que fica mais rápida na dificuldade Hard).

* Se a dificuldade for "Hard", ele fica piscando em cores diferentes (`mude o efeito cor por 25`).

## Ator 2: Bola (Spawner e Clones)

A lógica de criação é muito similar ao Arquivo 10, escondendo o original e gerando clones, mas com upgrades cruciais:

* **Gerador Dinâmico:** Ele aguarda os segundos definidos pela variável `WaitTime` (que muda conforme a dificuldade) antes de gerar o próximo clone.

* **Queda Dinâmica:** O clone não cai em uma velocidade fixa. Ele altera seu Y pela fórmula `(-5 * fallSpeed)`.

* **Detecção de Colisão Condicional:**

  * **Se tocar na Borda:** Perde 1 ponto e deleta o clone.

  * **Se tocar no Copo:** Ganha 1 ponto e deleta o clone. *(Nota técnica: há uma lógica extra genial no código que verifica se o nível não é o "Hard" para exigir que a bola toque especificamente na cor vermelha do fundo do copo `#660000`, evitando que o jogador pontue raspando a bola na borda de fora do copo).*

# Projeto: Modelo Scratch - Corrida Parallax (Estilo Top Gear) (Arquivo 12)

*Nota: Projeto focado na demonstração visual da técnica de "Parallax Scrolling" (rolagem de cenário) infinita, utilizando clones de fundo para criar a ilusão de velocidade.*

## Arquitetura Geral e Fluxo de Jogo

O jogo é guiado pelo ator `Sinaleira`, que funciona como o "Game Manager" inicial.

* **Sinaleira:** Define o `Volume`, zera o `Counter` (progresso da pista) e executa uma animação de contagem regressiva trocando de fantasias. Ao terminar, ela se esconde, toca o tema musical e envia o sinal mestre `start` para todos os outros atores começarem a se mover.

---

## Ator 1: Parallax (O Motor da Ilusão)

O cenário não é estático no Palco, ele é um Ator que se clona e rola para baixo, simulando o asfalto vindo na direção da tela.

* **Movimento Contínuo:** Um loop reduz constantemente o Y do asfalto em -15.

* **Loop Infinito:** Quando o asfalto atinge o limite inferior da tela (Y = -345), ele soma +1 ao `Counter` (medidor de distância percorrida) e teleporta de volta para o topo (Y = 345), criando uma esteira infinita.

* **Fim de Jogo:** Se o `Counter` chegar a 50, ele troca a fantasia para `road_finale` (Linha de chegada).

* **Gatilho de Cenário:** O próprio chão dita o perigo. Se ele sortear a fantasia número 4 ao nascer no topo, ele envia o sinal `obstacle` para gerar perigos na pista.

---

## Ator 2: Carro (Player e Física de Direção)

Usa uma variável local chamada `Turn` (Curva) para criar uma direção suave com "peso", em vez de movimentos duros.

* **Direção (Inércia):**

  * Seta Direita/Esquerda alteram o valor de `Turn` gradativamente (ex: +0.25 ou -0.25).

  * Se o jogador solta a tecla, um sistema de atrito reduz o `Turn` em 0.5 até zerar, fazendo o volante "voltar ao centro" sozinho.

  * O carro aponta visualmente para `(Turn * 3)` e se move lateralmente baseado no valor puro de `Turn`.

* **Centralização Y:** O carro tem uma "mola" vertical. Se você for muito para frente (Y > 0) ou muito para trás (Y < 0), ele lentamente te puxa de volta para o centro da tela, forçando você a manter o campo de visão.

* **Colisão Perfeita:** Verifica toques nas cores da grama/zebras (`#0094ff` ou `#c62d2d`), toques em inimigos ou obstáculos. Qualquer batida encerra o jogo (`crash`) e manda para a tela "TRY AGAIN".

---

## Atores 3 e 4: Inimigos e Obstáculos

Funcionam como "Spawners" (Geradores), ficando invisíveis e jogando clones na pista.

* **Inimigo (Carros Rivais):** Fica ziguezagueando de forma invisível no topo da tela. A dificuldade é progressiva: a quantidade de carros criados usa a matemática `Counter / 5` (quanto mais longe na pista, mais carros nascem juntos). Os inimigos também têm colisão e podem bater nos obstáculos!

* **Obstáculo:** Ao receber o sinal `obstacle` (enviado pelo chão), sorteia um lado da pista (Direita ou Esquerda) e lança um clone movendo-se na diagonal (`X: 13, Y: -15`), simulando que o jogador está passando rápido por placas ou pedras no acostamento.

# Projeto: Modelo Scratch - Pedra, Papel, Tesoura, Lagarto, Spock (Arquivo 13)

*Nota: Projeto desenvolvido em "pair programming" (com o irmão/estagiário) na era pré-IA. O foco pedagógico absoluto é o ensino exaustivo de Estruturas Condicionais (SE/IF) e Operadores Lógicos (E/AND) através de uma mecânica de duelo multiplayer local.*

## Arquitetura Geral e O Árbitro (Palco)

O jogo funciona em um loop contínuo de rodadas controladas por sinais (Broadcasts).

* **Variáveis Globais:** `Jogador 1` e `Jogador 2` (iniciam com o valor numérico "0").

* **O Árbitro (Stage):** Ao receber o sinal `play`, o Palco entra em um loop infinito monitorando as duas variáveis usando operadores de negação (`NOT`).

  * A condição é: `SE NÃO (Jogador 1 = 0) E NÃO (Jogador 2 = 0)`.

  * Assim que ambos os jogadores fazem suas escolhas (substituindo o "0" por um texto), a condição se torna verdadeira. O Palco então dispara o sinal `check` (verificar vencedor) e para seu próprio script de monitoramento.

---

## Atores 1 e 2: Jogadores (Input e Lockout)

Ambos os atores funcionam de forma idêntica, apenas mapeados para teclas diferentes do mesmo teclado.

* **Mapeamento Jogador 1 (Direita):** `i` (Pedra), `j` (Papel), `l` (Tesoura), `u` (Lagarto), `o` (Spock).

* **Mapeamento Jogador 2 (Esquerda):** `w` (Pedra), `a` (Papel), `d` (Tesoura), `q` (Lagarto), `e` (Spock).

* **Mecânica de "Blind Pick" (Escolha Cega):** * Durante a fase de escolha, a fantasia fica em branco (`blank`).

  * Quando o jogador aperta uma tecla válida, a variável correspondente recebe o texto da escolha (ex: "Lagarto") e o script é **interrompido** (`Pare este script`). Isso cria um "Lockout", impedindo que o jogador troque de ideia e mude sua jogada depois de ter escolhido.

* **Revelação:** Somente após o Palco enviar o sinal `check`, os Atores verificam suas próprias variáveis e mudam para a fantasia correspondente (mostrando a Pedra, o Papel, etc., na tela simultaneamente).

---

## Ator 3: Resultado (A Tabela Verdade)

Este é o núcleo lógico do projeto. Ele fica invisível (`hide`) durante a escolha e só aparece ao receber `check`.

* **Motor de Resolução (IFs + ANDs):** Possui uma árvore massiva de condições encadeadas para cobrir todas as combinações possíveis do jogo.

  * O bloco central é sempre: `SE (Jogador 1 = [Escolha A]) E (Jogador 2 = [Escolha B])`.

  * **Exemplos de Lógica:**

    * Se `J1 = Pedra` E `J2 = Tesoura` -> Muda fantasia para "1" (Vitória do P1).

    * Se `J1 = Lagarto` E `J2 = Spock` -> Muda fantasia para "1".

    * Se `J1 = Tesoura` E `J2 = Spock` -> Muda fantasia para "2" (Vitória do P2).

    * Condições de empate (`draw`) também são explicitamente mapeadas (ex: Se `J1 = Papel` E `J2 = Papel`).

* **Reset da Rodada:** Após exibir o resultado (fantasia "1", "2" ou "draw"), o script aguarda 2 segundos e dispara o sinal `play` novamente, resetando as variáveis para "0", escondendo o resultado e iniciando um novo duelo automaticamente.

# Projeto: Modelo Scratch - Máquina de Estados: Pulo e Física (Versão 9) (Arquivo 14)

*Nota: Protótipo de estudo focado isoladamente na mecânica de pulo (Jump), gravidade e colisão de terreno. Apresenta suporte a multiplayer local (dois jogadores) e uma máquina de estados visual gerenciada por Sinais (Broadcasts).*

## Arquitetura Geral e Física Modular

O projeto utiliza Blocos Customizados (`Gravidade`) para encapsular a matemática da física, mantendo o Game Loop limpo.

* **Sistema de Estados Visuais:** Em vez de trocar as fantasias diretamente na lógica de movimento, o código emite sinais (`Move`, `Jump`) que disparam rotinas de animação isoladas.

* **Cenário Dinâmico (Parallax):** Um ator gerencia o fundo gerando clones de si mesmo que se movem para a esquerda (`X -10`) e se reciclam ao chegar na borda da tela (`X: -450` volta para `X: 450`), criando a ilusão de avanço contínuo.

---

## Atores 1 e 2: Moto P1 e Moto P2 (Os Jogadores)

Os dois atores possuem lógicas idênticas, mas com variáveis e controles totalmente separados para evitar interferência entre os jogadores.

* **Variáveis Independentes:**

  * P1 usa `vspeedP1` e `CanJumpP1`. Controle de pulo: Tecla `W`.

  * P2 usa `vpseedP2` e `CanJumpP2`. Controle de pulo: `Seta para Cima`.

* **Motor de Gravidade (O Bloco Customizado):**

  * Subtrai constantemente -1 da `vspeed`.

  * **Colisão Baseada em Cores (Ground & Slope):** O sistema verifica a intersecção de cores específicas do cenário (ex: `#391831` tocando em `#4e2e6c`).

  * **Sub-Stepping de Rampa:** Se o personagem detecta o chão de forma imperfeita, ele possui um sistema de correção (`mude y por 1`) que o empurra suavemente para cima. Isso evita que o sprite fique "preso" no chão ou trave em subidas.

* **Máquina de Estados de Animação:**

  * Se Pula: Define `CanJump` para 0, envia o sinal `Jump` e aplica a força `vspeed = 12`. O sinal `Jump` aciona um loop que toca a animação de salto e, ao final, devolve o controle definindo `CanJump = 1`.

---

## Ator 3: Hitbox Seguidora (Ator 1)

Uma técnica avançada para evitar bugs de colisão causados por animações assimétricas.

* Fica em um loop infinito indo exatamente para as coordenadas X e Y da `Moto P2`.

* Se essa hitbox invisível encostar no `inimigoAtacando`, ela dispara o comando `Pare todos` (Game Over).

# Projeto: Modelo Scratch - Catcher de Frutas / Itens Bons e Ruins (Arquivo 15)

*Nota: Projeto focado em mecânicas de coleta. Introduz controle por mouse e lógica condicional baseada em fantasias (Costumes) para diferenciar o comportamento e a pontuação de itens que caem.*

## Variáveis Globais

* `Pontos`: Placar do jogo, visível na tela em modo grande. Inicia zerado a cada partida.

---

## Ator 1: Fruit Salad (O Jogador / Apanhador)

Mecânica de controle super direta e fluida, focada na precisão do usuário.

* Ao clicar na Bandeira Verde, entra em um loop infinito.

* **Movimentação (Mouse Control):** Fixa o Y em `-151` (parte inferior da tela) e define o X constantemente para a coordenada `posição x do mouse`. O jogador não precisa clicar, apenas deslizar o mouse pela tela para a tigela acompanhar.

---

## Ator 2: Sprite1 (Frutas e Bolas / Spawner e Clones)

Possui 8 fantasias misturadas: 4 frutas (maçã, banana, laranja, donut) e 4 bolas de esportes (futebol, beisebol, basquete, praia). O código usa o número da fantasia para separar o que é "bom" do que é "ruim".

* **O Gerador (Bandeira Verde):**

  * Esconde o sprite original.

  * Loop infinito:

    1. Vai para o topo da tela (Y: 160).

    2. Sorteia um X aleatório entre -240 e 240.

    3. **Sorteio de Item:** Troca para uma fantasia aleatória entre 1 e 7 (misturando frutas e bolas).

    4. Aguarda 1 segundo e cria o clone.

* **Comportamento do Clone e Física Diferenciada:**

  * O clone aparece e inicia seu loop de queda.

  * **Checagem de Peso:** * Se o `número da fantasia` for maior que 4 (ou seja, é uma Bola de esporte), ele cai mais rápido (`mude y por -16`).

    * Senão (é uma Fruta ou Donut), cai mais devagar (`mude y por -10`).

* **Sistema de Colisão e Regras de Pontuação:**

  * **Se tocar na Borda (`_edge_`):** O item simplesmente some (Deleta o clone).

  * **Se tocar no Jogador (`Fruit Salad`):**

    * Nova checagem lógica: Se o `número da fantasia` for maior que 4 (Bola/Inimigo), o jogador é punido perdendo -1 Ponto.

    * Senão (Fruta/Aliado), o jogador é recompensado ganhando +2 Pontos.

    * Após o cálculo, o clone é deletado.

# Projeto: Modelo Scratch - Máquina de Estados V6: Ataque e Hitbox (Arquivo 16)

*Nota: Protótipo de jogo de luta 1v1 focado na sincronização de animação com caixas de colisão (Hitboxes) e interrupção de estados (Lockout de movimento durante o ataque).*

## Gerenciamento de Partida (Palco e UI)

* **Ator `Fight!` (O Maestro):** Cria a clássica contagem regressiva de jogos de luta. Ao clicar na Bandeira Verde, exibe os números "3, 2, 1" (com 1 segundo de espera entre eles), esconde-se e envia o sinal mestre `Start`.

* **Palco (O Cronômetro):** Ao receber `Start`, inicia um loop contando a variável global `Tempo`. Quando o tempo chega a 120 segundos, aciona o comando `Pare todos`, servindo como o "Time Over" da partida.

---

## Atores: Zero_P1 e Zero_P2 (Os Lutadores)

A lógica é espelhada para ambos, garantindo equilíbrio. O controle de movimento não é manual, mas sim um sistema de "Patrulha Automática", forçando o jogador a focar apenas no *timing* do ataque.

* **Máquina de Estados (Variável de Lockout):** Utilizam a variável `Atack_P1` (e `Attack_P2`) como um interruptor (0 = Atacando; 1 = Livre).

* **O Bloco `Move` (Patrulha):**

  * Só executa se o estado for Livre (`Attack = 1`).

  * O personagem anda sozinho (Adiciona a variável `Dir` ao eixo X).

  * Ao bater nas bordas virtuais da arena (`X > 210` ou `X < -210`), ele inverte a direção (vira o sprite 180º e inverte o valor de `Dir` de 10 para -10).

* **O Bloco `Attack`:**

  * P1 ataca com a tecla `A`; P2 ataca com a tecla `L`.

  * Se a tecla for pressionada e o personagem estiver Livre, ele altera o estado para Atacando (`Attack = 0`), o que imediatamente paralisa a função de movimento. Em seguida, emite o sinal `Attack_P1` (ou P2).

* **Animação e Frame Data (Ao receber sinal de Ataque):**

  * Roda um loop de 11 repetições de troca de fantasia (0.05s de espera).

  * **O Pulo do Gato:** Um `IF` interno verifica `se nome da fantasia = 8`. Apenas neste frame exato da animação (quando a espada está esticada), o personagem cria um clone do seu ator de Hitbox.

  * Ao fim do combo, aguarda 1 segundo (Cooldown/Recovery) e devolve o controle (`Attack = 1`).

---

## Atores: Hitbox_P1 e Hitbox_P2 (A Espada Invisível)

São criados como clones apenas no frame de impacto da animação e duram uma fração de segundo.

* **Ancoragem Dinâmica:** Ficam em um loop infinito verificando a direção do seu dono (90 ou -90) para se posicionar exatamente 60 pixels à frente do atacante (`X do Dono + 60` ou `- 60`).

* **Resolução de Dano:**

  * Ao nascer como clone, fica visível.

  * Se tocar no lutador oponente, envia o sinal de acerto (ex: `Hit_P1`) e se deleta instantaneamente.

  * Se não bater em nada (Whiff), espera 0.1s e se deleta.

* **Placar:** O sinal de acerto é recebido pelo lutador que atacou, somando +1 na variável `Pontos_P1` (ou P2).

# Projeto: Modelo Scratch - Máquina de Estados V4: Movimento, Dash e Pulo (Arquivo 17)

*Nota: Versão inicial da máquina de estados do protagonista (Zero). Foca na construção do motor físico de gravidade (com correção de rampas) e na introdução da mecânica de Dash (Esquiva) baseada em temporizador.*

## Arquitetura Geral e Controles

O código do jogador (`BlueZero`) é estruturado em Blocos Customizados que separam completamente o controle do jogador da atualização visual (Animação).

* **Controles:** Setas Direita/Esquerda (Andar), `X` (Pulo), `Z` (Ataque), `Espaço` (Dash).

* **Variáveis de Controle:** `CanAttack` e `CanJump` funcionam como interruptores lógicos (0 = bloqueado, 1 = liberado).

---

## Motor Físico (O Bloco "Gravidade")

Esta é a semente do motor físico perfeito que você usou nas versões posteriores.

* Aplica a gravidade subtraindo -1 da variável `vspeed` a cada frame.

* **Detecção de Chão:** Verifica duas cores em simultâneo (Cinza `#202020` e Verde `#00c800`). Se tocar, zera a `vspeed` e libera o pulo (`CanJump = 1`).

* **Sub-Stepping (Correção de Rampa):** Possui 3 blocos condicionais encadeados que empurram o personagem 1 pixel para cima (`Y + 1`) caso ele fique preso no chão. Isso permite que o sprite suba rampas suavemente sem travar a animação de corrida.

---

## Mecânica de Dash (O Bloco "Dash")

Uma implementação muito criativa para criar invulnerabilidade/movimento rápido temporário.

* **Sistema de Cooldown (Cronômetro):** Ao apertar Espaço, o jogo checa o `Cronômetro` (Timer) nativo do Scratch. A condição exige que o timer seja `>= 0.5` segundos. Isso impede que o jogador "espame" o botão de esquiva infinitamente.

* **Execução da Esquiva:** * Envia o sinal `Dash`.

  * Verifica a direção atual do personagem (90 ou -90).

  * Usa o bloco `deslize por 0.2 segs` para mover o X atual + 90 pixels para frente, criando um avanço linear rápido e suave.

  * Ao final do deslize, zera o `Cronômetro` (reiniciando o tempo de recarga de meio segundo).

---

## Máquina de Estados Visual (Broadcasts)

O personagem nunca troca de fantasia diretamente quando o jogador aperta um botão. Ele emite Sinais (`Stay`, `Move`, `Attack`) que são capturados por scripts isolados, criando um sistema de "Sprite Sheet" (Folha de Sprites) dentro do Scratch.

* **Loop Inteligente de Animação:** Como todas as fantasias do Zero estão no mesmo ator, o código usa matemática para não misturar animações.

  * **Ao receber `Move`:** Verifica `Se número da fantasia > 14`. Se for maior, ele força o retorno para a fantasia número 4 (início da corrida). Senão, ele simplesmente passa para a próxima fantasia. Isso cria um loop contínuo apenas nas imagens de corrida, ignorando os frames de ataque ou pulo!

# Projeto: Modelo Scratch - Jogo de Luta Completo / Máquina de Estados V24 (Arquivo 18)

*Nota: A culminação do projeto de Máquina de Estados. Um jogo de luta 1v1 completo com menu interativo, motor de física avançado, Frame Data preciso e um sistema de Vida/Energia segmentado. Desenvolvido e ensinado a uma turma em um único semestre.*

## 1. Interface e Menus (UI/UX)

O projeto agora possui um fluxo de jogo profissional, saindo da tela preta direto para um Menu.

* **Menu Interativo (Pointer):** O jogador não usa o mouse. Um cursor (`Pointer`) é controlado pelas setas (Cima/Baixo) usando a variável matemática `MovePointer`, limitando as posições Y para selecionar entre "Start" e "Options", exatamente como nos consoles de 16-bits.

* **HUD (Barras de Vida):** Os atores `LifeBar_1` e `LifeBar_2` possuem 27 fantasias cada (animação da barra esvaziando).

* **Sistema de Rounds (Vida vs. Energia):** * Cada jogador tem `Energia` (8 pontos, os "hits" que aguenta) e `Vida` (2 pontos, os "rounds/estoques").

  * Quando toma dano, perde Energia e a barra avança uma fantasia. Se a Energia zerar, ele perde 1 de `Vida`, a Energia reseta para 8, e ele tem mais uma chance. Se a `Vida` chegar a -1, o sinal `Morte` é acionado.

---

## 2. Motor Físico (Bloco Customizado: Gravidade)

A física foi completamente encapsulada em um bloco rosa (Custom Block) para limpar o loop principal de movimento.

* **Queda e Aceleração:** Subtrai `-1` da variável local `Gravidade_Px` a cada frame, criando uma queda acelerada realista.

* **Colisão por Cores e Rampas:**

  * **Chão (Ciano `#00ffff`):** Zera a gravidade e libera o pulo (`PodePular = 1`).

  * **Rampas/Paredes (Roxo `#3d1f4c`):** Utiliza um sistema de *Sub-Stepping* (passos de formiga). Se o jogador afundar no chão inclinado, o código empurra o Y em `+1` repetidas vezes (até 3x) para mantê-lo na superfície, permitindo subir rampas sem travar. Se for um teto, ele empurra para baixo (`Y -5`).

---

## 3. Máquina de Estados e Controle do Jogador

A arquitetura abandona o "código espaguete" e usa *Flags* (Bandeiras) e *Broadcasts* (Mensagens) para isolar as ações.

* **Variáveis de Bloqueio (Lockout):** `PodePular` e `PodeAtacar` funcionam como chaves de `0` e `1`.

* **Os 4 Estados Principais:** O jogador envia os sinais `paradopx`, `andandopx`, `pulandopx`, `atacandopx`. Cada sinal possui seu próprio bloco de animação que não interfere nos outros.

* **Animação de Entrada:** Antes da luta começar, os personagens executam uma animação de "Teleporte/Aterrissagem" (`ZeroEntrada-1` ao `6`), dando aquele toque especial de apresentação.

---

## 4. O Sistema de Combate (Hitboxes e Frame Data)

A mecânica de ataque é onde o projeto brilha tecnicamente, utilizando sincronização perfeita entre a imagem e a área de dano.

* **Gatilho de Ataque:** Ao apertar o botão (P1 = `F`, P2 = `Espaço`), o estado muda e o personagem inicia a sequência de imagens do golpe de espada.

* **Frame Data (O Pulo do Gato):** Dentro do loop de animação do ataque, há um verificador constante: `Se número da fantasia = 21`. **Somente neste milissegundo exato** (quando a espada corta a tela), o lutador invoca um Clone do seu ator `Hitbox`.

* **Resolução da Colisão (Hitbox_Px):**

  * O clone da Hitbox nasce 45 pixels à frente do atacante (calculando a direção `90` ou `-90`).

  * Ele verifica se tocou no oponente.

  * **I-Frames (Proteção contra Multi-Hit):** A hitbox verifica a fantasia atual do inimigo (`costume # > 17 e < 33`). Isso garante que ela não cause dano se o oponente já estiver no meio da animação de sofrer dano (invulnerabilidade temporária).

  * Se for um acerto limpo, envia o sinal `P1_Acertou` (ou P2) para a barra de vida computar o estrago.

# Projeto: Modelo Scratch - Labirinto Completo com Seleção (Arquivo 19)

*Nota: Projeto clássico de labirinto, destacando-se pelo ciclo de vida completo do jogo (Game Loop de UI) e sistema de seleção de personagens via Broadcast.*

## Arquitetura Geral e Fluxo de Telas (Backdrops)

O Palco gerencia o HUD (Interface) e o Cronômetro, além de ditar o estado atual do jogo através de 5 cenários: `Tela Inicial`, `Seleção de Personagem`, `Labirinto`, `Game Over` e `You Win`.

* **Cronômetro (Timer):** Quando o cenário muda para `Labirinto`, o Palco mostra as variáveis globais `Vida` (inicia em 5) e `Tempo` (inicia em 60). Ele entra em um loop `Repita 60 vezes` que subtrai -1 do `Tempo` a cada 1 segundo.

---

## O Sistema de Seleção (Atores 2 a 9)

* **Start:** O botão inicial (Ator 2) apenas avança o cenário para a `Seleção de Personagem`.

* **Botões de Personagem:** Os Atores 3 a 9 funcionam como a tela de seleção. Quando clicados, eles enviam um sinal específico (ex: `Mario`, `Link`, `Toad`, `MegaMan`) e mudam o cenário para o `Labirinto`.

---

## Ator 1: Jogador (A Lógica do Labirinto)

Este é o único ator jogável, que adapta sua aparência de acordo com o sinal recebido na tela de seleção, alterando sua fantasia (Costume). Ele é fixado na posição inicial (X: -203, Y: 152).

* **Movimentação e Lockout (Bloqueio):**

  * Controlado pelas Setas do teclado. Ao invés de mudar X e Y diretamente, ele usa o sistema de "Apontar para a direção" (90, -90, 0, 180) e move 10 passos.

  * **Trava de Morte:** Antes de cada passo, o bloco de movimento tem um `IF` que verifica `Se (Vida = 0) OU (Tempo = 0)`. Se for verdadeiro, ele executa o comando `Pare todos` (Stop All), impedindo que o jogador se mova como um "fantasma" após o fim do jogo.

* **Sistema de Colisão (As Paredes e a Chegada):**

  * Um loop infinito roda paralelamente checando as cores sob o personagem.

  * **Parede (Cor `#010003` / Preto):** Perde -1 de `Vida` e usa a função `Deslize` para retornar suavemente à posição inicial (X: -203, Y: 152), agindo como uma punição de tempo.

  * **Vitória (Cor `#e5e5e5` / Cinza):** Se tocar no objetivo final, o personagem se esconde, muda para a tela `You Win` e trava o jogo.

  * **Derrota:** Se o loop detectar `Vida = 0` OU `Tempo = 0`, ele muda para a tela `Game Over`.

---

## Atores 10 e 11: Interface de Fim de Jogo

Aparecem apenas nas telas de Game Over.

* **Ator 10 (Restart):** Reseta o `Tempo` para 60, a `Vida` para 5 e devolve o jogador para a tela de `Seleção de Personagem`.

* **Ator 11 (Home):** Volta para a `Tela Inicial`.

# Projeto: Modelo Scratch - Labirinto com Inimigos Avançados e Power-up (Arquivo 20)

*Nota: Evolução do gênero de labirinto. Introduz IA de patrulha baseada em coordenadas (Waypoints), mecânica de inimigos "fantasmas" que somem e reaparecem, e um sistema de invencibilidade temporária.*

## Arquitetura Geral e Variáveis Globais

O projeto é estruturado em fases (Backdrops de `Fase 1` a `Fase 5`), com o Palco (Stage) atuando como o temporizador do Power-up.

* **Variáveis:** * `Poder` (Interruptor: 0 = Normal, 1 = Invencível).

  * `Contador` (Cronômetro do Power-up).

  * `Invisivel` (Interruptor de colisão dos inimigos).

---

## Ator: Mario (Jogador e Lógica de Colisão)

Possui scripts separados para movimentação e para o gerenciamento de danos.

* **Movimentação e Morte de Cenário:**

  * Controlado pelas Setas (Aponta para a direção e move 5 passos).

  * **Colisão com a Parede (Preto `#000000`):** Se errar o caminho e tocar na parede, aciona uma animação de morte muito criativa. O personagem vai para o centro da tela (0,0), cresce de tamanho (`size 1000`) e roda um loop de 100 repetições aplicando o efeito `Whirl` (Redemoinho) e `Ghost` (Fantasma), sendo "sugado" antes de mudar para a tela de `Game Over`.

* **Colisão com Inimigos (Condições Compostas):**

  * O jogador só morre (Game Over) ao tocar nos Atores 2, 3 ou 4 **SE** a variável `Poder` for igual a 0 (ou seja, não tem o power-up) **E** a variável `Invisivel` for igual a 1.

* **Coleta do Power-up:** Se tocar no `Ator 1` (O Item), envia o sinal `Poder`.

* **Efeito Visual do Power-up:** Ao receber o sinal `Poder`, entra em um loop infinito mudando o efeito `Color` por 25 (ficando piscando colorido como o Mario com a Estrela) até que a variável `Poder` volte a ser 0.

---

## Ator 1: O Item de Poder (Power-up)

* Começa visível em uma coordenada fixa (X: 203, Y: 102).

* Ao receber o sinal de `Poder` (quando o jogador encosta nele), ele simplesmente se esconde (`Hide`), consumindo o item.

---

## Palco (Stage): O Temporizador do Power-up

Responsável por garantir que a invencibilidade acabe.

* Ao receber o sinal `Poder`, define a variável `Poder` para 1 e zera o `Contador`.

* Entra em um loop `Sempre` adicionando +1 ao `Contador` e esperando 0.5 segundos.

* Se o `Contador` chegar a 10 (ou seja, 5 segundos reais de jogo), ele devolve a variável `Poder` para 0, zera o contador e para o próprio script, encerrando a invencibilidade.

---

## Atores 2, 3 e 4: Inimigos Avançados (Patrulha e Fantasma)

Todos os inimigos possuem dois scripts rodando em paralelo (Multithreading): um para o movimento e outro para a visibilidade.

* **A IA de Patrulha (Waypoints):** Em vez de andar aleatoriamente, cada inimigo possui um loop infinito com 4 blocos `Deslize por 1 seg até X/Y`. Isso cria uma rota geométrica fixa de patrulha que o jogador precisa decorar.

* **A Mecânica "Phasing" (Fantasma):**

  * Loop infinito que altera o efeito `Ghost` em +1 por 100 vezes (desaparecendo suavemente).

  * Espera um tempo aleatório entre 1 e 5 segundos (completamente invisível).

  * Altera o efeito `Ghost` em -1 por 100 vezes (reaparecendo suavemente).

  * Espera outro tempo aleatório entre 1 e 5 segundos (completamente sólido).

* **O Truque do Ator 4 (Controle de Dano):** O Ator 4 é o "mestre" da variável `Invisivel`. Enquanto ele está desaparecendo, ele seta `Invisivel` para 0. Quando reaparece, seta para 1. *(Nota: Como a colisão do jogador exige que `Invisivel` seja 1 para tomar dano, isso cria janelas de segurança onde o jogador pode atravessar os inimigos!)*

# Projeto: Modelo Scratch - Máquina de Estados V3: Movimento e Tiro (Arquivo 21)

*Nota: Protótipo inicial de Máquina de Estados. Trata-se de um duelo 1v1 de movimentação estritamente vertical, focando no sistema de interrupção de animações via Mensagens (Broadcasts) e no disparo de projéteis lineares.*

## Arquitetura e Variáveis Globais

O jogo foca em uma arena fixa de eixo Y.

* **Variáveis de Vida:** `P1` e `P2` (Ambas iniciam com 10 pontos e são exibidas na tela em formato "Large").

---

## Atores: P1 e P2 (Os Lutadores)

Posicionados em lados opostos da tela (X: -223 e X: 227). Possuem uma lógica de controle contínua que define o estado da animação em tempo real.

* **Movimentação e Estados Lógicos:**

  * O código verifica os inputs constantemente em um loop infinito.

  * **P1 (W/S):** Se aperta `W`, sobe (Y + 10) e envia o sinal `MovendoZero1`. Se aperta `S`, desce (Y - 10) e envia o mesmo sinal.

  * **P2 (Setas Cima/Baixo):** Mesma lógica, enviando o sinal `MovendoZero2`.

  * **Gatilho de Repouso:** Um bloco de Operadores Lógicos impecável verifica: `SE NÃO (Tecla Cima) E NÃO (Tecla Baixo)`. Se o jogador solta os controles, o sistema dispara o sinal de repouso (ex: `ParadoZero1`).

* **Máquina de Animação (Receptores):**

  * **Ao receber "Movendo":** Verifica se o número da fantasia atual é o limite da animação de caminhada. Se for, ele reinicia o ciclo (volta para a fantasia 0 ou 1); se não for, ele avança para a `Próxima Fantasia`. Isso cria um loop limpo enquanto o botão é segurado.

  * **Ao receber "Parado":** Força a mudança imediata para a fantasia estática (Fantasia 4 ou 5), interrompendo a animação de pernas.

---

## Atores: ShootP1 e ShootP2 (Sistema de Projéteis)

Utilizam a técnica clássica de "Ator Âncora", onde o original fica invisível e gera clones alinhados à posição do atirador.

* **O Gatilho (Spawner):**

  * P1 atira com a tecla `D`; P2 atira com a `Seta Esquerda`.

  * Ao apertar o botão, cria um clone de si mesmo e aciona um *cooldown* de 0.5 segundos usando o bloco de Espera, impedindo o "spam" de tiros.

  * **Mira Dinâmica:** O gerador (invisível) fica travado na coordenada X de tiro e segue o Y atual do jogador usando o bloco matemático `(Y position of P1) + 10`, garantindo que o tiro saia da altura da arma.

* **Comportamento do Clone:**

  * Aponta para a direção do inimigo (P1 = 90; P2 = -90), torna-se visível e entra em um loop infinito movendo-se 10 passos.

  * **Resolução de Colisão:**

    * **Se tocar na Borda:** É deletado.

    * **Se tocar no Inimigo (P1 ou P2):** Altera a variável global de vida do inimigo em `-1` e se deleta instantaneamente.

# Projeto: Modelo Scratch - Labirintos 2: Mudando Cenários (Arquivo 22)

*Nota: Projeto focado na consolidação da movimentação em eixos (Top-Down) e no fluxo de progressão de níveis através de cenários múltiplos.*

## Arquitetura de Fases (Palco/Stage)

O projeto contém uma estrutura completa de *Level Design* embutida nas fantasias (Backdrops) do Palco, preparando o terreno para um fluxo de jogo longo.

* **Cenários Disponíveis:** `Start Page`, `Fase 1` até `Fase 5`, `Game Over` e `You Win`.

---

## Ator 1: Jogador (Motor de Labirinto Top-Down)

O script deste ator é extremamente enxuto e roda inteiramente dentro de um único loop `Sempre` (Forever) ativado pela Bandeira Verde.

* **Setup Inicial:** Ao iniciar, o personagem é fixado na coordenada de origem (X: 212, Y: 158).

* **Movimentação Cartesiana Pura:**

  * Em vez de usar ângulos, o código manipula o Plano Cartesiano diretamente em pequenos incrementos (+1 ou -1 pixel), garantindo precisão cirúrgica em corredores estreitos.

  * `Seta para Cima` -> Altera Y por 1.

  * `Seta para Baixo` -> Altera Y por -1.

  * `Seta para Direita` -> Altera X por 1.

  * `Seta para Esquerda` -> Altera X por -1.

* **Sistema de Punição (Colisão com a Parede):**

  * O código monitora constantemente a cor preta (`#000000`).

  * Se o jogador encostar na parede, ele não morre imediatamente. O jogo utiliza o bloco `deslize por 1 segs para X: 212 Y: 158`.

  * Isso cria um efeito visual de "puxão" de volta para o início da fase, servindo como uma punição de tempo (já que o jogador perde 1 segundo assistindo o personagem voltar) sem precisar criar telas complexas de Game Over prematuras.

# Projeto: Modelo Scratch - Labirinto Base / Inimigos sem IA (Arquivo 23)

*Nota: Arquivo pedagógico do tipo "Template" (Molde). O jogador e o cenário já possuem a lógica base programada, enquanto os atores inimigos foram deixados sem scripts (em branco) para que os alunos construam as mecânicas de patrulha e dano durante a aula.*

## Arquitetura Geral e Cenários

O projeto mantém a estrutura de fases embutida nas fantasias do Palco (`Fase 1` a `Fase 5`, `Start Page`, `Game Over`, `You Win`).

---

## Ator 1: Mario (Motor Base e Animação de Morte)

Possui a lógica principal de interação com o cenário.

* **Movimentação Cartesiana (Top-Down):** Utiliza alteração direta de X e Y (+1 ou -1) baseada nas setas do teclado, garantindo movimentação precisa em corredores de 1 pixel de largura.

* **Sistema de Morte Teatral (Colisão com Parede `#000000`):**

  * Ao errar o caminho e encostar no preto, o cenário muda para `Game Over`.

  * O personagem é teleportado para o centro da tela (0,0).

  * Executa um loop de 100 repetições crescendo de tamanho (`1000%`), aplicando o efeito de distorção `Whirl` (Redemoinho) em +25 e o efeito `Ghost` (Fantasma) em +1. Isso cria a ilusão de que o personagem foi sugado por um buraco negro.

* **Colisão com Inimigos (Prévia):** Já existe um `IF` programado verificando se o jogador toca no `Ator 2`. Se tocar, ele sofre uma variação da animação de morte (apenas o Redemoinho, sem ficar invisível).

---

## Atores 2, 3 e 4: Os Inimigos (Massa de Modelar)

* Foram posicionados na tela em coordenadas específicas (ex: Ator 2 em X: 21, Y: -21).

* **Ausência de Código:** Não possuem nenhum bloco de lógica. Estão estruturalmente preparados para receber as mecânicas de *Waypoints* (Patrulha) e *Phasing* (Ficar invisível) pelas mãos dos alunos.

# Projeto: Modelo Robótica/Scratch - Duck Hunt WeDo 2.0 (Arquivo 24)

*Nota: Releitura do clássico "Duck Hunt" (NES). Projeto de hardware/software híbrido utilizando a extensão LEGO WeDo 2.0. O jogador usa um controle físico montado em blocos LEGO, onde a inclinação move a mira e a aproximação da mão no sensor dispara a arma.*

## Arquitetura Geral e Variáveis de Sessão

O Palco gerencia um sistema de "Rodadas" e "Munição" idêntico ao jogo original de 8-bits.

* **Munição:** `shots` (Inicia com 3 tiros por pato).

* **Ciclo da Rodada:** `ducknumber` (Conta de 1 a 10 patos por rodada) e dez variáveis booleanas de estado (`duck1dead` até `duck10dead`) para registrar quais patos foram abatidos na barra de progresso inferior.

* **Variável de Bloqueio:** `cutscene` (Impede o jogador de atirar enquanto o cachorro está na tela).

---

## Ator: Sprite2 (A Arma / Controle LEGO WeDo)

Este é o cérebro da integração com a robótica. Ele substitui completamente o uso de mouse ou teclado por dados captados dos sensores físicos.

* **Movimentação da Mira (Sensor de Inclinação):**

  Lê constantemente o bloco `wedo2_isTilted` (Está inclinado?).

  * Se Inclinado para **Cima** -> Altera Y em +3.

  * Se Inclinado para **Baixo** -> Altera Y em -3.

  * Se Inclinado para **Esquerda** -> Altera X em -3.

  * Se Inclinado para **Direita** -> Altera X em +3.

* **O Gatilho (Sensor de Distância):**

  * Possui um `IF` que verifica o bloco `wedo2_getDistance` (Qual a distância lida pelo sensor?).

  * **A Condição Composta:** Se `Distância < 15` **E** `shots > 0` **E** `cutscene = 0`:

    1. Toca o som clássico do tiro (`blast`).

    2. Envia o sinal `duckcheck` (Verifica se a mira está encostando no pato).

    3. Reduz -1 da variável `shots`.

    4. Adiciona um pequeno "cooldown" de 0.5s para evitar que uma única passada de mão dispare os 3 tiros de uma vez.

---

## Ator: Sprite3 (O Pato / Alvo Inteligente)

Gerencia o próprio voo, velocidade e detecção de acerto.

* **Spawn Dinâmico:** Ao iniciar, sorteia uma direção aleatória (1 a 4) e aponta para o ângulo correspondente (90, -90, etc.).

* **Movimentação:** Move-se continuamente pelo valor da variável `duckspeed` e rebate nas bordas (`if on edge, bounce`).

* **Resolução do Tiro:**

  * Ao receber o sinal `duckcheck` (vindo da Arma/Robô), ele verifica `Se tocando em [Sprite2] (A Mira)`.

  * Se sim: Envia o sinal `duckdie`, troca a fantasia para o pato assustado, aguarda 0.5s, muda para a fantasia caindo e altera seu Y para baixo até sumir no mato (tocando no chão).

* **Fuga:** Se a variável `shots` chegar a 0 e o pato não foi acertado, aciona a rotina `duckflyaway` (voar para longe e escapar).

---

## Ator: Sprite1 (O Cachorro)

Recria perfeitamente as animações icônicas de provocação e recompensa do jogo de NES.

* **Ao receber `duckflyaway` (Derrota):** Sobe do mato, toca o som clássico `doglaugh` e troca as fantasias simulando a risada para o jogador.

* **Ao receber `dogsmiley` (Vitória):** Sobe do mato segurando o pato abatido na mão (Fantasia `dogcaughtduck`).

# Projeto: Modelo Scratch - Tiro ao Alvo / Festa Junina (Arquivo 25)

*Nota: Projeto desenvolvido sob encomenda para uma professora do Fundamental I para uso em uma Festa Junina escolar. Destaca-se pelo uso de pseudo-3D (escala) e mecânica de precisão baseada em timing (um botão).*

## Arquitetura Geral e Palco (Stage)

O jogo funciona como uma clássica barraca de tiro.

* **Música Ambiente:** O projeto conta com um arquivo de áudio chamado `junin` (provavelmente uma música típica) para dar a atmosfera da festa.

* **Prevenção de Pontuação Negativa:** O Palco roda um loop contínuo verificando `se Pontos < 0`. Se o jogador errar muito e a pontuação ficar negativa, ele a trava de volta em `0`, garantindo uma experiência não-frustrante para as crianças menores.

---

## Ator 1: Jogador (A Mira / Lançador)

A mecânica de jogo exige apenas o clique do mouse, ideal para crianças do Fundamental I. O jogador não controla a movimentação, apenas o tempo do disparo.

* **Patrulha Automática (Timing):** Ao receber o sinal `start`, o jogador entra em um loop infinito usando o bloco `deslize por 0.75 segs`. Ele fica indo da esquerda (`X: -183`) para a direita (`X: 199`) na parte inferior da tela (`Y: -141`), como um pêndulo ou uma mira automática.

* **O Disparo (Input):** Um script paralelo verifica se o mouse foi clicado (`mousedown?`).

  * Se sim: Ele interrompe o script de patrulha (`Pare outros scripts neste ator`), "congelando" o lançador no lugar. Troca a fantasia para simular o arremesso e envia o sinal mestre `atirar`.

---

## Ator 3: Bola (O Projétil Pseudo-3D)

É aqui que a mágica visual acontece. A bola não apenas sobe na tela, ela simula que está sendo jogada "para o fundo" da barraca.

* **O Lançamento (Efeito Z-Axis):** Ao receber `atirar`, a bola vai para a coordenada exata do Jogador, aparece e vai para a camada de trás.

* **Voo e Escala (Pseudo-3D):** Entra em um loop repetitivo onde move `Y + 10` (sobe) e altera o tamanho (`size -2`). Ao encolher enquanto sobe, o cérebro interpreta que a bola está se afastando em profundidade!

* **Resolução de Colisão (Acerto vs Erro):**

  * **Acerto (Tocando no alvo `Cachapa`):** Sobe mais um pouquinho, esconde, soma **+1 aos Pontos**, aguarda 2 segundos e reinicia a rodada (sinal `start`).

  * **Erro (Tocando no fundo `Toque de erro`):** Esconde, subtrai **-1 dos Pontos**, aguarda 2 segundos e reinicia a rodada (sinal `start`).

---

## Atores de Cenário e Hitbox (Pipa, Cachapa, Toque de erro)

O projeto usa atores parados para montar o cenário de colisão.

* **Pipa e Cachapa:** Ficam estáticos no topo da tela (Y: 80). Eles usam a fantasia de "balão" julino. A `Cachapa` atua como a *Hitbox* invisível exata onde a bola precisa bater para marcar ponto.

* **Toque de Erro:** É um ator gigante que cobre o resto do fundo. Se a bola bater nele antes de bater no balão, o jogo entende que o tiro foi na "parede" da barraca.

# Projeto: Modelo Scratch - Tiro ao Alvo Competitivo vs IA (Estilo DKC3) (Arquivo 26)

*Nota: Protótipo inacabado inspirado no minigame "Swanky's Sideshow" de Donkey Kong Country 3. O projeto herda o motor pseudo-3D do jogo "Festa Junina" (Arquivo 25), mas inova ao implementar um bot (IA) funcional que joga contra o player.*

## Estado do Projeto

* **Jogador 1 (Player):** Atores `J1` e `Ball P1` estão presentes na tela, mas sem código (Incompleto).

* **Jogador 2 (A.I.):** Atores `J2` e `Ball P2` estão totalmente programados com movimentação autônoma, sistema de tiro, colisão e pontuação.

---

## O Sistema de IA e Mira (Atores: J2 e P2 Dummy)

A grande sacada deste código é que o "Alvo" também serve como o "Guia" para o bot. O ator `P2 Dummy` faz o papel do alvo que aparece e desaparece, e o bot `J2` lê a posição desse alvo para saber o que fazer.

* **O Alvo (P2 Dummy):** * Fica invisível na camada de trás.

  * Entra em um loop onde sorteia um X aleatório (`X: entre -130 e 130`), aparece por 2 segundos, e esconde por 1 segundo.

* **O Atirador Bot (J2):**

  * Entra em um loop contínuo e usa o bloco `Deslize por 1 seg` para ir exatamente até a `posição X de [P2 Dummy]`. Isso simula o inimigo "correndo" até alinhar a mira com o alvo.

  * **O Gatilho da IA:** Possui um verificador perfeito: `SE (Minha posição X) = (Posição X do P2 Dummy)`. Ou seja, assim que o bot termina de deslizar e se alinha perfeitamente embaixo do alvo, ele executa a animação de tiro (Muda para `costume3`), envia o sinal `J2 Atirar` e aguarda 1 segundo (cooldown).

---

## Ator: Ball P2 (O Projétil Pseudo-3D e Hitbox)

Reaproveita a mecânica de profundidade do jogo da Festa Junina, mas adiciona precisão matemática para a colisão.

* **O Disparo:** Ao receber `J2 Atirar`, vai para a arma do bot, aparece e começa a subir (`Y + 10`).

* **Efeito 3D:** Enquanto sobe, diminui de tamanho repetidamente (`size -2`), simulando que está indo para o fundo do cenário.

* **Resolução de Colisão Condicional:**

  * O código não checa apenas se tocou no alvo. Ele exige que `Tocou no [P2 Dummy]` **E** que o `Y seja maior que -65`. Isso significa que a bola só destrói o alvo se já tiver "viajado" até a profundidade (tamanho/distância) correta no eixo Z imaginário!

  * Se acertar, pontua na variável `J2`, toca o som e some.

  * Se a bola passar reto (Y > -50) e não bater em nada, ela simplesmente some (tiro perdido).

# Projeto: Modelo Scratch - Dino Runner (Sem Internet) (Arquivo 27)

*Nota: Recriação do clássico jogo do Dinossauro do Google Chrome (Estilo Endless Runner). Destaca-se pelo sistema de High Score (Recorde), curva de dificuldade dinâmica por marcos de pontuação e otimização de reciclagem de atores em vez de clones.*

## Variáveis Globais (O HUD e a Dificuldade)

* `Score` (Pontuação Atual): Roda continuamente.

* `HS` (High Score / Recorde): Mantém a maior pontuação da sessão atual salva na tela.

* `Speed` (Velocidade): Variável invisível para o jogador que dita a dificuldade do jogo. Inicia com o valor `4`.

---

## Ator 1: Player (O Dinossauro e o Game Manager)

Este ator centraliza quase toda a lógica de gerenciamento de regras do jogo em diferentes abas rodando em paralelo, todas ativadas pela tecla `Espaço`.

* **Sistema de Pontuação Passiva:**

  * Um loop infinito soma +1 ao `Score` a cada `0.1 segundos`. A pontuação é baseada em sobrevivência (tempo vivo), não em itens coletados.

* **Curva de Dificuldade Dinâmica:**

  * Um loop infinito monitora a pontuação. `SE Score = 100 OU Score = 500 OU Score = 1000`.

  * Se bater essas marcas, ele altera a variável `Speed` em `-1`. *(Nota: A lógica aqui é invertida propositalmente. Como a `Speed` será usada em um bloco de 'Tempo de Deslize', diminuir o valor faz o obstáculo cruzar a tela em menos tempo, ou seja, mais rápido).*

* **Movimentação e Pulo (Bloco Customizado `Jump`):**

  * Ao apertar `Espaço`, o jogador usa o bloco `deslize por 1 seg` para ir até o topo do pulo (`Y: -42`), aguarda 0.1s e `deslize por 1 seg` para voltar ao chão. Isso cria um pulo "flutuante" de duração fixa, forçando o jogador a prever o movimento.

* **Sistema de Game Over e Recorde (Bloco Customizado `Correr`):**

  * Monitora a colisão: `SE tocando em [obstacle]`.

  * **A Lógica do High Score:** Se bater, ele verifica `SE Score > HS`. Se for maior, ele salva o `Score` atual dentro do `HS` e para todos os scripts. Se não for maior, apenas para todos os scripts.

---

## Ator 2: Obstacle (A Ameaça Reciclável)

Possui 16 fantasias diferentes (cactos de vários tamanhos e pássaros), garantindo a variedade visual do desafio.

* **O Loop de Reciclagem (A Esteira Infinita):**

  Ao apertar `Espaço`, vai para a extrema direita fora da tela (`X: 339`).

  * Entra em um loop infinito onde `Deslize por (Speed) segs até X: -315` (extrema esquerda).

  * Quando termina a travessia, ele se esconde (`Hide`).

  * Teleporta de volta para a direita (`X: 339`).

  * Muda para a `Próxima Fantasia` (alterando o tamanho do hitbox para enganar o jogador).

  * Aparece novamente (`Show`), repetindo o ciclo infinitamente.

# Projeto: Modelo Scratch - Corrida Parallax V8 (Top Gear Avançado) (Arquivo 28)

*Nota: Evolução profunda do motor de Parallax Scrolling. Introduz física de aceleração real, múltiplas camadas de cenário para um loop perfeito, IA de oponentes com comportamento de evasão e um sistema de Ranking dinâmico.*

## 1. O Motor Parallax Duplo e Física Escalar

Diferente da versão anterior que teleportava um único chão, este jogo usa dois atores sincronizados (`Paralax_1` e `Paralax_2`) para criar uma esteira sem fim e sem falhas visuais.

* **Variáveis de Física Matemática:** O código usa o conceito clássico de `Posição = Posição + Velocidade`.

  * `Acel1`: Funciona como a *Velocidade* real do carro do jogador (o quão rápido o chão vem na direção da tela).

  * `Spd1` e `Spd2`: Apesar do nome, funcionam como a **Coordenada Y** de cada pedaço do chão.

* **O Loop Infinito:** A cada frame, `Spd1` e `Spd2` somam o valor de `Acel1`. Quando o chão 1 desce além do limite da tela (`Spd1 < -340`), ele é magicamente teleportado para o topo (`Spd1 = 340`), conectando-se perfeitamente atrás do chão 2.

---

## 2. A Sequência de Largada (Semáforo)

O jogo possui um "Game Manager" de introdução embutido no ator `lights1` (Semáforo).

* Ao iniciar, ele aparece no topo da tela, toca o áudio clássico de `racestart` e altera suas fantasias (vermelho, amarelo, verde) com esperas de tempo milimétricas.

* Ao fim da animação, ele se esconde e dispara o sinal mestre `Start`, liberando os controles do jogador e a IA dos inimigos.

---

## 3. O Jogador (racer1)

Todo o controle é feito através de Blocos Customizados profissionais (`AcelerarUp`, `AcelerarDown`, `Dirigir`), mantendo o código super limpo.

* **Aceleração Dinâmica:** O carro do jogador nunca sai do Y: -134. Quando ele aperta para cima, ele não move o carro, ele altera os limites da variável `Acel1`, fazendo o chão "cair" mais rápido.

* **Direção:** O eixo X do carro é controlado pelas setas esquerda/direita, permitindo o movimento lateral livre para desviar do tráfego.

---

## 4. A Inteligência Artificial e o Ranking (racer2, 3 e 4)

Os carros rivais são atores independentes com uma lógica de sobrevivência incrivelmente robusta.

* **Spawn Dinâmico:** Eles nascem no topo da tela (X aleatório, Y: 148) com uma velocidade própria sorteada (`Spd` do inimigo).

* **Mecânica de Evasão (Flee):**

  * Um loop monitora se o carro da IA está pisando nas cores das zebras/grama da borda da pista (`#ff6a00`, `#0094ff`, `#db3232`).

  * Se ele pisar fora da pista, o sistema aciona a variável `Flee` (Fuga), sorteando 1 ou 2. Isso obriga o carro da IA a dar um tranco para a esquerda (`X -32`) ou direita (`X +32`) para voltar ao asfalto sozinho!

* **Sistema de Posição (Rankin):**

  * O jogador inicia na 6ª posição (Variável global `Rankin = 6`).

  * O código do inimigo checa: *Se o meu Y for menor que o Y do Jogador* (ou seja, se eu fiquei para trás). Se sim, ele diminui o `Rankin` do jogador em -1 (ex: de 6º para 5º lugar) e recicla o carro inimigo para o topo da tela, gerando um novo desafio.

* **Colisão e Dano:** Se a IA bater no jogador ou em outro bot, ela executa a animação de explosão (troca por 5 fantasias de fogo), toca o efeito sonoro de batida e aciona seu próprio bloco de `Reset` para reaparecer no jogo.

# Projeto: Modelo Scratch - Calabouço / Dungeon (Arquivo 29)

*Nota: Evolução mecânica do projeto de Labirinto clássico. Introduz movimentação baseada em grade (Grid Movement) com deslize suave, sistema de chaves/portas e reset de estado ao morrer.*

## Arquitetura de Estados (Game State)

O projeto usa Sinais (Broadcasts) não apenas para ações, mas para **gerenciar o estado do mundo**.

* **O Sinal `chave`:** Avisa o jogo que o item foi coletado.

* **O Sinal `morte`:** Avisa o jogo que a rodada recomeçou, obrigando os itens coletados a reaparecerem.

---

## Ator: Personagem (O Motor de Movimentação em Grade)

Diferente do labirinto anterior que andava pixel por pixel enquanto a tecla estava pressionada, este código força o jogador a andar em "blocos" exatos, imitando jogos clássicos de RPG de mesa ou *Zelda* antigo.

* **Deslize Suave em Grade (Grid Movement):**

  * Quando uma seta é pressionada, o jogo não move o personagem de uma vez. Ele usa um loop: `Repita 8 vezes [ Mude X/Y por 4 ]`.

  * Isso faz o personagem deslizar suavemente por exatos **32 pixels** a cada toque na tecla.

* **Colisão Precisa (Anti-Clipping):**

  * A verificação de colisão com a parede (cor escurecida `#191919`) acontece *dentro* desse loop de 8 repetições.

  * Se no meio do caminho ele encostar na parede, ele recua `4` pixels instantaneamente. Isso impede aquele bug clássico do Scratch onde o personagem entra "metade do corpo" na parede e fica travado.

* **Sistema de Dano:** Um loop infinito paralelo monitora constantemente se o jogador toca nos Atores `Inimigo 1`, `Inimigo 2` ou `Inimigo 3`. Se tocar, ele teleporta de volta para a origem (`X: -192, Y: 132`) e dispara o sinal mestre `morte`.

---

## Atores: Chave e Fechadura (Sistema de Progressão)

Funcionam como um par perfeito de bloqueio e liberação de mapa.

* **A Chave:** Fica invisível ao tocar no jogador e dispara o sinal `chave`.

* **A Fechadura (Porta):** Fica bloqueando o caminho. Quando recebe o sinal `chave`, ela se esconde, liberando a passagem para o Portal.

* **O Pulo do Gato (Reset):** Se o jogador morre, a Chave e a Fechadura recebem o sinal `morte` e executam o bloco `Mostre`. Isso significa que o jogador perde o progresso daquela sala e precisa pegar a chave de novo!

---

## Atores: Inimigos 1, 2 e 3 (IA de Patrulha Waypoint)

* Os três inimigos possuem rotas de patrulha geométricas rigorosamente programadas ("Hardcoded").

* Eles usam uma sequência imensa de blocos `Aponte para a direção` seguidos de `Deslize por [X] segs até X/Y`.

* As rotas são retangulares e cobrem os corredores do calabouço em um loop infinito, forçando o jogador a decorar o "timing" de cada corredor para não ser pego.

---

## Ator: Portal (Chegada)

* Fica aguardando o toque do jogador. Quando o personagem encosta nele (após passar pela fechadura aberta), ele executa o comando `Pare Todos`, indicando o fim da fase/vitória.

# Projeto: Modelo Scratch - Realidade Aumentada / Malabarismo Virtual (Arquivo 30)

*Nota: Projeto experimental utilizando a extensão nativa de Sensor de Vídeo (Webcam). O jogador usa o próprio corpo para interagir com os elementos virtuais na tela em um formato de sobrevivência infinita.*

## Palco (Gerenciamento de Câmera e Tempo)

O Palco é o responsável por ligar o hardware e contar a pontuação.

* **Setup Inicial:** Ao clicar na Bandeira Verde, liga a câmera (`Ligue o vídeo`), define a transparência do vídeo para 50% (para o jogador se ver no fundo, mas ainda enxergar os blocos) e zera a variável `Tempo`.

* **Cronômetro de Sobrevivência:** Entra em um loop infinito esperando 1 segundo e adicionando +1 ao `Tempo`. A pontuação é literalmente o tempo que você consegue ficar sem deixar nada cair.

* **Botão de Pânico:** Um evento separado desliga a câmera e para o jogo se a tecla `Espaço` for pressionada.

---

## Ator: Fim (A Hitbox de Game Over)

* Uma barra horizontal simples posicionada na base da tela (`Y: -180`). Serve apenas como o chão/abismo do jogo.

---

## Atores: Block-A e Block-B (Os Objetos em Queda)

Os dois atores possuem lógicas idênticas, posicionados em lados opostos da tela (Esquerda `X: -160` e Direita `X: 160`).

* **Gravidade Dinâmica Independente:**

  * Cada bloco tem sua própria variável local (`Velocidade A` e `Velocidade B`).

  * Eles iniciam caindo suavemente (`Velocidade = -1`).

  * Um loop infinito altera a posição Y do bloco com base nessa velocidade.

  * Se o bloco tocar no ator `Fim` (ou seja, o jogador deixou cair), ele desliga a câmera e executa o `Pare Todos` (Game Over).

* **Interação Física (O Pulo do Gato da Webcam):**

  * O código não usa clique do mouse ou teclado para interagir com os blocos. Ele usa o evento `Quando o movimento do vídeo for > 20`.

  * Isso significa que o Scratch analisa os pixels da webcam exatamente *atrás* de onde o bloco está desenhado. Se o jogador passar a mão rapidamente atrás do bloco, o jogo detecta esse movimento.

  * **A Reação (Bounce):** Ao detectar o movimento da mão do jogador, o bloco usa o comando `deslize por 1 segs até Y: 250`. Isso cria um efeito visual super legal: o bloco não "teleporta" para cima, ele é "rebatido" ou "jogado" de volta para o topo da tela!

  * **Aumento de Dificuldade:** Logo após ser jogado para cima, o bloco altera sua velocidade caindo para um valor aleatório entre `-1 e -5`. O jogador nunca sabe se o bloco vai cair devagarzinho ou despencar na próxima vez.

# Projeto: Modelo Scratch - Pong / Jogo da Bolinha Base (Arquivo 31)

*Nota: Projeto fundamental de introdução à lógica de programação. Funciona como o modelo "Hello World" para novos alunos, apresentando movimentação 2D, colisão básica e variáveis de placar em um formato multiplayer local (1v1).*

## Variáveis Globais (Placar)

* `Time 1` e `Time 2`: Exibidas no topo da tela, monitoram a pontuação de cada jogador.

---

## Atores: Jogador 1 e Jogador 2 (As Raquetes)

Ficam travados em seus respectivos lados da tela (X: -200 e X: 200).

* **Movimentação Baseada em Ângulos:** Em vez de alterar o Y diretamente, o código utiliza o bloco `aponte para a direção`.

  * **Jogador 1:** Tecla `W` aponta para cima (0º) e move 10 passos; Tecla `S` aponta para baixo (180º) e move 10 passos.

  * **Jogador 2:** Mesma lógica, utilizando as setas `Cima` e `Baixo`.

---

## Ator: Bolinha (Motor de Física e Árbitro)

Este ator concentra 90% da inteligência do jogo, possuindo dois scripts principais rodando em paralelo a partir da Bandeira Verde.

* **Script 1: Física de Movimento e Rebatida (Bounce)**

  * Inicia no centro (0,0), aponta para uma direção aleatória entre 1º e 360º e entra em um loop infinito movendo 10 passos.

  * Possui o bloco nativo `se tocar na borda, volte` para quicar no teto e no chão.

  * **Colisão com os Jogadores:** Verifica constantemente se está tocando no `Jogador 1` ou `Jogador 2`.

    * Se tocar no J1 (Esquerda): Aponta para uma direção aleatória entre 45º e 120º (forçando a bola a ir para a direita com variação de ângulo).

    * Se tocar no J2 (Direita): Aponta para uma direção aleatória entre -45º e -120º (forçando a bola a ir para a esquerda).

* **Script 2: Sistema de Gols e Placar**

  * Um loop infinito monitora as *Hitboxes* (Atores `Goleira Time 1` e `Goleira Time 2`).

  * Se a bolinha tocar na `Goleira Time 1`: Adiciona +1 ao placar do `Time 2` (já que a bola entrou no gol do time 1), teleporta a bolinha de volta para o centro (0,0), sorteia um novo ângulo e aguarda 1 segundo antes de recomeçar o movimento.

  * A mesma lógica se aplica ao contrário caso toque na `Goleira Time 2`.

---

## Atores: Goleiras (Hitboxes de Pontuação)

* Ficam estáticas nas extremidades da tela (X: -240 e X: 240).

* Servem puramente como gatilhos de colisão para o script da bolinha saber que um gol foi marcado.

# Projeto: Modelo Scratch - Duelo de Magos / Batalha Simples (Incompleto)

*Nota: Protótipo em fase inicial de desenvolvimento focado na movimentação de eixos (Y) para dois jogadores e no teste do bloco de Rastreamento de Propriedade (Sensing) para criar uma mira alinhada.*

## Arquitetura Geral e Cenários

* O projeto conta com cenários épicos (`Castle 1` e `Galaxy`), estabelecendo a temática de batalha mágica.

* **Variável Global:** `mag loc`. Inicia com o valor 50 ao clicar na Bandeira Verde e fica visível na tela, provavelmente pensada para ser uma barra de energia, munição ou limite temporal.

---

## Atores 1 e 2: Wizard Girl (P1) e Wizard (P2)

Os lutadores já possuem a movimentação vertical puramente cartesiana programada, ficando em lados opostos da arena (P1 na esquerda em `X: -204`, P2 na direita em `X: 226`).

* **Controles P1 (Wizard Girl):**

  * Utiliza um mapeamento de teclas bem peculiar: Tecla `1` aponta para cima (0º) e move 10 passos; Tecla `Z` aponta para baixo (180º) e move 10 passos.

* **Controles P2 (Wizard):**

  * Segue o padrão clássico: `Seta para Cima` (0º) e `Seta para Baixo` (180º), movendo 10 passos.

---

## Ator 3: Lightning2 (Rastreador / Spawner de Tiro)

Este é o ator mais complexo do projeto no momento. Ele não é um projétil solto, mas sim uma "âncora" ou mira invisível que segue o Jogador 1.

* **A Lógica de Rastreamento (Sensing):**

  * Ao clicar na Bandeira Verde, ele se esconde (`Hide`).

  * Entra em um loop infinito travando sua coordenada horizontal no meio da tela (`X: 106`).

  * **O Pulo do Gato:** Para o eixo Y, ele utiliza o bloco nativo de sensores `[posição y] de [Wizard Girl]`.

  * *Resultado:* Isso cria um ponto invisível na tela que imita perfeitamente a altura do Jogador 1, preparando o terreno perfeito para ser o gerador de clones (tiros) quando o botão de ataque for implementado.

---

## Ator 4: Lightning3 (Projétil do P2)

* Funciona apenas como um modelo visual no momento. Possui o bloco `Quando a Bandeira Verde for clicada`, mas sem nenhum comando associado a ele. Está posicionado perto do P2 aguardando a lógica de disparo.

# Projeto: Modelo Scratch - Pong Completo (Menus, Timer e Modos)

*Nota: Evolução do clássico "Jogo da Bolinha". Destaca-se por introduzir um fluxo de navegação de Interface de Usuário (UI) completo e um gerenciador de partida baseado em tempo limite.*

## 1. Fluxo de Menus e Interface (UI/UX)

O jogo possui um sistema de transição de telas gerenciado por Sinais (Broadcasts).

* **Tela Inicial:** O botão `Play` fica aguardando o clique. Ao ser clicado, ele envia o sinal `Config` e muda o cenário para a tela de configurações.

* **Tela de Configuração (Modos de Jogo):** * Os botões `PvP` (Player vs Player) e `PvM` (Player vs Machine/IA) aparecem ao receber o sinal `Config`.

  * Ao clicar no `PvP`, ele envia o sinal mestre `Jogo`, esconde a interface e inicia a partida. *(Nota de desenvolvimento: O botão PvM está estruturalmente pronto na tela, aguardando a implementação do clique para ativar a IA do P2).*

---

## 2. Gerenciador de Partida (O Palco/Stage)

O Palco não é apenas o fundo da tela, ele é o "Juiz" da partida, ditando quando o jogo acaba.

* **Cronômetro:** Ao receber o sinal `Jogo`, o Palco inicia a variável `Tempo` em 120 e subtrai -1 a cada segundo.

* **Condição de Fim de Jogo (Win State):**

  * Quando o `Tempo` chega a 0, o código usa blocos de Condição Composta (`If / Else If`) para comparar as variáveis:

    * Se `P1 > P2` -> Muda para a tela "P1 Venceu".

    * Se `P2 > P1` -> Muda para a tela "P2 Venceu".

    * Senão -> Muda para a tela "Empate".

  * Após decidir o vencedor, executa o comando `Pare Todos` (Game Over).

---

## 3. Motor Físico e Bolinha

A Bolinha concentra a lógica de pontuação e movimentação.

* **Saída Dinâmica:** Ao reiniciar no centro (0,0) após um gol, a bolinha sorteia um ângulo aleatório entre 1º e 360º para não ser previsível.

* **Sistema de Gol:** Se tocar na Hitbox `Gol P1` (Parede Esquerda), adiciona +1 ponto para o P2. Se tocar no `Gol P2` (Parede Direita), ponto para o P1.

* **Bug Conhecido (A Rotação Relativa):** A colisão atual usa o bloco `Gire 180 graus` ao bater nas raquetes. Isso causa um bug onde a bola fica presa dentro do personagem caso a raquete se mova para cima dela.

  * **Solução Definitiva:** Substituir a rotação relativa por uma **Rotação Absoluta**.

    * Se bater no P1 (Esquerda), usar `Aponte para a direção (Número aleatório entre 30 e 150)`.

    * Se bater no P2 (Direita), usar `Aponte para a direção (Número aleatório entre -30 e -150)`.

    * Isso obriga a bola a olhar para a rota de fuga correta independentemente de estar "afundada" na raquete.

# Projeto: Modelo Scratch - Apresentação Interativa de Pais (Arquivo 32)

*Nota: Projeto não-jogável. Trata-se de uma animação roteirizada criada em Scratch para substituir o uso de PowerPoint em uma reunião de pais, apresentando o currículo de Robótica e Jogos Digitais do Colégio Anchieta.*

## 1. Direção de Arte e Efeitos (UI/UX)

O projeto possui um fluxo de inicialização digno de um software profissional, focado em prender a atenção da audiência logo de cara.

* **Trilha Sonora:** O Palco toca a clássica *Zelda Main Theme Song* em loop com o volume fixado em 20% para não abafar a voz (hipotética) dos palestrantes ou os efeitos sonoros.

* **Sistema de Loading:** O ator `Loading` cria um efeito visual de "Fade In / Fade Out" usando o bloco de transparência (`Ghost effect`), alterando o visual entre 3 telas de loading diferentes para simular um carregamento real antes de liberar o botão de `Play`.

* **Botão Play Responsivo:** O botão de iniciar a apresentação possui um `IF` que verifica se o mouse está sobre ele (`touching mouse-pointer?`), trocando de fantasia para criar um efeito de *hover* (iluminar quando o mouse passa por cima).

---

## 2. O Elenco de Professores (Avatares)

O roteiro foi dividido em três Sinais de Broadcast (`ApresentacaoLarissa`, `ApresentcaoSandro`, `ApresentacaoGabriel`), fazendo com que cada professor "entre no palco" no momento exato.

* **Larissa:** Professora de Jogos Digitais (2º e 3º ano). Apresenta-se contando que adora Games, falar inglês e Star Wars.

* **Sandro:** Professor de Robótica (2º ao 6º ano). Apresenta-se contando que gosta de ler e assistir séries. É o responsável por chamar a Tabela de horários na tela.

* **Gabriel:** Professor de Robótica e Games (2º ano ao Ensino Médio). Conta que gosta de jogar videogames e ler.

---

## 3. O Conteúdo Didático (O Debate: Robótica vs Games)

Em vez de um professor falar tudo, o código usa um sistema de comunicação (Ping-Pong) de Sinais entre os avatares para explicar de forma dinâmica as diferenças entre as duas trilhas:

* **Robótica (Sandro/Gabriel):** Explicam que tem um foco mais técnico e *hands-on*. Focada na construção, mecânica, eletrônica e resolução de problemas práticos, ideal para alunos interessados em STEM (Ciência, Tecnologia, Engenharia e Matemática).

* **Jogos Digitais (Larissa/Gabriel):** Explicam que foca em habilidades cognitivas, pensamento crítico, história e raciocínio lógico, onde os alunos aprendem explorando ambientes virtuais pré-concebidos.

---

## 4. Logística e Avisos Escolares

No final da animação (Ativada pelo sinal `Maker`), os três avatares se revezam na tela para passar os recados vitais para o funcionamento da escola:

* Alunos do 2º e 3º ano são levados até a sala pelos estagiários.

* A partir do 4º ano, os alunos têm liberdade para ir à sala sozinhos.

* Todos os materiais são fornecidos pela escola.

* O lanche ocorre sempre antes do início da aula.

* Os alunos precisam ter em mãos seus e-mails e senhas institucionais.

* Pedido final para que os pais aguardem as crianças no local combinado.

# Projeto: Modelo Scratch - Breakout / Quebra-Tijolos (Arquivo 33)

*Nota: Projeto desenvolvido por um aluno. Recria a mecânica clássica de Arkanoid, destacando-se pelo uso de movimentação via mouse e um sistema engenhoso (porém rústico) de reset de fases e destruição de blocos em massa via Broadcast.*

## 1. O Palco (Gerenciador de Fases Infinitas)

O aluno criou um sistema de progressão de níveis contínuo e automático usando matemática simples.

* **Variáveis Globais:** `pontos` (Pontuação atual) e `next` (O limite de pontos para passar de fase, que inicia escondida com o valor 14).

* **Loop de Progressão:** O Palco monitora `SE pontos = next`. Como o jogo tem exatos 14 blocos, quando o jogador quebra todos (14 pontos), o Palco:

  1. Muda para o próximo cenário (`next backdrop`).

  2. Adiciona +14 à variável `next` (ou seja, a próxima fase exigirá 28 pontos, depois 42, etc.).

  3. Envia o sinal global `next`, que avisa aos blocos que eles precisam reaparecer para a nova rodada.

---

## 2. O Jogador e a Morte (Bandeja e Morte)

* **Bandeja (Paddle):** O controle mais responsivo possível. Um loop infinito simplesmente trava a raquete na posição Y (`-156`) e define o X para a `posição X do mouse` (`mouse_x`). Onde o mouse vai, a bandeja vai instantaneamente.

* **Morte (Hitbox Inferior):** Uma barra na base da tela (`Y: -187`). Se a bola tocar nela, o comando `Pare Todos` é acionado, gerando o Game Over.

---

## 3. O Motor Físico (Ator: Bola)

A bolinha concentra a maior parte do código do jogo, com um detalhe muito curioso na física de rebatida.

* **Saída:** Vai para o centro e sorteia uma direção aleatória entre 1º e 360º.

* **O Truque dos 185 Graus:** Em vez de calcular ângulos perfeitos de reflexão, o aluno usou o comando `gire 185 graus` para TODAS as colisões (bandeja e blocos). Por que não 180? Provavelmente ele percebeu que 180 graus exatos poderiam fazer a bola ficar presa em um loop infinito rebatendo reto de cima para baixo. Aqueles 5 grauzinhos a mais garantem que a bola sempre mude de rotação aos poucos!

---

## 4. O Sistema de Colisão em Massa (Blocos 1 a 14)

O aluno evitou usar Clones e duplicou 14 atores de blocos. A forma como ele fez a bola destruir os blocos é o grande destaque da lógica de estudante:

* O código da bola tem uma tripa gigantesca de 14 `IFs` separados. `SE tocar no [Bloco 1]`, `SE tocar no [Bloco 2]`, etc.

* Quando a bola toca em *qualquer* bloco, ela gira 185 graus, soma +1 ponto e **emite o sinal `bola`**.

* **A Reação do Bloco:** Todos os 14 blocos recebem o sinal `bola` ao mesmo tempo. Mas dentro de cada bloco há uma verificação rápida: `SE tocando na [bola] -> Esconda`.

* *Resultado prático:* O Scratch avisa todo mundo que ocorreu uma batida, mas apenas o bloco que está fisicamente encostado na bola obedece à ordem de sumir. Uma gambiarra brilhante!
