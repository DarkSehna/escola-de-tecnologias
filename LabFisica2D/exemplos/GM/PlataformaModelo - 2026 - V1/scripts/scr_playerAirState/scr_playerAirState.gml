function scr_playerAirState()
{
    // ============================================================
    // ESTADO: AR
    // ============================================================
    // Player está no ar:
    // - controle reduzido
    // - não pode pular novamente (por enquanto)

    // 1. Input
    //scr_playerInput();

    // 2. Movimento horizontal (controle no ar)
    scr_playerMove();

    // 3. Transição para o chão
    if (grounded)
    {
        state = PLAYER_STATE.GROUND;
        return;
    }
    
    // AIR DASH
    if (dashPressed && dashCooldown <= 0 && canAirDash && stamina >= stamina_cost_dash)
    {
        stamina -= stamina_cost_dash; // Gasta a stamina
        
        dashDir = (inputX != 0) ? sign(inputX) : sign(image_xscale);
        dashTime = dashTimeMax;
        dashCooldown = dashCooldownMax;
        state = PLAYER_STATE.DASH;
        canAirDash = false;
        return;
    }
    
    //DOUBLE JUMP
    // Só permite se tiver o "poder" (canDoubleJump) E se ainda houver pulos no contador
    if (jumpPressed && canDoubleJump && jumpCount > 0)
    {
        vsp = jspd;     // Aplica a força de pulo novamente
        jumpCount--;    // Gasta o pulo atual
        
        // DICA VISUAL: Você pode criar o efeito de rastro ou fumaça aqui também!
    }
    
    /*// DOUBLE JUMP (no ar)
    if (jumpPressed)
    {
        // Permite o segundo pulo somente se:
        // - ainda há pulos restantes
        // - e o double jump está liberado
        // Observação: se canDoubleJump for false, só permitirá 1 pulo total.
        
        var allow = (jumpCount > 0);
        
        // Se estiver no ar e o double jump não estiver liberado,
        // limitamos para apenas 1 pulo total (ou seja, não permite o segundo).
        if (!canDoubleJump && jumpCount < (maxJumps - 1))
            allow = false;
    
        if (allow)
        {
            vsp = jspd;
            jumpCount--;
            return;
        }
    }*/
}