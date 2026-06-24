function scr_enemyPatrolState()
{
    // 2. DETECÇÃO DE PAREDE OU ABISMO
    // Verificamos se há parede na frente OU se NÃO há chão um pouco à frente e abaixo
    var _wallAhead = place_meeting(x + hsp, y, colMask);
    var _floorAhead = place_meeting(x + (sign(hsp) * 16), y + 1, colMask); // Ajuste o 16 se necessário
    
    if (_wallAhead || !_floorAhead) 
    {
        hsp *= -1;
        image_xscale = sign(hsp); // Garante que o sprite acompanhe a direção
    }
    
    // Chance aleatória de parar (ex: 1 em 200 frames)
    if (irandom(200) == 0) {
        state = ENEMY_STATE.IDLE;
        idleTime = 60; // Fica parado por 1 segundo
        hsp = 0;
    }
}