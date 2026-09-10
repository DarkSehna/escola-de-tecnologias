# Documentação Técnica: Objeto obj_Bite (Item Coletável)

**Projeto:** Jogo Legado (Base de Aula - Origem GM 1.4)

**Função:** Atuar como um power-up no cenário. Ao ser coletado, desbloqueia a habilidade de morder para o jogador e exibe um texto instrutivo na tela.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa as propriedades visuais e os dados do item. Ele utiliza "event_inherited()" para herdar comportamentos de um objeto pai (provavelmente um controlador genérico de itens), define uma animação lenta para o sprite e armazena a mensagem de tutorial que será mostrada ao jogador.

*Nota estrutural:* O comentário "ggShoot_Initiation" sugere que esse código foi adaptado a partir de um power-up de tiro anterior, uma prática comum no desenvolvimento ágil.

// -- Código GML (Create) --

/// @description ggShoot_Initiation

event_inherited();

image_speed = 0.1;

powerMSG = "Morda com C."

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: É o gatilho de coleta. Quando o objeto do jogador colide com o item, três coisas acontecem instantaneamente:

1\. A variável "canBite" dentro do objeto Player passa a ser verdadeira, liberando a mecânica na máquina de estados do jogador.

2\. O item se destrói (some do cenário).

3\. Um script customizado (scr_text) é chamado para desenhar a mensagem de tutorial flutuando um pouco acima (y-64) da cabeça do jogador.

// -- Código GML (Collision_Player) --

/// @description Collect

Player.canBite = true;

instance_destroy();

scr_text(powerMSG, .4, Player.x-32, Player.y-64);

# Documentação Técnica: Objeto obj_Bullet (Projétil do Jogador)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atuar como o tiro disparado pelo jogador. O projétil viaja em linha reta, herda a direção do jogador no momento da criação e possui sistemas automáticos de autodestruição para otimização de memória.

--------------------------------------------------

## 1. Evento: Create

Descrição: Assim que o tiro nasce, ele define sua velocidade base (spd = 10) e pergunta ao Player para qual lado ele está olhando. Com base nisso, o tiro ajusta sua direção (bspd), inverte seu próprio sprite (image_xscale) se necessário, e ativa um cronômetro de 60 frames (Alarm 0) para se autodestruir caso se perca pelo cenário.

// -- Código GML (Create) --

/// @description bullet initiation

spd = 10;

image_speed = 0;

if (Player.dir == "Right")

{

  bspd = spd;

  image_xscale = 1;

}

else if (Player.dir == "Left")

{

  bspd = -spd;

  image_xscale = -1;

}

// damage = player_stats.attack; (Futura implementação de RPG)

creator = noone;

alarm[0] = 60;

--------------------------------------------------

## 2. Evento: Step

Descrição: Acontece a cada frame. Simplesmente soma a velocidade calculada (bspd) à posição horizontal (x) do tiro, fazendo-o voar pela tela.

// -- Código GML (Step) --

/// @description bullet logic

x += bspd;

--------------------------------------------------

## 3. Evento: Alarm 0

Descrição: O cronômetro de limite de distância. Se o tiro voar por 60 frames (cerca de 1 a 2 segundos de jogo) sem atingir nada, ele é destruído para liberar memória RAM.

// -- Código GML (Alarm 0) --

/// @description bullet destroy

instance_destroy();

--------------------------------------------------

## 4. Eventos de Colisão (Wall, Guard, Scientist)

Descrição: O projétil reage a obstáculos e inimigos (Guarda e Cientista). O código é exatamente o mesmo para todos: ao encostar em qualquer um desses objetos físicos, a bala se destrói instantaneamente. O dano que os inimigos recebem geralmente é calculado no evento de colisão dentro do próprio objeto do inimigo.

// -- Código GML (Collision_Wall / Collision_Guard / Collision_Scientist) --

/// @description bullet destroy

instance_destroy();

# Documentação Técnica: Objeto Chek_obj (Checkpoint / Ponto de Controlo)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atuar como um gatilho visual de progresso (como um checkpoint, placa lida ou interruptor). Serve para dar feedback imediato ao jogador de que uma área foi alcançada ou ativada.

--------------------------------------------------

## 1. Evento: Collision (Com objeto Player)

Descrição: Ocorre no momento exato em que o jogador encosta neste objeto. A única ação executada é a troca da própria imagem (sprite_index) para "Checked_spr" (provavelmente uma versão com uma luz acesa ou uma bandeira levantada).

*Nota para aulas:* Num sistema completo de Save State, seria logo abaixo desta linha que adicionaríamos o código para gravar a posição X e Y do jogador no ficheiro de gravação.

// -- Código GML (Collision_Player) --

sprite_index = Checked_spr;

