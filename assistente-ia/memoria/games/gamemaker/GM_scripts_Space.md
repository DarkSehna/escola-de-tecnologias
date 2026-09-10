# Documentação Técnica: Módulo Arcade (Space Shooter)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 1. Objeto Visual: o_armor (Indicador de Vida/Armadura)

**Função:** Atuar como a interface de usuário (UI) para a saúde da nave do jogador. Em vez de uma barra contínua, utiliza os quadros de animação (sub-images) de um sprite para representar o estado da armadura.

**Evento: Create**

Descrição: Inicializa o objeto travando a animação automática (`image_speed = 0`). O `image_index = 4` indica que o objeto nasce no frame 4, que representa a armadura com a saúde máxima.

// -- Código GML (Create) --

/// @description  Initialize the armor

image_speed = 0;

image_index = 4;

**Evento: Step**

Descrição: O elo de ligação entre a UI e o jogador. A cada frame, ele procura se a nave (`o_ship`) existe no jogo. Se existir, ele iguala o frame atual do sprite da armadura ao valor da variável `armor` da nave. Se a nave for destruída (não existir mais na sala), o frame cai para 0 (destruído/vazio).

// -- Código GML (Step) --

/// @description  Control the armor

if (instance_exists(o_ship))

{

    image_index = o_ship.armor;

}

else

{

    image_index = 0;

}

# Documentação Técnica: Interface e Menus (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 2. Objeto Pai de UI: o_button_parent (Botão Universal)

**Função:** Atuar como o alicerce para todos os botões clicáveis do jogo. Ele gerencia os efeitos visuais de "Hover" (passar o mouse por cima) e a renderização do texto, permitindo que botões filhos precisem apenas definir o seu texto e a sua ação de clique.

**Evento: Create**

Descrição: Prepara o botão definindo a variável `text` como vazia por padrão e travando a animação da imagem para que ele não pisque incontrolavelmente.

// -- Código GML (Create) --

text = "";

image_speed = 0;

**Eventos: Mouse Enter (Mouse_10) e Mouse Leave (Mouse_11)**

Descrição: O famoso efeito de "Hover". O GameMaker possui eventos nativos para quando o ponteiro do mouse entra e sai da área de colisão (hitbox) do objeto.

* Ao entrar (Enter): Muda para o frame 1, que representa o botão mais claro (iluminado).

* Ao sair (Leave): Volta para o frame 0, escurecendo o botão para o estado inativo.

**Evento: Draw**

Descrição: Desenha o próprio botão e escreve o texto por cima. O uso da função de alinhamento garante que, não importa o tamanho da palavra (seja "OK" ou "Configurações"), o texto fique perfeitamente centralizado no botão.

// -- Código GML (Draw) --

draw_self();

draw_set_halign(fa_center);

draw_set_valign(fa_middle);

draw_text(x, y-1, string_hash_to_newline(text)); // O y-1 levanta o texto para compensar o desenho do botão

# Documentação Técnica: Inimigos e Projéteis (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 3. Objeto de Perigo: o_enemy_laser (Tiro Inimigo)

**Função:** Projétil disparado pelas ameaças do jogo. Possui uma velocidade fixa para o sul da tela e gerencia a colisão direta com a nave do jogador, sendo responsável por acionar o sistema de dano e os feedbacks sensoriais.

**Evento: Create**

Descrição: Inicializa o movimento e o som. Em vez de usar fórmulas de vetor, o objeto tira proveito da variável nativa `vspeed` definindo-a para 4 para descer pela tela. No exato frame em que nasce, ele reproduz o efeito sonoro de disparo `a_Enemy_Laser`.

**Evento: Outside Room (Other 0)**

Descrição: Otimização vital para jogos contínuos. Quando o laser sai dos limites da sala (Room), ele chama `instance_destroy()` para apagar a si mesmo. Isso previne o vazamento de memória (Memory Leak) que aconteceria se milhares de lasers continuassem voando infinitamente para baixo.

**Evento: Collision (Com o_ship)**

Descrição: A resolução de impacto. Quando encosta no jogador, o laser primeiro destrói a si mesmo com `instance_destroy()` e depois acessa o alvo para subtrair 1 ponto da variável `armor`. O restante do código é puro polimento sensorial: ele invoca um clarão na tela (`o_screen_flash`), cria uma partícula de faísca (`o_flare`), faz a câmera tremer (`add_screenshake`) e toca o som metálico de dano `a_Ship_Hit`.

