# Documentação Técnica: FSM Moderna e Arquitetura Avançada

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

--------------------------------------------------

## 1. Objeto Visual: obj_dasheffect (Rastro de Velocidade)

**Função:** Efeito de "fantasma" (ghosting). Instanciado por entidades durante estados de movimentação brusca (como esquivas ou investidas) para criar feedback visual de velocidade.

**Evento: Create**

Descrição: O objeto já nasce com 50% de transparência para parecer um eco, e não uma cópia sólida do personagem.

// -- Código GML --

image_alpha = .5;

**Evento: Step**

Descrição: Executa o esmaecimento (fade out) contínuo reduzindo o alpha. Quando fica totalmente invisível (menor ou igual a zero), o objeto é removido da memória.

// -- Código GML --

///Fade

if (image_alpha > 0)
{
    image_alpha -= .1;
}
else
{
    instance_destroy();
}

# Documentação Técnica: Objeto obj_enemy (Inimigo Base FSM)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** Atuar como o inimigo universal gerenciado por uma Máquina de Estados Finita verdadeira (baseada em Enums e Switch/Case).

--------------------------------------------------

## 1. Evento: Create

Descrição: Herda a física e propriedades vitais do "obj_lifeForm". Em vez de usar variáveis de texto ou referências diretas de script, a FSM é inicializada de forma segura através de um Enumerator (Enum). Também define os parâmetros cruciais de dano e movimentação.

// -- Código GML (Create) --

event_inherited();
state = ENEMY_STATE.PATROL;

// Parâmetros
walkSpeed = 3;
hsp = walkSpeed;
hurtTimeMax = 60;
knockbackHsp = 2;
knockbackVsp = 2;
hitDir = image_xscale;

--------------------------------------------------

## 2. Evento: Step

Descrição: Um exemplo perfeito de "Separation of Concerns" (Separação de Responsabilidades). O evento não calcula colisões pesadas; ele apenas roda a herança de física, chama o gerenciador de estados (`scr_enemyStates`) e verifica interações globais. O uso do `exit` cria um encerramento prematuro super otimizado caso o inimigo esteja morto.

// -- Código GML (Step) --

event_inherited();
scr_enemyStates();

if (state == ENEMY_STATE.DEAD) exit;

scr_enemyInteractions();

--------------------------------------------------

## 3. Evento: Draw GUI (Draw_64)

Descrição: Ferramenta clássica de Debug. Um texto colado na interface que traduz o número do Enum atual para o nome do estado legível, permitindo auditar o comportamento do inimigo em tempo real durante o jogo.

// -- Código GML (Draw_64) --

//draw_text(256, 64, "state: " + scr_enemyStateName(state));

# Documentação Técnica: Objeto obj_GUI (Gestor de Interface e Debug)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** Atuar como o controlador visual do ecrã (HUD). Substitui os antigos objetos de "Status", lendo as variáveis do jogador de forma segura e ativando sobreposições de teste para o programador.

--------------------------------------------------

## 1. Evento: Draw GUI (Draw_64)

Descrição: O gestor principal da interface no ecrã. Primeiro, utiliza a função `instance_find` para localizar o jogador de forma segura. O bloco `if (p != noone)` previne que o jogo bloqueie (crash) caso o jogador morra ou a sala seja reiniciada. Em seguida, delega o desenho da interface normal para um script externo e verifica a variável booleana `debugMode` do jogador para exibir, ou não, o painel secreto de desenvolvimento.

// -- Código GML (Draw_64) --

var p = instance_find(obj_player, 0);

if (p != noone)
{
    scr_drawHUD(p);

    if (p.debugMode)
    {
        scr_drawDebug(p);
        draw_text(32, 160, "DEBUG: ON (F1 para alternar)");
    }
    else
    {
        draw_text(32, 160, "DEBUG: OFF (F1 para alternar)");
    }
}

# Documentação Técnica: Objeto obj_lifeForm (Classe Pai Universal)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** Atuar como o alicerce fundamental para qualquer entidade que se mova, sofra gravidade ou receba dano (Jogador, Inimigos, NPCs). Ele gere a física base e os atributos vitais de forma abstrata.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa os blocos de construção da entidade. Define a base matemática para o movimento (`hsp`, `vsp`), as forças do mundo (`grv`, `jspd`, `maxFallSpeed`) e os atributos de vida. Também define a variável `colMask`, permitindo que diferentes entidades colidam com diferentes tipos de terreno de forma flexível.