# Documentação Técnica: Objeto CS1 (Interruptor / Switch)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Funciona como um interruptor no cenário. Quando tocado pelo jogador, muda seu próprio estado visual (de desligado para ligado) e envia um comando remoto para abrir uma porta específica associada a ele.

--------------------------------------------------

## 1. Evento: Create

Descrição: Trava a animação do sprite no frame inicial (image_index = 0). Isso garante que o interruptor nasça na sala com o visual de "Desligado" ou "Não Pressionado", sem ficar piscando a animação.

// -- Código GML (Create) --

image_speed = 0;

image_index = 0;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: O gatilho de ativação. Ao encostar no jogador, ele primeiro usa uma verificação de segurança (instance_exists) para ter certeza de que a porta "OD1" existe na sala para não estourar um erro. Em seguida, ele altera a variável interna da porta (door_open) para verdadeiro, mandando ela se abrir. Por fim, o interruptor avança para o frame 1 da sua própria animação, mostrando que foi ativado.

// -- Código GML (Collision_Player) --

if (instance_exists(OD1))

{

    OD1.door_open = true;

}

image_index = 1;

# Documentação Técnica: Objeto CS2 (Interruptor / Switch 2)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Funciona como o segundo interruptor do cenário. Quando tocado pelo jogador, muda o seu próprio estado visual para ligado e envia um comando remoto para abrir a segunda porta associada a ele (OD2).

--------------------------------------------------

## 1. Evento: Create

Descrição: Trava a animação do sprite no frame inicial (image_index = 0). Isso garante que o interruptor surge na sala com o visual de "Desligado", sem reproduzir a animação em loop.

// -- Código GML (Create) --

image_speed = 0;

image_index = 0;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: O gatilho de ativação. Tal como no primeiro botão, utiliza uma verificação de segurança (instance_exists) para ter a certeza de que a porta "OD2" existe na sala, evitando erros de execução. Em seguida, altera a variável interna dessa porta (door_open) para verdadeiro. Por fim, o interruptor avança para o frame 1 da sua própria animação.

// -- Código GML (Collision_Player) --

if (instance_exists(OD2))

{

    OD2.door_open = true;

}

image_index = 1;

# Documentação Técnica: Objeto obj_Guard (Inimigo Guarda)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Inimigo de ataque à distância (Ranged). Utiliza uma Máquina de Estados Finita (FSM) para alternar entre patrulhar, atacar e ficar atordoado.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa as estatísticas do inimigo (vida, velocidade, campo de visão). O mais importante aqui é a variável "state", que define o estado inicial da máquina de estados (scr_enemy_idle_state). Também define o tipo de inimigo como "Range" (à distância) e prepara o cooldown de tiro.

// -- Código GML (Create) --

event_inherited();

hp = 5;

state = scr_enemy_idle_state;

spd = 4;

alarm[0] = room_speed*irandom_range(2, 5); // Temporizador aleatório para patrulha

sight = 256; // Campo de visão para detetar o jogador

targetx = 0;

targety = 0;

image_speed = 0;

sState = ""; // String para guardar o nome do estado (usado em depuração)

attack = 1;

EcanShoot = true; // Controlo de cadência de tiro

dir = "Right";

EType = "Range";

stun = false; // Controlo de atordoamento

--------------------------------------------------

## 2. Evento: Step

Descrição: O "motor" da inteligência artificial. A cada frame, ele herda o comportamento do objeto pai e executa o script correspondente ao estado atual do inimigo. A magia da FSM acontece na função "script_execute(state)".

// -- Código GML (Step) --

event_inherited();

script_execute(state);

--------------------------------------------------

## 3. Eventos: Alarms (0, 1 e 10)

Descrição: Gestores de tempo (cooldowns) da IA do guarda.

- Alarm 0: Regula o tempo de deambulação (Wander) na patrulha.

- Alarm 1: Recarrega a arma do guarda, permitindo um novo disparo (EcanShoot = true).

- Alarm 10: Dita o fim do efeito de atordoamento no inimigo (stun = false).

// -- Código GML (Alarm 1) --

EcanShoot = true;

// -- Código GML (Alarm 10) --

stun = false;

--------------------------------------------------

## 4. Eventos de Colisão (Bullet e Player)

Descrição: Como o guarda reage ao mundo.

- Colisão com Bullet (Tiro do Jogador): O guarda fica atordoado (stun = true), parando as suas ações.

- Colisão com Player: O guarda força a máquina de estados a recalcular e escolher o próximo estado, geralmente invertendo a marcha ou atacando.

// -- Código GML (Collision_Bullet) --

stun = true;

// -- Código GML (Collision_Player) --

state = scr_enemy_choose_next_state;

--------------------------------------------------

## 5. Eventos de Colisão (Wall e Invisiwall)