# Documentação Técnica: Inimigos e Projéteis (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 4. Objeto Inimigo: o_enemy_one (Nave Inimiga Básica)

**Função:** Atuar como o principal obstáculo comum do jogo. Possui movimento autônomo contínuo em direção à base da tela e um sistema de vida (armadura) independente para absorver mais de um impacto antes de ser destruído.

**Evento: Create**

Descrição: Inicializa os atributos vitais e de movimento do inimigo assim que ele surge no ecrã.

// -- Código GML (Create) --

/// @description  Initialize the enemy

vspeed = 4; // Define a velocidade vertical nativa para descer a tela

armor = 2;  // Define a quantidade de acertos necessários para ser destruído

# Documentação Técnica: Inimigos e Inteligência (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 5. Objeto Pai de Inimigos: o_enemy_parent

**Função:** Atuar como a classe base (alicerce) para todas as naves inimigas do jogo. Ele centraliza a lógica universal de limpeza de memória, pontuação e colisão kamikaze com o jogador, garantindo que qualquer novo inimigo criado herde esses comportamentos sem duplicação de código.

**Evento: Step (Execução Contínua)**

Descrição: Gerencia o ciclo de vida da entidade e a recompensa do jogador.

* Limpeza de Tela: Verifica constantemente se a posição vertical (`y`) do inimigo ultrapassou o limite inferior da sala mais uma margem de segurança (`room_height+16`). Se sim, a instância é destruída silenciosamente para liberar memória.

* Morte e Recompensa: Verifica se a armadura (`armor`) chegou a zero ou menos. Caso positivo, o jogo cria um efeito de explosão nas coordenadas atuais, destrói a nave inimiga e soma 5 pontos à variável global `score`.

// -- Código GML (Step) --

/// @description  Control the enemy

if ( y > room_height+16)

{

    instance_destroy();

}

// Die code

if (armor <= 0)

{

    create_explosion(x, y);

    instance_destroy();

    score += 5;

}

**Evento: Collision (Com o_ship)**

Descrição: O comportamento de impacto direto. Se um inimigo colidir fisicamente com a nave do jogador, a armadura do jogador (`other.armor`) sofre 1 ponto de dano. O inimigo zera a sua própria armadura (`armor = 0`) para garantir que o seu evento Step processe a sua explosão no frame seguinte. Por fim, um clarão na tela (`o_screen_flash`) é instanciado e o som metálico `a_Ship_Hit` é tocado sem repetição contínua.

// -- Código GML (Collision com o_ship) --

/// @description  Damage the ship

other.armor -= 1;

armor = 0;

instance_create(0, 0, o_screen_flash);

audio_play_sound(a_Ship_Hit, 6, false);

# Documentação Técnica: O Diretor do Jogo (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 6. Controlador Central: o_enemy_spawner (Gerador de Ondas)

**Função:** Uma entidade invisível que gerencia o fluxo da partida. É responsável por criar inimigos continuamente, escalar a dificuldade com base na pontuação do jogador e fornecer itens de ajuda (powerups) em intervalos regulares.

**Evento: Create**

Descrição: O botão de "Start" da engrenagem. Ele inicializa dois alarmes distintos usando macros (variáveis de texto) para facilitar a leitura. O `ENEMY_SPAWNER` é acionado em 3 segundos e o `POWERUP_SPAWNER` em 5 segundos.

**Evento: Alarm 0 (Gerador de Inimigos e Curva de Dificuldade)**

Descrição: O coração do Game Design do projeto. Em vez de criar fases separadas, o jogo aumenta a dificuldade organicamente lendo a variável global `score`.

* Fase Inicial: Gera apenas o inimigo básico (`o_enemy_one`) num intervalo de 0.5 a 2 segundos.

* Escalonamento: O código passa por uma série de verificações (Ifs).

  * Acima de 100 pontos: Começa a misturar o `o_enemy_two` na probabilidade de nascer e reduz o tempo de spawn.

  * Acima de 200 e 500 pontos: A chance de nascer o inimigo mais difícil aumenta gradativamente.

  * Acima de 1000 pontos: O `o_enemy_two` domina a probabilidade e o jogo entra no seu ritmo mais frenético (nascendo a cada 0.25 a 1 segundo).

* Finalização: Cria o inimigo escolhido no topo da tela e reinicia o próprio alarme.

**Evento: Alarm 1 (Gerador de Powerups)**

Descrição: O sistema de recompensa/salvação. A cada 10 a 15 segundos, o jogo escolhe aleatoriamente entre um escudo (`o_armor_powerup`) e um laser duplo (`o_laser_powerup`) e o cria no ecrã.

