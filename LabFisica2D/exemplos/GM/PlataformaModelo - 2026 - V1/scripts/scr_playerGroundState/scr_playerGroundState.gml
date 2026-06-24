function scr_playerGroundState()
{
    // ============================================================
    // ESTADO: CHÃO
    // ============================================================
    // Player está no chão:
    // - pode andar
    // - pode parar
    // - pode iniciar pulo
    // - pode atacar

    // Movimento horizontal (controle total)
    scr_playerMove();
    
    // Reset do Dash no ar ao tocar no chão
    canAirDash = true;
    // Reset de pulos ao tocar no chão
    jumpCount = maxJumps;

    // Pulo
    if (jumpPressed)
    {
        
        vsp = jspd; // Aplica a força de pulo.
        grounded = false; // Remove status de chão.
        jumpCount --;       // Gasta o primeiro pulo (2 -> 1)
        state = PLAYER_STATE.AIR; // O MAIS IMPORTANTE: Muda imediatamente para o estado AIR
        return;
    }

    // Transição para o ar (caiu de uma plataforma)
    if (!grounded && vsp >= 0)
    {
        state = PLAYER_STATE.AIR;
        return;
    }
    
    // GROUND DASH
    if (dashPressed && dashCooldown <= 0 && stamina >= stamina_cost_dash)
    {
        stamina -= stamina_cost_dash; // Gasta a stamina
        
        dashDir = (inputX != 0) ? sign(inputX) : sign(image_xscale);
        dashTime = dashTimeMax;
        dashCooldown = dashCooldownMax;
        state = PLAYER_STATE.DASH;
        return;
    }
    
    // ATAQUE
    if (attackPressed && inputX == 0)
    {
        attackTime = attackTimeMax;
        isAttacking = true;
        state = PLAYER_STATE.ATTACK;
        return;
    }
}