Descrição: Blocos de contenção. O "invisiwall" é uma técnica clássica de Level Design onde se colocam paredes invisíveis no ecrã para limitar a área de patrulha de um inimigo, impedindo-o de cair de plataformas. O código em si está vazio apenas para ativar o evento físico.

--------------------------------------------------

## 6. Evento: Draw GUI (Draw 64)

Descrição: Ferramenta de depuração (Debug) deixada pelo desenvolvedor. Desenhava o estado atual do inimigo no ecrã para facilitar a descoberta de bugs durante a programação da FSM.

// -- Código GML (Draw 64) --

// draw_set_colour(c_white);

// draw_text(672,16,"Estado: " + sState);

# Documentação Técnica: Objeto obj_GuardBullet (Projétil do Inimigo)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Projétil disparado pelos inimigos (neste caso, o Guarda). Ele calcula a posição do jogador no momento do disparo para definir a sua trajetória, aplica atordoamento (stun) caso acerte o alvo e possui autodestruição otimizada.

--------------------------------------------------

## 1. Evento: Create

Descrição: Assim que o tiro inimigo é criado, ele faz uma leitura rápida da sala: compara a sua própria posição (x) com a do jogador (Player.x). Com isso, decide se deve voar para a direita (bspd = spd) ou para a esquerda (bspd = -spd) e inverte o próprio sprite (image_xscale). Também aciona o cronômetro de limite de distância (Alarm 0).

// -- Código GML (Create) --

/// @description bullet initiation

spd = 5;

bspd = 0;

creator = noone;

image_speed = 0;

if (Player.x > x)

{

  bspd = spd;

  image_xscale = -1;

}

else if (Player.x < x)

{

  bspd = -spd;

  image_xscale = 1;

}

//damage = inimigo_obj.attack;

alarm[0] = 60;

--------------------------------------------------

## 2. Evento: Step

Descrição: Acontece a cada frame. Move o projétil pelo cenário somando a velocidade (bspd) ao eixo horizontal (x).

// -- Código GML (Step) --

/// @description bullet logic

x += bspd;

--------------------------------------------------

## 3. Evento: Alarm 0

Descrição: Limpador de memória. Se o tiro do guarda voar por 60 frames sem acertar o jogador ou uma parede, ele simplesmente deixa de existir.

// -- Código GML (Alarm 0) --

/// @description bullet destroy

instance_destroy();

--------------------------------------------------

## 4. Evento: Collision (Com objeto Player)

Descrição: A consequência do acerto. Quando a bala do inimigo toca no jogador, ela aplica um efeito de controle de grupo: ativa o estado de atordoamento (stun = true) no Player por 40 frames através de um Alarm dentro do próprio objeto Player, e depois destrói o projétil.

// -- Código GML (Collision_Player) --

/// @description Damage Enemy

if (other.id != creator)

{

  Player.stun = true;

  Player.alarm[2] = 40;

  instance_destroy();

}

--------------------------------------------------

## 5. Evento: Collision (Com objeto Wall)

Descrição: Colisão com cenário. Bater numa parede destrói o tiro, impedindo que atravesse a geometria do mapa.

// -- Código GML (Collision_Wall) --

/// @description Destroy

instance_destroy();

# Documentação Técnica: Objeto obj_Jaw (Ataque Mordida / Hitbox)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Funciona como a área de colisão (hitbox) do ataque de mordida do jogador. É um ataque corpo-a-corpo temporário capaz de quebrar obstáculos específicos e que desaparece automaticamente.

--------------------------------------------------

## 1. Evento: Create

Descrição: Quando o jogador pressiona o botão de ataque, este objeto é gerado. Ele verifica instantaneamente a variável de direção do jogador (Player.dir) e ajusta a sua própria escala (image_xscale) para garantir que a animação da mordida sai virada para o lado correto (esquerda ou direita).

// -- Código GML (Create) --

image_speed = 0.2;

if (Player.dir == "Right")

{

 image_xscale = 1;

}

else if (Player.dir == "Left")

{

 image_xscale = -1;

}

creator = noone;

--------------------------------------------------

## 2. Evento: Animation End (Other 7)

Descrição: Otimização perfeita para ataques corpo-a-corpo. Em vez de usar um Alarm (cronómetro) para decidir quando o ataque acaba, o objeto simplesmente espera que a sua animação termine. Assim que o último frame passa, ele destrói-se a si mesmo.

// -- Código GML (Animation End) --

instance_destroy();

--------------------------------------------------

## 3. Evento: Collision (Com objeto WeakWall)

Descrição: Interação de ambiente típica de Metroidvanias. Se a mordida encostar numa "Parede Fraca", ela destrói a parede (abrindo um novo caminho para o jogador). O detalhe genial do aluno é a verificação do frame (image_index == 2). Isso garante que a parede só quebra no momento visual exato em que os "dentes" se fecham na animação, e não logo no primeiro milissegundo do ataque.