# Documentação Técnica: Inimigos e Inteligência (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 7. Objeto Inimigo: o_enemy_two (Nave de Ataque Lateral)

**Função:** Inimigo de elite que apresenta um padrão de movimento de ricochete nas bordas da tela e dispara lasers contra o jogador. Possui o dobro de resistência (armadura) em relação ao inimigo básico.

**Evento: Create**

Descrição: Configura a física inicial e os temporizadores. Define uma velocidade vertical lenta (`vspeed = 1`) para manter o inimigo na tela por mais tempo e escolhe aleatoriamente uma direção horizontal inicial (`hspeed`) entre esquerda ou direita. Ativa o alarme de disparo imediatamente após o nascimento.

**Evento: Step**

Descrição: Gerencia o comportamento de "Bouncer". Primeiro, executa `event_inherited()` para manter a lógica de explosão e pontuação do pai. Em seguida, verifica se a nave atingiu as bordas laterais da sala (com uma margem de 16 pixels); se encostar na direita, inverte a velocidade para a esquerda e vice-versa.

**Evento: Alarm 0 (Disparo de Laser)**

Descrição: Cria um projétil `o_enemy_laser` ligeiramente abaixo da posição da nave e reinicia o ciclo de disparo a cada 2 segundos.

# Documentação Técnica: Efeitos e Feedback (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 8. Objeto de Feedback: o_explosion_center (Núcleo da Explosão)

**Função:** Gerenciar o impacto visual e sensorial no momento em que uma entidade é destruída. Ele não possui física de movimento, servindo apenas como o ponto de origem para o tremor de câmera, som e o efeito de "fade out".

**Evento: Create**

Descrição: Ocorre no exato momento em que o inimigo (ou o player) explode. Ele sorteia uma rotação aleatória para que as explosões não pareçam todas iguais, define uma transparência inicial e aciona os sistemas de "suco" (Juice) do jogo.

// -- Código GML (Create) --

/// @description  Initialize the explosion center

image_angle = random(360);

image_alpha = .8;

// Aciona o tremor de câmera (Intensidade 8, Duração 0.25s)

add_screenshake(8, room_speed*.25);

// Toca o som de explosão com prioridade 7

audio_play_sound(a_Explode, 7, false);

--------------------------------------------------

## 2. Evento: Step

Descrição: Responsável pelo efeito de desaparecimento gradual (Fade). A cada frame, o objeto perde 0.05 de opacidade. Quando se torna invisível, ele se remove da memória.

// -- Código GML (Step) --

/// @description  Fade

if (image_alpha > 0)

{

    image_alpha -= .05;

}

else

{

    instance_destroy();

}

# Documentação Técnica: Efeitos e Partículas (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 9. Objeto Visual: o_flare (Clarão de Impacto)

**Função:** Criar um efeito visual de brilho intenso e rápido. Ele é instanciado em pontos de impacto ou explosões para enfatizar a liberação de energia, desaparecendo quase instantaneamente para não poluir a tela.

**Evento: Create**

Descrição: O clarão nasce com opacidade total para garantir o brilho máximo no frame inicial.

// -- Código GML (Create) --

/// @description  Initialize the flare

image_alpha = 1;

--------------------------------------------------

## 2. Evento: Step

Descrição: Realiza um esmaecimento extremamente agressivo. Enquanto outros efeitos perdem 0.05 ou 0.1 de alpha por frame, o flare perde 0.1, garantindo que ele dure apenas 10 frames (cerca de 1/6 de segundo).

// -- Código GML (Step) --

/// @description  Fade out

if (image_alpha > 0)

{

    image_alpha -= .1;

}

else

{

    instance_destroy();

}

# Documentação Técnica: o_game (O Controlador Global)

**Projeto:** Space (Tutorial Clássico)

**Função:** Atuar como o cérebro administrativo do jogo. Ele inicializa o estado global, gerencia o áudio contínuo e hospeda o sistema de partículas, garantindo que os recursos visuais sejam criados no início e limpos corretamente no final para evitar travamentos.

--------------------------------------------------

## 1. Evento: Create (Inicialização do Universo)

Descrição: Define o ponto de partida do jogador. Além de zerar o Score e configurar a fonte, ele inicia a música tema e prepara os "tipos" de partículas que outros objetos (como explosões e naves) usarão.

// -- Código GML (Create) --

score = 0;

draw_set_font(f_score);

audio_play_sound(a_Space_Music_One, 10, true);