// -- Código GML (Create) --

// Forças Físicas e Movimento
hsp = 0;
vsp = 0;
grv = 0.3;
jspd = -7;
maxFallSpeed = 12;
grounded = false;

// Colisores
colMask = obj_wall;

// Status Básico
hp_max = 100;
hp = hp_max;
is_dead = false;

--------------------------------------------------

## 2. Evento: Step

Descrição: O ciclo de vida do motor de física. Em vez de ter dezenas de linhas de código `while` misturadas, o evento delega as responsabilidades matemáticas para scripts externos, mantendo a leitura cristalina.

// -- Código GML (Step) --

// 1. Aplica a Gravidade
scr_gravity();

// 2. Colisão Horizontal (Resolução de X)
scr_collisionX();

// 3. Colisão Vertical (Resolução de Y)
scr_collisionY();

# Documentação Técnica: Objeto obj_player (O Maestro / FSM Core)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** O avatar do jogador. Ele atua como um "Gestor" (Manager). Em vez de processar colisões e regras rígidas, ele apenas delega tarefas para scripts externos especializados e gere os recursos globais (como Stamina e Cooldowns).

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicia chamando a herança de física do `obj_lifeForm` (`event_inherited()`). De seguida, inicializa a FSM no estado seguro `PLAYER_STATE.GROUND`. O restante do código é um verdadeiro dicionário de Game Design, agrupando variáveis por categoria para facilitar o balanceamento.

// -- Destaques de Variáveis (Create) --

* Movimento: Possui variáveis separadas para aceleração e fricção no chão (`accelGround`, `frictionGround`) e no ar (`accelAir`, `frictionAir`).
* Mecânicas Avançadas: Preparado para Dash multidirecional, Pulo Duplo (`canDoubleJump`), Air Dash e consumo de Stamina.
* Sistemas Universais: Inclui lógica para Invencibilidade temporária (`invTime`), Checkpoints e Vidas (`livesMax`).

--------------------------------------------------

## 2. Evento: Step

Descrição: O coração da arquitetura modular. A ordem de execução dita as regras do jogo: primeiro ele escuta os controlos (`scr_playerInput`), depois passa essa decisão para a FSM agir (`scr_playerStates`), a física do pai resolve a gravidade, e finalmente, ele processa os status vitais (Stamina e Cooldown).

// -- Código GML (Destaques do Step) --

// Chamada da Máquina de Estados
scr_playerStates();

// Otimização de Morte
if (state == PLAYER_STATE.DEAD) exit;

// Sistema de I-Frames (Piscar de Invencibilidade)
if (invTime > 0)
{
    invTime--;
    image_alpha = (invTime mod 2 == 0) ? 0.05 : 1.0;
}

# Documentação Técnica: Objeto obj_playerAttackHitbox (Hitbox de Combate Moderna)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** Atuar como o colisor físico dos ataques do jogador. Evolução direta do antigo `hitbox_obj`, mas agora sem depender de eventos de colisão nativos, utilizando verificações manuais de área (`instance_place`) e cronômetros em código puro.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa as propriedades do ataque. Em vez de usar os Alarmes nativos do GameMaker (como no projeto de 2016), cria uma variável personalizada (`attackTime`) que servirá de cronômetro decrescente para o tempo de vida da hitbox (durando apenas 5 frames).

// -- Código GML (Create) --

creator = noone;
attackTime = 5;
image_alpha = 1;

--------------------------------------------------

## 2. Evento: Step

Descrição: Onde a colisão ativa acontece. A hitbox usa `instance_place` para checar ativamente se há alguma sobreposição com qualquer `obj_lifeForm`. Se acertar um alvo (e esse alvo não for o criador do ataque), a hitbox calcula a direção do impacto (esquerda ou direita) usando matemática condicional e manda o alvo executar o seu próprio script de dano (`scr_enemyTakeDamage`). Depois, gerencia o seu próprio tempo de vida.

// -- Código GML (Step) --

var _target = instance_place(x, y, obj_lifeForm);