// -- Código GML (Collision_WeakWall) --

if (image_index == 2)

{

    instance_destroy(other);

}

# Documentação Técnica: Objeto obj_Jump (Item Coletável / Power-up)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atuar como um power-up de cenário. Ao ser coletado, desbloqueia a habilidade de pular para o jogador e exibe um texto instrutivo flutuante na tela.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o item herdando o comportamento do seu objeto pai. Define uma animação contínua para o sprite e armazena a mensagem de tutorial. O uso do prefixo "@" na string permite formatar o texto em múltiplas linhas diretamente no editor.

// -- Código GML (Create) --

/// @description Jump_Initiation

event_inherited();

image_speed = 0.2;

powerMSG = @"Pule com

seta para cima.";

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: O gatilho de coleta. Assim que o jogador colide com o objeto, a variável "canJump" do Player passa a ser verdadeira. Imediatamente depois, o item é destruído do cenário e o script customizado "scr_text" é chamado para renderizar a instrução de pulo um pouco acima da posição do jogador.

// -- Código GML (Collision_Player) --

/// @description Collect

Player.canJump = true;

instance_destroy();

scr_text(powerMSG, .4, Player.x-32, Player.y-64);

# Documentação Técnica: Objeto NLDoor (Porta de Transição / Automática)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atua como uma porta interativa no cenário, muito possivelmente uma "Next Level Door" (Porta de Próximo Nível). Ela reage diretamente ao toque do jogador para iniciar a sua animação de transição.

--------------------------------------------------

## 1. Evento: Create

Descrição: Trava a animação do sprite definindo a velocidade de imagem para zero. Isso garante que a porta é carregada na sala no seu estado estático (fechada), impedindo que a animação fique em loop antes da interação.

// -- Código GML (Create) --

image_speed = 0;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: O gatilho mecânico e visual. No exato momento em que o jogador colide com a hitbox da porta, a velocidade da animação é alterada para 0.3. Isto dá o feedback visual imediato de que a porta está a reagir à presença da personagem (por exemplo, abrindo as comportas).

// -- Código GML (Collision_Player) --

image_speed = 0.3;

# Documentação Técnica: Objeto OD1 (Porta Controlada / Open Door 1)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Funciona como um obstáculo (porta) que bloqueia o jogador até que um gatilho remoto (como o interruptor CS1) a destranque.

--------------------------------------------------

## 1. Evento: Create

Descrição: Quando a sala é carregada, a porta define o seu estado inicial como "fechada" (falsa), garantindo que o obstáculo está ativo desde o primeiro momento.

// -- Código GML (Create) --

door_open = false;

--------------------------------------------------

## 2. Evento: Step

Descrição: O "ouvido" da porta. A cada frame, ela verifica se a sua variável interna "door_open" foi alterada para verdadeira  (ação executada por um interruptor externo). Assim que isso acontece, a porta destrói-se a si mesma, libertando o caminho.

// -- Código GML (Step) --

if (door_open == true)

{

    instance_destroy();

}

# Documentação Técnica: Objeto obj_Player (Base Metroidvania)

**Projeto:** Jogo Legado (Evolução GM 1.4 -> Unity -> FSM Real)

**Função:** Objeto principal controlado pelo jogador. Gerencia habilidades desbloqueáveis (salto, tiro, mordida), física de movimento e sistema de "Respawn" após morte ou queda em perigos.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o estado do jogador. Além da física básica, define os bloqueios iniciais de habilidades (canJump, canShoot, canBite) que serão ativados pelos coletáveis. Também salva o ponto de nascimento para o sistema de checkpoint.

// -- Código GML (Create) --

spd = 4;        // Velocidade de movimento

jspd = 12;      // Força do pulo

hspd = 0;       // Velocidade horizontal atual

vspd = 0;       // Velocidade vertical atual

grav = 1;       // Gravidade aplicada

// Habilidades (Iniciam bloqueadas para progressão Metroidvania)

canJump = false;

canShoot = false;

canBite = false;

canWJump = false; // Pulo na parede

// Controles de Estado e Delays

shootDelay = true;

BiteDelay = true;

stun = false;   // Estado de atordoamento

Death = false;  // Gatilho de morte/reset

dir = "Right";  // Lado para onde está olhando

image_speed = .2;

state = move_state_scr; // Inicia a máquina de estados

// Registro de Checkpoint inicial

player_xstart = x;

player_ystart = y;

--------------------------------------------------

## 2. Evento: Step

Descrição: Atualiza a profundidade visual para sobreposição correta de sprites e mantém a máquina de estados ativa a cada frame.

// -- Código GML (Step) --

depth = -y;

state = move_state_scr();

--------------------------------------------------

## 3. Eventos de Alarme (0, 1 e 2)