// Sistema de Partículas (Gerenciamento de Memória)

system = part_system_create();

pt_smoke = create_part_type_sprite(s_smoke, true, 25, 30);

pt_flare = create_part_type_sprite(s_flare, true, 15, 20);

--------------------------------------------------

## 2. Evento: Other - Game End (Limpeza de Dados)

Descrição: Crucial para o desempenho do computador. Como sistemas de partículas ocupam um espaço fixo na memória RAM, este evento garante que, ao fechar o jogo, tudo seja destruído e a memória seja devolvida ao sistema operacional.

// -- Código GML (Game End) --

part_system_destroy(system);

part_type_destroy(pt_smoke);

part_type_destroy(pt_flare);

// -- Código GML (Draw) --

draw_self();

draw_set_halign(fa_right);

draw_set_valign(fa_top);

// Exibe o valor de highscore armazenado no o_game

draw_text(x-3, y, string_hash_to_newline(o_game.highscore));

// -- Código GML (Step) --

if (image_alpha > 0)

{

    image_alpha -= .1; // Desaparece rápido (10% por frame)

}

else

{

    instance_destroy(); // Limpeza automática de memória

}

# Documentação Técnica: o_laser (Projétil do Jogador)

**Projeto:** Space (Tutorial Clássico)

**Função:** Atuar como o ataque principal do jogador. Move-se rapidamente para o topo da tela e gerencia o dano causado às naves inimigas.

--------------------------------------------------

## 1. Evento: Create (Disparo)

Descrição: Define a trajetória ascendente e aciona os feedbacks visuais e sonoros imediatos do tiro.

// -- Código GML --

vspeed = -8; // Move-se para cima

instance_create(x, y, o_flare); // Cria o brilho na ponta da arma

audio_play_sound(a_Laser, 5, false); // Som do tiro

--------------------------------------------------

## 2. Evento: Collision (Com o_enemy_parent)

Descrição: Trata o impacto com qualquer objeto que seja filho do pai dos inimigos.

// -- Código GML --

instance_destroy(); // O laser some ao colidir

other.armor -= 1; // Subtrai vida do inimigo atingido

instance_create(x, y, o_flare); // Pequeno brilho no ponto de impacto

audio_play_sound(a_Hit, 5, false); // Som de acerto

--------------------------------------------------

## 3. Evento: Outside Room (Limpeza)

Descrição: Destrói o laser assim que ele sai da tela por cima, mantendo a performance do jogo.

# Documentação Técnica: O Jogador e Powerups (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 12. Objeto Principal: o_ship (A Nave do Jogador)

**Função:** É o avatar do jogador. Controla a movimentação horizontal (via mouse ou controle), gerencia o disparo contínuo de projéteis, processa o ganho/perda de armadura e dita a condição de "Game Over" ao ser destruída.

**Evento: Create**

Descrição: Configura o estado inicial de sobrevivência e combate da nave.

// -- Resumo Lógico --

* Inicializa o alarme de disparo (`alarm[LASER]`) quase imediatamente.

* Define a vida máxima (`armor = 4`) e o estado inicial do tiro especial (`laser_powerup = false`).

--------------------------------------------------

**Evento: Step (Movimentação e Morte)**

Descrição: Gerencia a física da nave e verifica constantemente se ela ainda está viva. O código é brilhante ao separar jogadores de PC (Mouse) e Console (Gamepad).

// -- Resumo Lógico --

* **Controle pelo Mouse:** Se nenhum controle estiver conectado, a posição `x` da nave segue o mouse (`mouse_x`). A função `clamp` é usada para impedir que a nave saia da tela, limitando-a entre as coordenadas 16 e `room_width-16`.

* **Controle pelo Gamepad:** Se houver controle, ele lê o eixo analógico esquerdo (`gp_axislh`). A nave move-se ajustando a `hspeed` (com limite de bordas via `if`).

* **Morte:** Se a armadura (`armor`) cair para 0 ou menos, o código invoca uma explosão, destrói a nave e cria o botão de menu (`o_menu_button`) para o jogador reiniciar a partida.

--------------------------------------------------

**Evento: Alarm 0 (Sistema de Disparo)**

Descrição: Funciona como uma metralhadora automática. Ao invés de o jogador clicar para atirar, o alarme cria os lasers e chama a si mesmo em loop.

// -- Resumo Lógico --

* Cria dois projéteis frontais (`o_laser`).

* Reinicia o alarme para atirar novamente em uma fração de segundo (`room_speed/6`).