if (_target != noone && _target != creator)
{
    with(_target)
    {
        var _dir = (other.x < x) ? -1 : 1;
        scr_enemyTakeDamage(_dir, 20);
    }
    instance_destroy();
}

attackTime--;
if (attackTime <= 0)
{
    instance_destroy();
}

# Documentação Técnica: Fase 1 - Sistemas e Motores Independentes

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** Conjunto de scripts globais que gerem a interface de utilizador (UI), ferramentas de diagnóstico de desenvolvimento e o motor de física puramente matemático.

--------------------------------------------------

## 1. Módulo Visual e Interface (UI/UX)

**Script: scr_drawHUD**

Descrição: O gestor completo da interface do ecrã. Ele calcula a percentagem exata de Vida e Stamina usando a função `clamp` (para garantir que os valores nunca passem de 0 a 1).

* Barras Dinâmicas: Utiliza a função `draw_sprite_stretched` para desenhar o fundo das barras e, logo a seguir, desenha o preenchimento multiplicando a largura total pela percentagem atual do jogador.
* Segurança de Renderização: No final do script, ele reseta os alinhamentos de texto (`fa_left` e `fa_top`) e a cor para branco. Isto garante que qualquer texto desenhado após o HUD não herde os alinhamentos centralizados usados no ícone de vidas.

**Script: scr_drawDebug**

Descrição: O painel de controlo do desenvolvedor. Quando ativado, desenha no ecrã variáveis cruciais em tempo real, como os cronómetros de dano (`hurtTime`), invencibilidade (`invTime`) e tempo de morte (`deadTime`). Inclui atalhos para testes de mecânicas instantaneamente.

--------------------------------------------------

## 2. Motor de Física Customizado (Platformer Core)

**Script: scr_gravity**

Descrição: O motor vertical. Uma única função que adiciona a força da gravidade (`grv`) à velocidade vertical (`vsp`) a cada frame. Implementa velocidade terminal limitando a queda à variável `maxFallSpeed` através de `min()`.

**Script: scr_collisionX**

Descrição: Resolução de impacto horizontal (Eixo X). Verifica previamente se o próximo passo (`x + hsp`) vai colidir com a máscara designada (`colMask`). Se sim, entra num loop `while` que avança pixel a pixel (`sign(hsp)`) até encostar na parede, parando a velocidade horizontal (`hsp = 0`).

**Script: scr_collisionY**

Descrição: Resolução de impacto vertical (Eixo Y) e sensor de chão. A cada frame, assume inicialmente `grounded = false`. Se houver colisão vertical e o jogador estiver a cair (`vsp > 0`), confirma `grounded = true`. Utiliza o loop `while` pixel a pixel para parar perfeitamente no chão ou no teto, zerando `vsp`.

# Documentação Técnica: Fase 2 - Inteligência Artificial (Sistemas do Inimigo)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

**Função:** Conjunto de scripts globais que formam a espinha dorsal da FSM do inimigo.

--------------------------------------------------

## 1. O Cérebro da FSM (Controle de Estados)

* **Script: scr_enemyEnums**
  * Descrição: Dicionário de estados da máquina via `enum` (`PATROL`, `IDLE`, `HURT`, `DEAD`).

* **Script: scr_enemyStates**
  * Descrição: Maestro da IA. Chamado a cada frame com `switch(state)` direcionando para `scr_enemyPatrolState()`, `scr_enemyDeadState()`, etc.

--------------------------------------------------

## 2. Sistema de Combate e Interação

* **Script: scr_enemyTakeDamage**
  * Descrição: Recebe a direção do golpe (`_hitDir`) e o dano (`_dmg`). Verifica `hurtTime > 0` para ignorar dano se estiver invulnerável. Subtrai vida e, se zerar, muda para `ENEMY_STATE.DEAD`. Se sobreviver, aplica knockback e transita para `ENEMY_STATE.HURT`.

* **Script: scr_enemyInteractions**
  * Descrição: Verifica gatilhos de colisão com `obj_player` e aplica dano se necessário.

--------------------------------------------------

## 3. Ferramentas de Debug Visual

* **Script: scr_enemyStateName**
  * Descrição: Converte os Enums numéricos de volta em strings legíveis ("PATROL", "HURT") para exibição no HUD de debug.

