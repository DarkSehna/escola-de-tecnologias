# Documentação Técnica: Objeto DashEffect_obj (Efeito Visual de Rastro)

**Projeto:** Tutorial TopView (Movimentação em Eixos)

**Função:** Criar um efeito de rastro (ghosting) temporário para habilidades de movimento rápido, como um "Dash". O objeto é puramente estético, iniciando semi-transparente e desaparecendo gradualmente até se autodestruir.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa o efeito visual com 50% de transparência.

// -- Código GML (Create) --
/// @description Initialize the dash effect
image_alpha = .5;

--------------------------------------------------

## 2. Evento: Step

Descrição: Reduz a transparência em 0.1 a cada frame até destruir-se ao atingir 0.

// -- Código GML (Step) --
/// @description Fade
if (image_alpha > 0)
{
    image_alpha -= .1;
}
else
{
    instance_destroy();
}

# Documentação Técnica: Objeto Door_obj (Transição de Salas)

**Projeto:** Tutorial TopView (Movimentação em Eixos)

**Função:** Gatilho de teletransporte (Warp) para mudança de sala.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa variáveis de destino sobrescrevíveis no editor da sala.

// -- Código GML (Create) --
/// @description Inialize door
new_x = 0;
new_y = 0;
new_room = noone;

# Documentação Técnica: Objeto hitbox_obj (Ataque Corpo-a-Corpo)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

**Função:** Área de colisão invisível e temporária para ataques.

--------------------------------------------------

## 1. Evento: Create

Descrição: Inicializa estatísticas e define vida de 1 frame.

// -- Código GML (Create) --
/// @description Initialize damage object
damage = 1;
knockback = 15;
creator = noone;
alarm[0] = 1;

--------------------------------------------------

## 2. Evento: Alarm 0

Descrição: Destrói a hitbox após 1 frame.

// -- Código GML (Alarm 0) --
/// @description Destroy self
instance_destroy();

--------------------------------------------------

## 3. Eventos: Collision (Com Player_obj e Lifeform_obj)

Descrição: Aplica dano e empurrão físico real usando Box2D.

// -- Código GML (Collision) --
if (other.id != creator)
{
    other.hp -= 1;
    var dir = point_direction(creator.x, creator.y, other.x, other.y);
    var xforce = lengthdir_x(knockback, dir);
    var yforce = lengthdir_y(knockback, dir);
    with(other)
    {
        physics_apply_impulse(x, y, xforce, yforce);
    }
}

# Documentação Técnica: Objeto Lifeform_obj (Classe Pai / Entidade Viva)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

**Função:** Objeto base para entidades com física Box2D, ordenação de profundidade e HP.

--------------------------------------------------

## 1. Evento: Create

Descrição: Configura rotação travada (`phy_fixed_rotation = true`) e vida padrão.

// -- Código GML (Create) --
/// @description Initialize the lifeform
phy_fixed_rotation = true;
hp = 3;

--------------------------------------------------

## 2. Evento: Step

Descrição: Aplica profundidade `depth = -y` e destrói ao zerar HP.

// -- Código GML (Step) --
/// @description Control depth
depth = -y;
if (hp <= 0)
{
    instance_destroy();
}

# Documentação Técnica: Objeto Player_obj (Avatar do Jogador)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

--------------------------------------------------

## 1. Evento: Create

Descrição: Herda do Lifeform_obj, define HP = 20 e estado inicial `move_state_scr`.

// -- Código GML (Create) --
event_inherited();
image_speed = 0;
spd = 4;
state = move_state_scr;
hp = 20;
face = RIGHT;

--------------------------------------------------

## 2. Evento: Step & Draw

Descrição: Executa o script do estado atual com `script_execute(state)` e desenha sombra.

// -- Código GML (Step) --
event_inherited();
script_execute(state);

// -- Código GML (Draw) --
draw_sprite(PlayerShadow_spr, image_index, x, y);
draw_self();

--------------------------------------------------

## 3. Eventos: Alarm 0 e Animation End

Descrição: Alarm 0 encerra o Dash e Animation End encerra o ataque.

// -- Código GML (Animation End) --
if (state == attack_state_scr)
{
    state = move_state_scr;
    attack = false;
}

# Documentação Técnica: Objeto PlayerStats_obj (Controlador de Status e HUD)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

--------------------------------------------------

## 1. Evento: Create & Draw GUI

// -- Código GML (Create) --
hp = 5;
maxhp = hp;
sta = 10;
maxsta = sta;
level = 1;

// -- Código GML (Draw GUI) --
draw_set_colour(c_white);
draw_text(32, 96, "Level: " + string(level));
draw_text(32, 32, "HP: " + string(hp) + "/" + string(maxhp));
draw_text(32, 64, "STA: " + string(sta) + "/" + string(maxsta));

# Documentação Técnica: Objeto slime_obj (Inimigo Base)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

// -- Código GML (Create) --
event_inherited();
image_speed = .1;
spd = .5;
state = enemy_idle_state_scr;
alarm[0] = room_speed * irandom_range(2, 5);
sight = 64;
targetx = 0;
targety = 0;

// -- Código GML (Step) --
event_inherited();
script_execute(state);

# Documentação Técnica: Objeto view_obj (Câmera Suave)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

// -- Código GML (Step) --
if (instance_exists(Player_obj))
{
    x += (Player_obj.x - x) * .3;
    y += (Player_obj.y - y) * .3;
}

# Documentação Técnica: Scripts Core (Player e Inimigos TopView)

**Projeto:** Tutorial TopView (Movimentação em Eixos / Física Box2D)

* **macros.gml**:
```gml
#macro RIGHT 0
#macro UP 1
#macro LEFT 2
#macro DOWN 3
```

* **input_scr.gml**:
Captura comandos com eixos virtuais `xaxis` e `yaxis`.

* **move_state_scr.gml**:
Movimento vetorial com `lengthdir_x` e `lengthdir_y`. Transições para Dash (Z) e Attack (X).

* **dash_state_scr.gml**:
Multiplica velocidade (`len = spd * 4`), aplica impulso Box2D e cria instâncias de `DashEffect_obj`.

* **attack_state_scr.gml**:
Instancia `hitbox_obj` no frame 3 da animação de ataque.

* **check_for_player_scr.gml**:
Radar circular de visão usando `point_distance` para transitar para perseguição (`enemy_chase_state_scr`).

* **enemy_choose_next_state_scr.gml / enemy_wander_state_scr.gml**:
Patrulha autônoma gerando coordenadas aleatórias com temporizador de 2 a 4 segundos.