* **Modo Powerup:** Se a variável `laser_powerup` for `true`, ele cria mais dois lasers extras disparados na diagonal (`hspeed = .5` e `-.5`).

--------------------------------------------------

**Eventos: Colisões (Powerups) e Alarm 1**

Descrição: Processa a coleta dos itens enviados pelo `o_enemy_spawner`.

* **Colisão com o_armor_powerup:** Adiciona 1 à armadura e toca um som. Usa a função `min(armor, 4)` para garantir que a vida nunca ultrapasse o limite de 4, e destrói a cápsula do item.

* **Colisão com o_laser_powerup:** Altera a *flag* `laser_powerup` para `true` (ativando o tiro quádruplo), toca o som, destrói o item e aciona o **Alarm 1** (`LASER_POWERUP`) configurado para 10 segundos (`room_speed*10`).

* **Alarm 1:** Apenas devolve a *flag* `laser_powerup` para `false`, encerrando o efeito especial.

# Documentação Técnica: Interface e Menus (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 13. Objeto de UI: o_menu_button (Botão de Retorno)

**Função:** Criar um botão interativo que surge quando o jogador perde a partida. Ele herda todas as características visuais do botão pai e é responsável por atualizar o recorde (highscore) e devolver o jogador ao menu principal.

**Evento: Create**

Descrição: Configura a identidade deste botão específico.

A função `event_inherited()` é chamada primeiro para garantir que todas as variáveis do `o_button_parent` (como a cor e o alinhamento de texto) sejam carregadas. Em seguida, define a variável de texto que será desenhada.

// -- Código GML (Create) --

/// @description  Initialize the button

event_inherited();

text = "Menu";

--------------------------------------------------

**Evento: Mouse Left Pressed (Mouse_4)**

Descrição: Executa a ação de transição de sala (Room) e o encerramento seguro do ciclo de jogo.

Antes de mudar de ecrã, o objeto compara a pontuação atual (`score`) com o recorde guardado no objeto controlador (`o_game.highscore`). Se a pontuação for maior, o recorde é atualizado. Após esta verificação, o `score` é reiniciado a zero  e o jogo transita para a sala de menu (`r_menu`).

// -- Código GML (Mouse Left Pressed) --

/// @description  Start the game

room_goto(r_menu);

// Update the highscore

if (score > o_game.highscore)

{

    o_game.highscore = score;

}

score = 0;

# Documentação Técnica: Efeitos e Partículas (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 14. Objeto Efeito Visual: o_particle_creator (Gerador Dinâmico)

**Função:** Atuar como um pedaço de "destroço" invisível que voa pela tela após uma explosão, emitindo partículas de fogo e fumaça pelo caminho até perder a força e desaparecer.

**Evento: Create**

Descrição: Assim que é instanciado (geralmente no centro de uma explosão), este objeto ganha um empurrão aleatório para qualquer lado (360 graus) com uma velocidade variando entre 1 e 5. A variável `friction` é ativada em 0.25, o que atua como uma força de arrasto no espaço, desacelerando o objeto gradualmente a cada frame.

// -- Código GML (Create) --

/// @description  Initialize the particle creator

speed = random_range(1, 5);

friction = .25;

direction = random(360);

--------------------------------------------------

**Evento: Step**

Descrição: Onde a mágica visual acontece. A cada frame, o objeto pinta a tela com o sistema de partículas armazenado no `o_game`.

// -- Resumo Lógico --

* **Emissão Contínua:** Espalha partículas do tipo flare (`pt_flare`) constantemente usando a sua própria posição `x` e `y` com uma pequena variação aleatória para não ficar uma linha reta perfeita.

* **Emissão Condicional:** Só cria as partículas pesadas de fumaça (`pt_smoke`) enquanto o objeto estiver voando rápido (`speed > 2`).

* **Ciclo de Vida:** Quando o arrasto da `friction` finalmente reduz a `speed` a 0, o objeto destrói-se para limpar a memória.

# Documentação Técnica: O Jogador e Powerups (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 15. Objeto Pai de Itens: o_powerup_parent (Base dos Powerups)

**Função:** Servir como a classe base para todas as melhorias (powerups) que caem pela tela. Ele centraliza a física de queda e a limpeza de memória, garantindo que qualquer novo item instanciado no jogo herde esse comportamento automaticamente.

**Evento: Create**

Descrição: Inicializa o movimento do item assim que ele é gerado pelo "Diretor" (spawner) do jogo. O objeto utiliza a variável nativa de velocidade vertical para descer a tela a uma velocidade constante de 2 pixels por frame.

