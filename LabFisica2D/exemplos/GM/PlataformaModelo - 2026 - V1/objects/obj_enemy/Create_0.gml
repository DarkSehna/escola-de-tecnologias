// 1. HERANÇA: Importante! Garante que as variáveis do obj_lifeForm (Pai) sejam carregadas primeiro.
event_inherited();

// Inicializa o estado.
state = ENEMY_STATE.PATROL;

// ================================================================================================================
//                                              VARIÁVEIS ESPECÍFICAS DO INIMIGO
// ================================================================================================================
// ============================================================
// MOVIMENTO - PARÂMETROS
// ============================================================
walkSpeed = 3;
hsp = walkSpeed;
idleTime = 0;

// =================================================================
// HURT
// =================================================================
//tempo de dano
hurtTime = 0; 
hurtTimeMax = 60;

//knockback
knockbackHsp = 2; 
knockbackVsp = 2;

//diração do dano
hitDir = image_xscale;