# Documentação Técnica: Fase 2 - Inteligência Artificial (Estados do Inimigo)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

--------------------------------------------------

## 1. Comportamentos de Patrulha

* **Script: scr_enemyPatrolState**
  * Descrição: Estado de caminhada ativa. Usa `place_meeting` para detectar paredes à frente (`_wallAhead`) ou ausência de chão (`!_floorAhead`). Ao detectar, inverte `hsp *= -1` e vira o sprite (`image_xscale = sign(hsp)`). Possui chance aleatória de transitar para `IDLE`.

* **Script: scr_enemyIdleState**
  * Descrição: Estado de pausa. Fica imóvel e subtrai `idleTime`. Ao zerar, retorna para `PATROL`.

--------------------------------------------------

## 2. Comportamentos de Reação a Dano

* **Script: scr_enemyHurtState**
  * Descrição: Estado de atordoamento. Aplica knockback e desaceleração suave via `lerp(hsp, 0, 0.7)`. Ao zerar o tempo, decide aleatoriamente entre `PATROL` e `IDLE`.

* **Script: scr_enemyDeadState**
  * Descrição: Destino final. Liberta a memória com `instance_destroy()`.

# Documentação Técnica: Fase 3 - O Maestro (Sistemas do Player)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

--------------------------------------------------

## 1. O Coração da Máquina (FSM Base)

* **Script: scr_playerEnums**
  * Descrição: Enum global com `GROUND`, `AIR`, `DASH`, `HURT`, `DEAD` e `ATTACK`.

* **Script: scr_playerStates**
  * Descrição: Bloco `switch(state)` que direciona o código para o script comportamental correto a cada frame.

--------------------------------------------------

## 2. Controles e Física Limpa

* **Script: scr_playerInput**
  * Descrição: Captura teclas e analógicos de Gamepad, unificando a intenção no eixo `inputX` (-1, 0, 1).

* **Script: scr_playerMove**
  * Descrição: Converte `inputX` em velocidade horizontal `hsp` aplicando aceleração e atrito dinâmico de acordo com `grounded`.

--------------------------------------------------

## 3. Consequências e Mundo

* **Script: scr_playerInteractions**
  * Descrição: Gerencia checkpoints e dano direcional ao colidir com espinhos.

* **Script: scr_playerTakeDamage**
  * Descrição: Interrompe dano em I-Frames (`invTime`). Aplica knockback e transita para `PLAYER_STATE.HURT` ou `DEAD`.

--------------------------------------------------

## 4. O Modo Deus (Ferramentas de Desenvolvimento)

* **Script: scr_playerDebug**
  * Descrição: Atalhos de teclado no `F1` para curar, matar, teleportar e dar vidas extras instantaneamente.

* **Script: scr_playerStateName**
  * Descrição: Traduz o Enum do jogador para texto legível no HUD.

# Documentação Técnica: Fase 3 - O Maestro (Estados do Player)

**Projeto:** Engine Base Pessoal (Padrão Profissional / GM Atual)

--------------------------------------------------

## 1. Estados de Navegação

* **Script: scr_playerGroundState**
  * Descrição: Estado terrestre. Reseta Air Dash (`canAirDash = true`) e pulos duplos (`jumpCount = maxJumps`). Ao sair da plataforma, transita para `AIR`.

* **Script: scr_playerAirState**
  * Descrição: Estado aéreo. Gerencia pulo duplo, queda e ativação de Air Dash.

--------------------------------------------------

## 2. Estados de Ação Rápida

* **Script: scr_playerAttackState**
  * Descrição: Bloqueia movimento horizontal (`hsp = 0`) para dar impacto e instancia a hitbox marcando `hit.creator = id`.

* **Script: scr_playerDashState**
  * Descrição: Evasão em alta velocidade. Suspende a gravidade no ar (`vsp = 0`) e cria instâncias de `obj_dashEffect` para rastro visual.

--------------------------------------------------

## 3. Estados de Consequência

* **Script: scr_playerHurtState**
  * Descrição: Atordoamento com repulsão suave via `lerp`.

* **Script: scr_playerDeadState**
  * Descrição: Morte com fade out visual, consumo de vida e reposicionamento no último checkpoint com prevenção de colisão em sólidos.