// -- Código GML (Create) --

/// @description  Initialize the powerup

vspeed = 2;

--------------------------------------------------

**Evento: Step**

Descrição: Gerencia o ciclo de vida do powerup caso o jogador não consiga coletá-lo a tempo. Ele verifica continuamente se a posição `y` do objeto ultrapassou o limite inferior da sala, somado a uma margem de segurança de 16 pixels. Se isso acontecer, a instância destrói a si mesma para limpar a memória do computador e evitar travamentos.

// -- Código GML (Step) --

/// @description  Control de powerup

if ( y > room_height+16)

{

    instance_destroy();

}

# Documentação Técnica: Interface e Menus (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 16. Objeto de UI: o_quit_button (Botão de Sair)

**Função:** Fornecer ao jogador uma forma direta de encerrar a aplicação. Assim como os outros elementos do menu, ele aproveita toda a estrutura visual do botão pai, focando apenas na sua função específica de fechar o jogo.

**Evento: Create**

Descrição: Inicializa o botão acionando primeiro as propriedades visuais do objeto pai através do `event_inherited()`. Logo em seguida, ele altera a variável de texto para exibir a palavra "Quit" na tela.

// -- Código GML (Create) --

/// @description  Initialize the button

event_inherited();

text = "Quit";

--------------------------------------------------

**Evento: Mouse Left Pressed (Mouse_4)**

Descrição: Quando o botão esquerdo do mouse é pressionado sobre a área de colisão do objeto, ele executa a função nativa game_end(), que encerra a aplicação imediatamente.

// -- Código GML (Mouse_4) --

/// @description  Quit the game

game_end();

# Documentação Técnica: Interface e Menus (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 17. Objeto de UI: o_score (Exibição da Pontuação)

**Função:** Exibir visualmente a pontuação atual do jogador no ecrã durante a partida. Este objeto gere a formatação do texto para garantir que os números se ajustam corretamente à interface geométrica do jogo.

**Evento: Draw**

Descrição: Este evento é acionado a cada *frame* para renderizar os gráficos. Primeiro, ele instrui o objeto a desenhar o seu próprio sprite usando a função `draw_self()`. Em seguida, configura o alinhamento do texto, definindo o alinhamento horizontal para a direita (`fa_right`) e o vertical para o topo (`fa_top`). Por fim, desenha o valor numérico da variável `score` no ecrã, com um ligeiro ajuste na posição X (`x-3`) para centralizar perfeitamente o texto dentro da sua moldura.

// -- Código GML (Draw) --

/// @description  Draw the score

draw_self();

draw_set_halign(fa_right);

draw_set_valign(fa_top);

draw_text(x-3, y, string_hash_to_newline(score));

# Documentação Técnica: Efeitos Visuais (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 18. Objeto Efeito Visual: o_screen_flash (Feedback de Dano)

**Função:** Criar um clarão vermelho rápido que cobre toda a tela para sinalizar ao jogador que a nave sofreu dano. Ele gerencia a própria transparência e destrói-se automaticamente.

**Evento: Draw**

Descrição: O código desenha um retângulo vermelho do tamanho exato da câmera (view) atual. Ele usa a opacidade atual do objeto (`image_alpha`) para definir quão forte é a cor. Imediatamente após desenhar o retângulo, ele devolve a cor para branco (`c_white`) e a opacidade para 1 (100%) para não afetar os outros objetos do jogo.

No final, ele subtrai 0.25 da opacidade a cada frame (um fade out super rápido de 4 frames) e se destrói quando fica invisível.

// -- Código GML (Draw) --

/// @description  Draw the screen flash

draw_set_colour(c_red);

draw_set_alpha(image_alpha);

draw_rectangle(__view_get( e__VW.XView, 0 ), __view_get( e__VW.YView, 0 ), __view_get( e__VW.XView, 0 )+room_width, __view_get( e__VW.YView, 0 )+room_height, false);

draw_set_colour(c_white);

draw_set_alpha(1);

if (image_alpha > 0)

{

    image_alpha -= .25;

}

else

{

    instance_destroy();

}

# Documentação Técnica: Interface e Menus (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 19. Objeto de UI: o_start_button (Botão de Iniciar)

**Função:** Atuar como a porta de entrada para a ação do jogo. Seguindo a mesma lógica arquitetural dos outros botões, ele herda a interface padrão e foca apenas na transição para o nível principal.

**Evento: Create**

Descrição: Inicializa o botão chamando a função `event_inherited()` para absorver todas as características visuais do botão pai, como cor, alinhamento e o comportamento de *hover* do mouse. Em seguida, define a variável de texto que será desenhada para "Start".

