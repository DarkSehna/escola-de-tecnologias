function scr_playerMove()
{
    // ============================================================
    // MOVIMENTO HORIZONTAL BÁSICO DO PLAYER
    // ============================================================
    // Este script converte a intenção do jogador (inputX)
    // em velocidade horizontal (hsp).
    // Não aplica colisão nem gravidade.
    
    var accel = 0;
    var fric = 0;
    
    // ------------------------------------------------------------
    // Define controle baseado no chão ou no ar
    // ------------------------------------------------------------
    if (grounded)
    {
        accel    = accelGround;
        fric = frictionGround;
    }
    else
    {
        accel    = accelAir;
        fric = frictionAir;
    }
    
    
    // ------------------------------------------------------------
    // Aceleração (quando há input) 
    // ------------------------------------------------------------
    if (inputX != 0)
    {
        hsp += inputX * accel;
        // sign(hsp) retorna 1 se hsp for positivo e -1 se for negativo
        image_xscale = sign(inputX);
    }
    else
    {
        // --------------------------------------------------------
        // Fricção (quando não há input)
        // --------------------------------------------------------
        if (abs(hsp) < fric)
            hsp = 0;
        else
            hsp -= sign(hsp) * fric;
    }

    // ------------------------------------------------------------
    // Limite de velocidade
    // ------------------------------------------------------------
    hsp = clamp(hsp, -moveSpeed, moveSpeed);

    // Futuramente, esta seção pode incluir:
    // - Lógica de Aceleração/Desaceleração (friction)
    // - Modificadores de velocidade (Ex: escorregar no gelo, andar agachado)
}