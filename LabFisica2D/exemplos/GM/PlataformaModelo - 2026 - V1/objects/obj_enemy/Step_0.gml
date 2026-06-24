// Inherit the parent event
event_inherited();
// A física já está rodando via herança (event_inherited)

scr_enemyStates();

//Verificação adicional do estado de morte
if (state == ENEMY_STATE.DEAD) exit;

//Interações do Inimigo
scr_enemyInteractions();