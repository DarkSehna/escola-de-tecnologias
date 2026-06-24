function scr_playerDashState()
{
    // ============================================================
    // ESTADO: DASH
    // ============================================================
    // Durante o dash:
    // - o player se move com velocidade fixa
    // - input normal é ignorado
    // - gravidade continua atuando (por enquanto)
    
    if (!grounded) vsp = 0;

    // 1. Movimento forçado
    hsp = dashDir * dashSpeed;
    
    // 2. Contador de tempo
    dashTime--;

    // Create dash effect
	var dash = instance_create_layer(x, y,"Instances" ,obj_dashEffect);
	dash.sprite_index = sprite_index;
	dash.image_index = image_index;
    dash.image_xscale = image_xscale;
    
    // 3. Fim do dash
    if (dashTime <= 0)
    {
        // Retorna para o estado correto
        if (grounded)
            state = PLAYER_STATE.GROUND;
        else
            state = PLAYER_STATE.AIR;

        return;
    }
}