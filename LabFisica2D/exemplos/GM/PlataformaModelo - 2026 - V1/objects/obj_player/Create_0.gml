// 1. HERANÇA: Importante! Garante que as variáveis do obj_lifeForm (Pai) sejam carregadas primeiro.
event_inherited(); 



// Inicializa o estado.
state = PLAYER_STATE.GROUND; 

// ================================================================================================================
//                                              VARIÁVEIS ESPECÍFICAS DO PLAYER
// ================================================================================================================
// ============================================================
// MOVIMENTO - PARÂMETROS
// ============================================================
moveSpeed = 4; // Velocidade máxima horizontal

accelGround = 0.35; // Aceleração no chão
frictionGround = 0.15; // Desaceleração (fricção) no chão

accelAir = 0.2; // Aceleração no ar (menor controle)
frictionAir = 0.05; // Fricção no ar (quase nenhuma)


// ============================================================
// DASH
// ============================================================

// Força do dash
dashSpeed = 10; // Velocidade horizontal extrema durante o dash

// Duração do dash (frames)
dashTimeMax = 15; 
dashTime = 0; // Contador de frames restantes do dash

// Cooldown do dash
dashCooldownMax = 30;
dashCooldown = 0;

// Direção do dash
dashDir = 0;

//Air Dash
canAirDash = true;

// =================================================================
// VARIÁVEIS DE RECURSO (STAMINA)
// =================================================================
stamina_max = 100;
stamina = stamina_max;
stamina_cost_dash = 20; // Custo de stamina por dash
stamina_regen = 0.5;

// =================================================================
// DOUBLE JUMP
// =================================================================
canDoubleJump = true;
maxJumps = 2;
jumpCount = maxJumps;


// =================================================================
// HURT
// =================================================================
//Invencibilidade
invTime = 0; 
invTimeMax = 60;

//tempo de dano
hurtTime = 0; 
hurtTimeMax = 60;

//knockback
knockbackHsp = 2; 
knockbackVsp = 2;

//diração do dano
hitDir = image_xscale;

// ============================================================
// DEAD / RESPAWN
// ============================================================
startX = x;
startY = y;

deadTimeMax = 60; // 1 segundo em 60fps
deadTime = 0;


// ============================================================
// CHECKPOINT
// ============================================================
checkpointX = startX;
checkpointY = startY;
checkpointId = noone; // opcional: guardar qual bandeira foi ativada

// trava para não reativar checkpoint no mesmo frame (opcional, mas recomendo)
checkpointLock = 0;
checkpointLockMax = 10;


// ============================================================
// LIFES (VIDAS)
// ============================================================
livesMax = 3;
currentLives = livesMax;

// ============================================================
// ATAQUE
// ============================================================
attackTime = 0;
attackTimeMax = 20;
isAttacking = false;
attackDamage = 50;

// ============================================================
// DEBUG MODE
// ============================================================
debugMode = true; // deixe true enquanto desenvolve;