function scr_playerDebug()
{
    // (1) Alternar debugMode durante o jogo (opcional)
    if (keyboard_check_pressed(vk_f1))
    {
        debugMode = !debugMode;
    }
    
    if (!debugMode) return; // Portão de segurança
        
    // (2) Zera vida rápido 
    if (keyboard_check_pressed(ord("K")))
    {
        hp = 0;
    }

    // (3)Tira um pouco de vida
    if (keyboard_check_pressed(ord("L"))) 
    {
        hp -= 10;
    }
    
    // (4) Cura total
    if (keyboard_check_pressed(ord("J")))
    {
        hp = hp_max;
    }

    // (5) Recarrega stamina (se quiser)
    if (keyboard_check_pressed(ord("U")))
    {
        stamina = stamina_max;
    }

    // (6) Teleport para start (opcional)
    if (keyboard_check_pressed(ord("T")))
    {
        x = startX;
        y = startY;
        hsp = 0;
        vsp = 0;
        state = PLAYER_STATE.AIR;
    }
    
    // (7) Forçar dano completo (passa pelo TakeDamage)
    if (keyboard_check_pressed(ord("H")))
    {
        // dano veio da frente (lado que o player está olhando)
        scr_playerTakeDamage(image_xscale, 10);
    }
    
    // (8) Teleport para o checkpoint
    if (keyboard_check_pressed(ord("Y")))
    {
        x = checkpointX;
        y = checkpointY;
        hsp = 0;
        vsp = 0;
        state = PLAYER_STATE.AIR;
    }
    
    // (9) +1 vida
    if (keyboard_check_pressed(ord("I")))
    {
        currentLives = min(currentLives + 1, livesMax);
    }
    
    // (10) -1 vida
    if (keyboard_check_pressed(ord("O")))
    {
         currentLives = max(currentLives - 1, 0);
    }
    
    // (11) RESET
    if (keyboard_check_pressed(vk_f5))
    {
         room_restart();
    }
}

/*
 * K = kill (matar)
 * L = Low HP(perde vida)
 * J = “heal” (cura) 
 * U = “refill” (stamina) 
 * T = teleport 
 * H = Hurt
 * Y = checkpoint
 * F1 = toggle debug
 * F5 = Restart
*/