/// obj_lifeForm - Step

// 1. Aplica a Gravidade
// (Modifica a variável vsp)
scr_gravity();

// 2. Colisão Horizontal (Resolução de X)
// Primeiro, resolvemos o movimento e colisões horizontais.
scr_collisionX();

// 3. Colisão Vertical (Resolução de Y)
// Por último, resolvemos o movimento vertical e atualizamos o status 'grounded'.
scr_collisionY();

/*
    o eixo Y é “passivo” (gravidade manda),
    
    o eixo X é “ativo” (jogador controla),
    
    estar no chão (ou não) influencia o input (andar, pular, wall jump etc).
    
    Por isso, a ordem Y depois X costuma ser mais estável e intuitiva
*/