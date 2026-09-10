# Sistema de Diálogo (Visual Novel) - Banco de Dados

**Tipo de Asset:** Script GML
**Nome do Arquivo:** `scr_dialogData`
**Uso:** Chamado de dentro de outros objetos quando um diálogo precisa ser iniciado.

**Descrição:**
Este script funciona como o banco de dados centralizado para as conversas do jogo. Ele contém a função `scr_dialogData`, que recebe um identificador único de texto (`_idConversa`) e utiliza uma estrutura de `switch/case` para retornar um Array contendo as falas. Cada linha de diálogo é estruturada como um Struct com os parâmetros: `nome` (quem fala), `texto` (o conteúdo da fala), `lado` (onde o personagem aparece na tela: "esq", "dir", "meio") e `foto` (índice da imagem/sprite do personagem).

**Código GML:**

```gml
function scr_dialogData(_idConversa)
{
    switch(_idConversa)
    {
        case "inicio":
            return [
                { nome: "Professora", texto: "Olá! Bem-vinda ao curso.", lado: "esq", foto: 0 },
                { nome: "Aluna", texto: "Obrigada! Estou ansiosa para começar.", lado: "dir", foto: 1 }
            ];

        case "encontro_npc":
            return [
                { nome: "Guarda", texto: "Pare! Você não tem autorização.", lado: "esq", foto: 2 },
                { nome: "Aluna", texto: "Só estou de passagem...", lado: "dir", foto: 1 }
            ];

        case "escolha_caminho":
            return [
                { nome: "Sistema", texto: "Para onde você deseja ir?", lado: "meio", foto: -1 }
            ];

        case "npc_mago":
            return [
                { nome: "Mago", texto: "Olá, jovem viajante! Você viu meu cajado?", lado: "esq", foto: 0 },
                { nome: "Aluna", texto: "Ainda não, mas posso ajudar a procurar!", lado: "dir", foto: 1 }
            ];

        case "npc_gato":
            return [
                { nome: "Gato", texto: "Miau... (Ele parece querer comida).", lado: "esq", foto: 2 }
            ];

        default:
            return [];
    }
}
```

# Documentação Técnica: Objeto obj_dialogo

**Projeto:** Sistema de Visual Novel (GameMaker)
**Função:** Gerenciamento de interface, efeito de máquina de escrever e controle de fluxo de texto.

--------------------------------------------------

## 1. Evento: Create

```gml
listaDialogo = [];
indiceAtual = 0;
caractereCount = 0;
velocidadeTexto = 0.5;

guiLargura = display_get_gui_width();
guiAltura = display_get_gui_height();

podeDesenhar = false;
alarm[0] = 1;
```

--------------------------------------------------

## 2. Evento: Step

```gml
if (keyboard_check_pressed(vk_space) || mouse_check_button_pressed(mb_left)) {
    var _textoCompleto = listaDialogo[indiceAtual].texto;

    if (caractereCount < string_length(_textoCompleto)) {
        caractereCount = string_length(_textoCompleto);
    }
    else if (indiceAtual < array_length(listaDialogo) - 1) {
        indiceAtual++;
        caractereCount = 0;
    }
    else {
        instance_destroy();
    }
}
```

--------------------------------------------------

## 3. Evento: Draw GUI (Draw 64)

```gml
if (podeDesenhar && array_length(listaDialogo) > 0)
{
    var _dados = listaDialogo[indiceAtual];

    draw_set_font(fnt_dialogo);

    var _margem = 40;
    var _boxX = _margem;
    var _boxY = guiAltura - 200;
    var _boxW = guiLargura - (_margem * 2);

    draw_sprite_stretched(spr_box, 0, _boxX, _boxY, _boxW, 160);

    var _fotoX = (_dados.lado == "esq") ? _boxX + 100 : guiLargura - 140;
    draw_sprite(spr_charPortrait, _dados.foto, _fotoX, _boxY);

    draw_set_color(c_yellow);
    draw_text(_boxX + 20, _boxY + 10, _dados.nome);

    draw_set_color(c_white);

    if (caractereCount < string_length(_dados.texto)) {
        caractereCount += velocidadeTexto;
    }

    var _textoExibir = string_copy(_dados.texto, 1, floor(caractereCount));
    draw_text_ext(_boxX + 20, _boxY + 45, _textoExibir, 25, _boxW - 40);
}
```

# Documentação Técnica: Objeto obj_npc

**Projeto:** Sistema de Visual Novel (GameMaker)
**Função:** Gatilho interativo no mundo para iniciar diálogos.

```gml
// Evento Create
meuDialogoID = "npc_mago";

// Evento Mouse Left Pressed
if (!instance_exists(obj_dialogo)) {
    var _inst = instance_create_layer(0, 0, "Instances", obj_dialogo);
    _inst.listaDialogo = scr_dialogData(meuDialogoID);
}
```

# Documentação Técnica: Plataforma 5T (Scripts de Input e Movimentação)

**Projeto:** Plataforma 5T (GameMaker Studio 1.4)

* **scr_Input.gml**:
```gml
rk = keyboard_check(vk_right);
lk = keyboard_check(vk_left);
jk = keyboard_check_pressed(vk_up);
sk = keyboard_check(ord('Z'));
dk = keyboard_check(ord('X'));

if (gamepad_is_connected(0))
{
  rk = (gamepad_axis_value(0, gp_axislh) >= .5);
  lk = (gamepad_axis_value(0, gp_axislh) <= -.5);
  jk = gamepad_button_check_pressed(0, gp_face1);
  sk = gamepad_button_check(0, gp_face3);
  dk = (gamepad_button_check(0, gp_face2) || gamepad_button_check(0, gp_shoulderrb));
}
```

* **scr_move.gml**:
```gml
scr_Input();

// Pulo e Gravidade
if (obj_Player.damage == false)
{
  if (place_meeting(x, y+1, obj_Wall))
  {
    airjump = 1;
    vspd = 0;
    if (jk) { vspd = -jspd; }
  }
  else
  {
    if (vspd < 10) { vspd += grav; }
    if (airjump > 0 && jk)
    {
        vspd = -jspd;
        airjump -= 1;
    }
  }
}

// Movimentação Horizontal com Wall Jump
if (obj_Player.damage == false)
{
  if (rk && !sk)
  {
    hspd = spd;
    if (place_meeting(x-1, y, obj_Wall) && !place_meeting(x, y+1, obj_Wall) && !lk)
    {
      vspd = -jspd;
    }
  }
  if (lk && !sk)
  {
    hspd = -spd;
    if (place_meeting(x+1, y, obj_Wall) && !place_meeting(x, y+1, obj_Wall) && !rk)
    {
      vspd = -jspd;
    }
  }
}

if ((!rk && !lk) || (rk && lk)) { hspd = 0; }

// Colisões Pixel a Pixel
if (place_meeting(x+hspd, y, obj_Wall))
{
  while (!place_meeting(x+sign(hspd), y, obj_Wall)) { x += sign(hspd); }
  hspd = 0;
}
x += hspd;

if (place_meeting(x, y+vspd, obj_Wall))
{
  while (!place_meeting(x+sign(vspd), y, obj_Wall)) { y += sign(vspd); }
  vspd = 0;
}
y += vspd;
```
