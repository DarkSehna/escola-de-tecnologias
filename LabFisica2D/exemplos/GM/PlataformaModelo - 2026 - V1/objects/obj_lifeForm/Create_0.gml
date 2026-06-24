// =================================================================
// 1. VARIÁVEIS DE MOVIMENTO
// =================================================================
// Velocidades atuais. Usadas no script de colisão.
hsp = 0;        // Velocidade Horizontal Atual (Horizontal Speed)
vsp = 0;        // Velocidade Vertical Atual (Vertical Speed)

// Forças Físicas
grv = 0.3;      // Força da Gravidade (aplicada por frame)
jspd = -7;      // Força do Pulo (negativo para subir)
maxFallSpeed = 12;

// estado de chão
grounded = false;

// colisores (por enquanto só obj_wall)
colMask = obj_wall;

// =================================================================
// 2. VARIÁVEIS DE STATUS BÁSICO
// =================================================================
hp_max = 100; //Vida máxima do player
hp = hp_max; // Vida atual (Health Points)
is_dead = false;// Status de vida/morte

/*Explicação pedagógica

Essas variáveis são universais para qualquer criatura (player, inimigo, NPC).

Na herança, objetos filhos podem mudar valores sem alterar o sistema.
*/