Descrição: Gerenciam os tempos de espera (cooldowns) das ações e a duração do atordoamento.

// -- Código GML (Alarme 0) --

shootDelay = true; // Permite disparar novamente

// -- Código GML (Alarme 1) --

BiteDelay = true;  // Permite morder novamente

// -- Código GML (Alarme 2) --

stun = false;      // Finaliza o estado de atordoamento

--------------------------------------------------

## 4. Eventos de Colisão (Perigos e Checkpoint)

Descrição: Define o que acontece quando o jogador toca em perigos (água/geradores) ou em um ponto de salvamento.

// -- Código GML (Collision_Water / Collision_WaterGenerator) --

Death = true; // Ativa o gatilho de morte para resetar a posição

// -- Código GML (Collision_Check_obj) --

// Atualiza o local de nascimento para este checkpoint

player_xstart = other.x;

player_ystart = other.y;

--------------------------------------------------

## 5. Evento: Animation End (Other 7)

Descrição: Utilizado aqui para processar o "Respawn". Se o gatilho de morte foi ativado, o jogador é teletransportado de volta para o último checkpoint salvo e o estado de morte é resetado.

// -- Código GML (Other 7) --

if (Death)

{

    x = player_xstart;

    y = player_ystart;

    Death = false;

}

# Documentação Técnica: Objeto obj_Power (Objeto Pai de Coletáveis)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atuar como a base estrutural para todos os itens que concedem habilidades ao jogador. Ele define as variáveis iniciais que os objetos filhos herdam e utilizam.

--------------------------------------------------

## 1. Evento: Create

Descrição: Define o estado inicial de qualquer item de poder. Ele trava a animação para garantir que o objeto use apenas o frame desejado e inicializa a variável de mensagem (powerMSG) como vazia, permitindo que cada "filho" (Jump, Bite, etc.) escreva sua própria instrução customizada.

// -- Código GML (Create) --

/// @description Power Initiation

image_speed = 0;  // Trava a animação inicial

powerMSG = "";    // Variável que será preenchida pelos objetos filhos

# Documentação Técnica: Objeto obj_Scientist (Inimigo Cientista)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Inimigo com comportamento de perseguição ou ataque de proximidade. Utiliza um sistema de temporizadores (Alarms) para gerenciar animações de ataque, atordoamento e reinicialização de estado.

--------------------------------------------------

## 1. Evento: Collision (Com objeto Bullet)

Descrição: Gerencia a reação ao projétil do jogador. Ao ser atingido, o cientista entra no estado de atordoamento (stun), interrompendo suas ações normais.

// -- Código GML (Collision_Bullet) --

/// @description stun enemy

stun = true;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: Define a reação física ao tocar o jogador. O código atual reinicia a velocidade da animação para garantir o feedback visual da interação.

// -- Código GML (Collision_Player) --

/// @description Invert Enemy Move

image_speed = .2;

--------------------------------------------------

## 3. Evento: Alarme 2 (Lógica de Ataque)

Descrição: Gatilho de dano. Quando este alarme dispara, o inimigo muda para o sprite de ataque (ScientistAtk_spr), ativa o estado de morte (Death) no jogador e inicia um novo alarme para finalizar a ação.

// -- Código GML (Alarme 2) --

/// @description Control Atk

sprite_index = ScientistAtk_spr;

Player.Death = true;

alarm[3] = 15;

--------------------------------------------------

## 4. Evento: Alarme 3 (Reset de Estado)

Descrição: Limpeza pós-ataque. Restaura a capacidade de ataque do inimigo (CanAttack), retorna o sprite ao estado normal e redefine a máquina de estados para "Idle" (parado).

// -- Código GML (Alarme 3) --

/// @description Reset Game

CanAttack = true;

state = scr_enemy_idle_state;

sprite_index = Scientist_spr;

--------------------------------------------------

## 5. Evento: Alarme 10 (Recuperação)

Descrição: Responsável por encerrar o estado de atordoamento (stun), permitindo que o inimigo volte a agir no cenário.

// -- Código GML (Alarme 10) --

/// @description reset stun

stun = false;

--------------------------------------------------

## 6. Evento: Colisões de Cenário (Wall / Invisiwall)

Descrição: Garante que o inimigo respeite a geometria do mapa e as paredes invisíveis de patrulha.

// -- Código GML (Collision_Wall / Collision_invisiwall) --

/// @description collide

// Evento vazio utilizado para detecção física de colisão

# Documentação Técnica: Objeto obj_Scientist (Inimigo Cientista - FSM)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Inimigo de combate corpo-a-corpo (Melee). Utiliza uma Máquina de Estados Finita (FSM) para alternar entre comportamentos de patrulha e ataque, com detecção visual do jogador.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa as estatísticas vitais e a lógica de IA. Define o estado inicial como "Idle" e configura o inimigo como tipo "Melee". Estabelece um campo de visão (sight) de 256 pixels para detectar a proximidade do jogador e inicia um cronômetro aleatório para patrulha.