// -- Código GML (Create) --

/// @description  Initialize the button

event_inherited();

text = "Start";

--------------------------------------------------

**Evento: Mouse Left Pressed (Mouse_4)**

Descrição: Quando o jogador clica na área de colisão do botão com o clique esquerdo, ele executa a função nativa `room_goto()` para carregar a sala (cena) onde a partida acontece, identificada como `r_space`.

// -- Código GML (Mouse_4) --

/// @description  Start the game

room_goto(r_space);

# Documentação Técnica: Efeitos Visuais e Câmera (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 20. Objeto de Sistema: o_view_controller (Controlador de Tremor)

**Função:** Gerenciar a posição da câmera (view) para criar efeitos de "Screen Shake" (tremor de tela) durante explosões ou impactos. Ele age de forma invisível, aguardando que outros objetos (como a explosão de um inimigo) definam a intensidade do tremor.

**Evento: Create**

Descrição: Prepara o objeto definindo a intensidade inicial do tremor como zero.

// -- Código GML (Create) --

/// @description  Initialize the view controller

screenshake = 0;

--------------------------------------------------

**Evento: Step**

Descrição: Onde o efeito visual acontece. A cada frame, o objeto pega a posição X e Y da câmera principal (view 0) e a desloca para um valor aleatório entre 0 e o valor atual da variável `screenshake`. Se `screenshake` for 0, a câmera não se move. Se for 5, a câmera vibra violentamente.

// -- Código GML (Step) --

/// @description  Update the view position

__view_set( e__VW.XView, 0, random(screenshake) );

__view_set( e__VW.YView, 0, random(screenshake) );

--------------------------------------------------

**Evento: Alarm 0 (Fim do Efeito)**

Descrição: Atua como o "freio" do sistema. Quando o tempo do alarme esgota, ele devolve a variável `screenshake` para 0, estabilizando a imagem da tela.

// -- Código GML (Alarm 0) --

/// @description  Set screenshake to 0

screenshake = 0;

# Documentação Técnica: Scripts Globais (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 21. Script Global: object_get_depth (Leitura de Profundidade)

**Função:** Retornar o valor da "profundidade" (`depth`) de um objeto específico. Em jogos 2D, a profundidade dita qual imagem é desenhada por cima e qual fica por baixo.

**Descrição Lógica:**

O script recebe o identificador numérico de um objeto e verifica o seu índice. Cria uma variável de resposta padrão `ret` com valor `0`. Se o índice for válido (maior ou igual a zero e menor que o tamanho da lista global de profundidades), ele busca o valor exato no array `global.__objectID2Depth` e o devolve com o `return`.

// -- Código GML --

/// @description Returns the depth of the specified object.

/// @param {Number} obj The index of the object to check

/// @return {Number} depth of the object

function object_get_depth(argument0) {

    var objID = argument0;

    var ret = 0;

    if (objID >= 0) && (objID < array_length_1d(global.__objectID2Depth)) {

        ret = global.__objectID2Depth[objID];

    } // end if

    return ret;

}

--------------------------------------------------

## 22. Script Global: instance_create (Criador de Instâncias de Compatibilidade)

**Função:** Criar uma instância de um objeto numa dada posição (X e Y). Atua como uma "ponte de tradução" entre as versões antigas e novas do GameMaker.

**Descrição Lógica:**

Como a versão nova do GameMaker exige saber a "profundidade" ou a "camada" exata onde o objeto vai nascer, o código antigo quebrava. Este script recebe três informações: a posição X, a posição Y e qual objeto deve ser criado.

A "mágica" acontece quando ele chama o script anterior (`object_get_depth`) para descobrir automaticamente a profundidade daquele objeto e guarda essa informação na variável `myDepth`. Por fim, ele devolve o resultado usando a função nativa atualizada `instance_create_depth`, passando o X, o Y, a profundidade descoberta e o objeto.

// -- Código GML --

/// @description Creates an instance of a given object at a given position.

/// @param x The x position the object will be created at.

/// @param y The y position the object will be created at.

/// @param obj The object to create an instance of.

function instance_create(argument0, argument1, argument2) {

    var myDepth = object_get_depth( argument2 );

    return instance_create_depth( argument0, argument1, myDepth, argument2 );

}

# Documentação Técnica: Scripts Globais e Configurações (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 23. Script Global: macros (Constantes do Sistema)

