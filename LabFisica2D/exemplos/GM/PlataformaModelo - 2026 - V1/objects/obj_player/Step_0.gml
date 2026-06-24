event_inherited();
// 1. Processar a entrada (preenche inputX, jumpPressed, etc.)
// Chamamos o input aqui para que TODOS os estados tenham acesso às variáveis de input.
scr_playerInput(); 

//Debug Mode
scr_playerDebug();

// 2. Aplicar a lógica do estado atual (O Switch Manager)
// Este script verifica 'state' e chama o scr_playerFreeState() que acabamos de criar.
scr_playerStates(); 

// Nota: O obj_lifeForm (Pai) gerencia scr_gravity, scr_collisionX, scr_collisionY.
// Ele garante que a física seja aplicada ao final do loop, após o player decidir o que fazer.

//Verificação adicional do estado de morte
if (state == PLAYER_STATE.DEAD) exit;

// Atualiza cooldown do dash
if (dashCooldown > 0)
{
    dashCooldown--;
}

// Regenera stamina
if (stamina < stamina_max)
{
    stamina = min(stamina + stamina_regen, stamina_max);
}

// Processa Invencibilidade
if (invTime > 0)
{
    invTime--;
    image_alpha = (invTime mod 2 == 0) ? 0.05 : 1.0; // pisca mais rápido
}
else
{
    image_alpha = 1.0;
}

//Interações do Player
scr_playerInteractions();