// -- Código GML (Create) --

event_inherited();

hp = 5;

state = scr_enemy_idle_state;

spd = 2;

alarm[0] = room_speed * irandom_range(2, 5); // Tempo para mudar de direção na patrulha

sight = 256; // Distância de detecção do jogador

image_speed = 0;

sState = ""; // Variável de texto para depuração de estado

CanAttack = true; // Controle de cadência de ataque

EcanShoot = true; // (Variável herdada, não usada em Melee)

dir = "Right";

EType = "Melee";

stun = false; // Controle de estado de atordoamento

--------------------------------------------------

## 2. Evento: Step

Descrição: O motor de decisão do inimigo. Ele executa continuamente o script armazenado na variável "state". Isso permite que o comportamento do cientista mude dinamicamente (de caminhar para atacar) sem a necessidade de múltiplos blocos "if/else" complexos.

// -- Código GML (Step) --

event_inherited();

script_execute(state);

--------------------------------------------------

## 3. Evento: Collision (Com objeto Player)

Descrição: Feedback visual de contato. Quando o cientista toca no jogador, a velocidade da animação é definida para garantir que o sprite reaja visualmente ao impacto ou movimento.

// -- Código GML (Collision_Player) --

image_speed = 0.2;

--------------------------------------------------

## 4. Evento: Draw GUI (Draw 64)

Descrição: Utilizado para ferramentas de desenvolvimento. Permite visualizar em tempo real qual script de estado está sendo executado pelo inimigo através de texto na interface (GUI).

// -- Código GML (Draw 64) --

/*

draw_set_colour(c_white);

draw_text(672,32,"Estado: " + sState);

*/

# Documentação Técnica: Objeto obj_Shoot (Item Coletável / Tiro)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Power-up que desbloqueia a habilidade de ataque à distância para o jogador.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o item herdando as propriedades do objeto pai (obj_Power). Define a velocidade da animação e a string que será exibida no tutorial flutuante.

// -- Código GML (Create) --

/// @description Shoot_Initiation

event_inherited();

image_speed = 0.1;

powerMSG = "Atire com Z.";

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: Ao colidir com o jogador, o item ativa a variável "canShoot" no objeto Player, permitindo o disparo de projéteis. Em seguida, o item se destrói e utiliza o script "scr_text" para fornecer feedback instrutivo na tela.

// -- Código GML (Collision_Player) --

/// @description Collect

Player.canShoot = true;

instance_destroy();

scr_text(powerMSG, .4, Player.x-32, Player.y-64);

# Documentação Técnica: Objeto TargetSwitch (Interruptor de Tiro)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atua como um interruptor remoto que só pode ser ativado quando atingido por um projétil (tiro) do jogador. É ideal para puzzles que exigem precisão ou para abrir caminhos inacessíveis ao toque direto.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o objeto com uma velocidade de animação constante, provavelmente para fornecer um feedback visual de que o alvo está "ativo" ou pulsando no cenário.

// -- Código GML (Create) --

image_speed = 0.2;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Bullet)

Descrição: O gatilho de ativação remota. Quando o tiro do jogador colide com este objeto, ele verifica a existência da porta "OD3" e a destranca. Além disso, o interruptor muda o seu próprio visual para indicar que já foi utilizado.

// -- Código GML (Collision_Bullet) --

if (instance_exists(OD3))

{

    OD3.door_open = true;

}

sprite_index = TargetSwitchShot_spr; // Muda para o visual de "ativado"

# Documentação Técnica: Objeto text_obj (Sistema de Mensagens/Caixa de Texto)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Criar e renderizar caixas de texto dinâmicas. O objeto gerencia o efeito de "digitação" das letras, o fundo da interface (textbox) e a autodestruição após um tempo determinado.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa as variáveis de controle da interface. Define a transparência inicial (alpha) como zero para um efeito de fade-in e prepara as variáveis de string. O objeto também ajusta sua própria profundidade (depth) para garantir que o texto seja desenhado acima de outros elementos de interface já existentes.

// -- Código GML (Create) --

alpha = 0;

print = "";

time = 0;

depth = depth - instance_number(text_obj); // Garante que o novo texto fique no topo

alarm[0] = 100; // Tempo de vida da mensagem na tela

--------------------------------------------------

## 2. Evento: Draw

Descrição: Responsável pela renderização visual completa. Ele executa três funções principais:

1\. Efeito de Digitação: Copia a string original caractere por caractere com base na variável "time".

2\. Fade-in: Aumenta gradualmente o alpha até 1.

