function scr_playerDeadState()
{
    //Tira resíduos de dano
    invTime = 0;
    hurtTime = 0;
    hsp = 0;
    vsp = 0;
    // 1. Visual de morte
    image_blend = c_black; // Fica escurinho
    image_alpha = lerp(image_alpha, 0, 0.05); // Vai sumindo aos poucos
    
    deadTime--;

    if (deadTime <= 0)
    {
        if (currentLives > 0)
        {
            currentLives -= 1; // Perde uma vida
            // 1. Teletransporta para a coordenada salva
            x = checkpointX;
            y = checkpointY;
        
            // 2. SEGURANÇA: Se a origem do checkpoint for (0,0), o player 
            // pode nascer um pouco "enterrado". Isso empurra ele para cima.
            while (place_meeting(x, y, colMask)) 
            {
                y -= 1; 
            }
    
            // reseta vida (decida o valor padrão)
            hp = hp_max;
            
            checkpointLock = checkpointLockMax;
    
            // reseta física/estados
            hsp = 0;
            vsp = 0;
    
            grounded = false;
            jumpCount = maxJumps;      // se estiver usando contador
            canAirDash = true;         // se quiser resetar junto
            dashCooldown = 0;
            dashTime = 0;
    
            // reseta stamina (opcional)
            stamina = stamina_max;
    
            // volta para um estado padrão
            state = PLAYER_STATE.AIR; // cai até encostar no chão
            image_alpha = 1;
            image_blend = c_white;
        }
        else 
        {
        	room_restart();
            exit;
        }
    }
        
}