**Função:** Definir palavras-chave (rótulos constantes) para substituir números fixos dentro do código. No GameMaker, as macros não podem ser alteradas durante o jogo; elas servem para tornar a programação mais humana, legível e organizada.

**Descrição Lógica:**

Neste projeto, as macros estão a servir exclusivamente como "apelidos" para os índices dos Alarmes (que vão de 0 a 11 no GameMaker). O script associa um nome claro a um número específico.

// -- Código GML --

function macros() {

#macro LASER 0

#macro ENEMY_SPAWNER 0

#macro POWERUP_SPAWNER 1

#macro LASER_POWERUP 1

#macro SCREENSHAKE 0

}

# Documentação Técnica: Scripts Globais e Configurações (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 24. Script Global: create_part_type_sprite (Fábrica de Partículas)

**Função:** Simplificar e automatizar a criação de novos tipos de partículas. Atua como uma "fábrica", recebendo as características únicas e devolvendo a partícula pronta.

**Descrição Lógica:**

O script recebe quatro parâmetros: o sprite, a ativação de mistura de cores (blend), e o tempo de vida mínimo e máximo. Internamente, ele cria o tipo de partícula, aplica um efeito de esmaecimento suave (de 75% a 0 de opacidade), atribui a imagem , e garante uma rotação aleatória ao nascer (0 a 360 graus). No final, devolve o tipo criado para quem chamou a função.

// -- Código GML --

/// @description  Create part type sprite (sprite, blend, min_life, max_life)

/// @param sprite

/// @param  blend

/// @param  min_life

/// @param  max_life

function create_part_type_sprite(argument0, argument1, argument2, argument3) {

 var sprite = argument0;

 var blend = argument1;

 var min_life = argument2;

 var max_life = argument3;

 var type = part_type_create();

 part_type_alpha2(type, .75, 0);

 part_type_sprite(type, sprite, false, true, false);

 part_type_blend(type, blend);

 part_type_size(type, 1, 1, 0, 0);

 part_type_life(type, min_life, max_life);

 part_type_orientation(type, 0, 360, 0, 0, 0);

 return type;

}

--------------------------------------------------

## 25. Script Global: create_explosion (Gerador de Explosões)

**Função:** Centralizar a lógica de criação do efeito de explosão completo, combinando o centro da explosão com múltiplos destroços espalhados pela área.

**Descrição Lógica:**

Este script recebe as coordenadas X e Y onde a explosão deve ocorrer. Em vez de criar apenas um objeto, ele usa a estrutura de repetição `repeat (10)` para instanciar 10 objetos `o_particle_creator` (os destroços com fumaça) espalhados aleatoriamente numa área ao redor do ponto de origem. Por fim, ele cria o `o_explosion_center` exatamente nas coordenadas X e Y passadas, que cuidará de tremer a tela.

// -- Código GML --

/// @description  Create explosion

function create_explosion(argument0, argument1) {

 var xx = argument0;

 var yy = argument1;

 repeat (10)

 {

     instance_create(xx-16+random(32), yy-16+random(32), o_particle_creator);

 }

 instance_create(xx, yy, o_explosion_center);

}

# Documentação Técnica: Scripts Globais e Configurações (Arcade)

**Projeto:** Space (Tutorial Clássico)

--------------------------------------------------

## 26. Script Global: add_screenshake (Ativador de Tremor)

**Função:** Uma função auxiliar projetada para se comunicar com o `o_view_controller`. Ela permite que qualquer objeto no jogo (como uma explosão) acione o efeito de tremer a tela de forma simples, passando apenas a intensidade e a duração desejadas.

**Descrição Lógica:**

O script recebe dois parâmetros: a intensidade do tremor (`amount`) e o tempo de duração (`duration`). Antes de aplicar o efeito, ele faz uma verificação de segurança vital usando `instance_exists(o_view_controller)`. Se o controlador estiver presente na sala, o script ajusta a variável `screenshake` para a intensidade solicitada e ativa o alarme correspondente com a duração definida. Se o controlador não for encontrado, ele interrompe a execução com um `show_error`, emitindo a mensagem "The view controller isn't in the room".

// -- Código GML --

/// @description  add_screenshake (amount, duration)

/// @param amount

/// @param  duration

function add_screenshake(argument0, argument1) {

 var amount = argument0;

 var duration = argument1;

 if(instance_exists(o_view_controller))

 {

     o_view_controller.screenshake = amount;

     o_view_controller.alarm[SCREENSHAKE] = duration;

 }

 else

 {

     show_error("The view controller isn't in the room", true);

 }

}