3\. Desenho de Interface: Desenha um retângulo cinza com borda preta (a caixa) e o texto em branco por cima, respeitando o preenchimento (padding) e o tamanho da fonte.

// -- Código GML (Draw) --

if (time < text_length) {

    time += spd;

    print = string_copy(text, 0, time);

}

// Controle de transparência

draw_set_alpha(alpha);

if (alpha < 1) alpha += spd / 10; else alpha = 1;

// Desenho da caixa e do texto

draw_rectangle(x, y, x+boxwidth, y+boxheight, 0); // Fundo

draw_text_ext(x + padding, y + padding, string_hash_to_newline(print), ...);

draw_set_alpha(1); // Reseta o alpha para outros objetos

--------------------------------------------------

## 3. Evento: Alarm 0

Descrição: Atua como o tempo de expiração. Após os 100 frames definidos no Create, o objeto se destrói automaticamente para limpar a interface.

// -- Código GML (Alarm 0) --

instance_destroy();

# Documentação Técnica: Objeto obj_Water (Perigo Ambiental)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atua como um obstáculo letal no cenário. Ao entrar em contato com a água, o jogador é derrotado e enviado de volta ao último checkpoint salvo.

--------------------------------------------------

## 1. Evento: Create

Descrição: Define a velocidade da animação do sprite da água, garantindo que o visual do líquido seja fluido e constante no cenário.

// -- Código GML (Create) --

/// @description Water_Initiation

image_speed = 0.2;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: O gatilho de derrota. Quando o jogador toca na água, a variável "Death" do objeto Player é definida como verdadeira, o que aciona a lógica de respawn (visto anteriormente no evento "Other 7" do Player).

// -- Código GML (Collision_Player) --

/// @description Water_Death

Death = true;

# Documentação Técnica: Objeto obj_WaterGenerator (Perigo Ambiental)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Atua como um gerador de obstáculos ou zona de perigo dinâmico. Assim como o objeto de água padrão, ele causa a derrota imediata do jogador ao contato.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o gerador com uma animação constante, sugerindo um fluxo ou movimento no perigo ambiental.

// -- Código GML (Create) --

/// @description WaterGenerator_Initiation

image_speed = 0.2;

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: Define a interação letal com o jogador. Ao colidir com este objeto, a variável de morte do jogador é ativada.

// -- Código GML (Collision_Player) --

/// @description Water_Death

Death = true;

# Documentação Técnica: Objeto obj_WJump (Item de Habilidade / Wall Jump)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Power-up que desbloqueia a capacidade do jogador de realizar saltos na parede (Wall Jump). Fundamental para a progressão vertical típica do gênero.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o item utilizando herança do objeto pai (obj_Power). Define a velocidade da animação e a mensagem de tutorial que utiliza o prefixo "@" para preservar a quebra de linha.

// -- Código GML (Create) --

/// @description WJump_Initiation

event_inherited();

image_speed = 0.1;

powerMSG = @"Grude em

paredes serradas."

--------------------------------------------------

## 2. Evento: Collision (Com objeto Player)

Descrição: O gatilho de coleta. Ativa a permissão lógica no Player, destrói o item e exibe o texto de instrução na tela.

// -- Código GML (Collision_Player) --

/// @description Collect

Player.canWJump = true;

instance_destroy();

scr_text(powerMSG, .4, Player.x-32, Player.y-64);

# Documentação Técnica: Scripts Globais e de Jogador (Core Logic)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

--------------------------------------------------

## 1. Script: input_scr

Descrição: Responsável por ler os inputs do jogador (teclado) e traduzi-los para variáveis curtas de controle. Isso centraliza a entrada de comandos, facilitando a alteração de teclas no futuro. O script também possui um bloco de controle por Gamepad comentado, indicando uma tentativa de suporte a controles físicos.

// -- Mapeamento de Teclas --

rk = Seta para Direita (Right)

lk = Seta para Esquerda (Left)

jk = Seta para Cima (Jump / Z)

down_key = Seta para Baixo (Down)

sk = Tecla Z (Shoot)

bk = Tecla C (Bite)

--------------------------------------------------

## 2. Script: move_state_scr

Descrição: O "Mega Script" do Jogador. Este é o script executado a cada frame no evento Step do Player. Em vez de uma FSM moderna e modularizada, este script contém dezenas de verificações condicionais (if/else) encadeadas para gerenciar física, input, habilidades, colisão e animação simultaneamente.

// -- Estrutura Lógica do Script --

* Coleta de Input: Chama o script `input_scr()` logo no início.

* Física e Pulo: Verifica colisões no chão (Wall, SWallR, SWallL). Se estiver no chão e as variáveis `canJump`, `stun` e `Death` permitirem, aplica força negativa vertical (-jspd). Caso contrário, aplica gravidade até o limite de queda.

* Movimentação e Wall Jump: Controla a velocidade horizontal (hspd). Inclui a lógica de Wall Jump, permitindo pular ao encostar em paredes laterais específicas se `canWJump` for verdadeiro.

* Habilidades de Combate:

    * Tiro: Se `canShoot` e `shootDelay` permitirem, gera o objeto `Bullet` e ativa o cooldown (Alarm 0).

    * Mordida: Se `canBite` estiver ativo e o jogador no chão, gera o objeto temporário `Jaw` e ativa o cooldown (Alarm 1).

* Resolução de Colisões: Sistemas `while` padrão do GameMaker para parar perfeitamente o jogador ao bater horizontalmente ou verticalmente contra paredes normais ou serradas.

* Controle de Sprites: Um grande bloco condicional que altera a animação (sprite_index) dependendo se o jogador está caindo, atirando, grudado na parede, atordoado ou morto. Altera também a direção (image_xscale) baseando-se no `xprevious`.

--------------------------------------------------

## 3. Script: scr_text

Descrição: Função construtora para o sistema de tutorial. Chamada por itens coletáveis para gerar caixas de texto dinâmicas.

// -- Lógica de Construção --

* Parâmetros: Recebe o texto (argument0), velocidade de digitação (argument1) e as coordenadas X e Y (argument2, argument3).

* Instanciação: Cria um `text_obj` e injeta as variáveis recebidas nele usando a estrutura `with`.

* Responsividade: Calcula o tamanho exato da caixa de fundo (`boxwidth` e `boxheight`) com base no tamanho da fonte e na quebra de linha do texto fornecido.

# Documentação Técnica: Scripts de IA dos Inimigos (FSM Primitiva)

**Projeto:** Jogo Legado (Base de Aula - Metroidvania / Origem GM 1.4)

**Função:** Conjunto de scripts que definem a Máquina de Estados "engessada" dos inimigos (Cientista e Guarda). Os inimigos não morrem; eles apenas transitam entre patrulha, ataque e atordoamento.

--------------------------------------------------

## 1. Sistema de Decisão e Visão (Core AI)

**Script: scr_check_for_player**

Descrição: É o "radar" do inimigo. Ele calcula a distância até o jogador e, se estiver dentro do campo de visão (sight) e no mesmo eixo Y, aciona o estado de ataque. Ele verifica o tipo do inimigo (EType): se for "Range", muda para o estado de tiro; caso contrário, vai para o estado de perseguição. Se o jogador não for encontrado, ele volta a patrulhar.

**Script: scr_enemy_choose_next_state**

Descrição: O cérebro da patrulha. Quando o alarme de tempo se esgota, este script escolhe aleatoriamente o próximo movimento do inimigo: ficar parado (idle), mover para a esquerda ou mover para a direita. Em seguida, reinicia o cronômetro com um valor aleatório.

--------------------------------------------------

## 2. Estados de Patrulha (Wandering)

**Script: scr_enemy_idle_state**

Descrição: O inimigo fica parado. O seu único comportamento ativo neste estado é executar continuamente a verificação do jogador (`scr_check_for_player`).

**Scripts: scr_enemy_move_left / scr_enemy_move_right**

Descrição: Scripts de movimentação física. Eles verificam se há uma parede ou um buraco (ledge) à frente antes de dar o passo. Se o caminho estiver livre, o inimigo avança ; se bater num obstáculo, ele cancela o movimento e volta para o estado "Idle". Ambos os scripts rodam o radar de visão do jogador a cada frame.

--------------------------------------------------

## 3. Estados de Combate e Dano

**Script: scr_enemy_chase_state (Comportamento Melee - Cientista)**

Descrição: Move o inimigo na direção exata do jogador. Se ele encostar no jogador e estiver apto a atacar (CanAttack), ele trava a movimentação, muda para o sprite de investida (`ScientistCharge_spr`), ativa o alarme de dano e desativa temporariamente a sua própria capacidade de atacar.

**Script: scr_enemy_shoot_state (Comportamento Ranged - Guarda)**

Descrição: Ao detectar o jogador, ele vira-se para a direção correta  e gera um objeto de projétil (`GuardBullet`). Em seguida, ativa o `Alarm 1` para gerir a cadência de tiro (cooldown) e impede novos disparos imediatos definindo `EcanShoot = false`.

**Script: scr_enemy_stun_state (Mecânica de Obstáculo)**

Descrição: O coração da dificuldade do jogo. Como os inimigos não têm HP, este estado atua como o "dano". Ao ser atingido, a IA troca o visual do inimigo para uma versão atordoada (`ScientistStun_spr` ou `GuardStun_spr`). Ele fica preso neste estado até que o alarme de atordoamento (Alarm 10) zere a variável `stun`. Quando isso acontece, o sprite volta ao normal e o inimigo retorna para o estado `idle`.
