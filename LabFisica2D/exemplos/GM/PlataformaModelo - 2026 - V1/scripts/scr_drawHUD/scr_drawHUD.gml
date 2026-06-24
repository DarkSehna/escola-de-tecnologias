function scr_drawHUD(_player)
{
    
    // ============================================================
    // POSIÇÕES BASE
    // ============================================================
    var hudX = 32; // Recuado um pouco para dar espaço ao ícone
    var hudY = 32;
      
    // ============================================================
    // CONFIGURAÇÃO GERAL
    // ============================================================
    //Icone de LIFES
    var lifeIconX = hudX;
    var lifeIconY = hudY + 29;

    //Barr Position
    var barX = hudX + 32;
    var hpBarY = hudY;
    var staminaBarY = hudY + 38;

    //HP Bar
    var hpBarWidth = 200; // Largura total em pixels
    var hpBarHeight = 32; // Altura

    //Stamina Bar
    var staminaBarWidth = 180; // Largura total em pixels
    var staminaBarHeight = 16; // Altura

    // ============================================================
    // CÁLCULOS DE PORCENTAGEM
    // ============================================================
    var hpPercent = _player.hp / _player.hp_max;
    hpPercent = clamp(hpPercent, 0, 1);

    var staminaPercent = _player.stamina / _player.stamina_max;
    staminaPercent = clamp(staminaPercent, 0, 1);
    
    // ============================================================
    // HP
    // ============================================================
    
    // Fundo
    draw_sprite_stretched(spr_hpBarBack, 0, barX, hpBarY, hpBarWidth, hpBarHeight);
    // Preenchimento
    draw_sprite_stretched(spr_hpBarFill, 0, barX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

    // Texto da Vida (Centralizado na barra)
    draw_set_font(fnt_HUD); 
    draw_set_halign(fa_center);
    draw_set_valign(fa_middle);
    draw_set_color(c_white);
    draw_text( barX + hpBarWidth * 0.5, hpBarY + hpBarHeight * 0.5, string(floor(_player.hp)) + " / " + string(_player.hp_max) );
    
    // ============================================================
    // STAMINA
    // ============================================================
    draw_sprite_stretched(spr_staminaBarBack, 0, barX, staminaBarY, staminaBarWidth, staminaBarHeight);
    draw_sprite_stretched(spr_staminaBarFill, 0, barX, staminaBarY, staminaBarWidth * staminaPercent, staminaBarHeight);

    //draw_text( barX + staminaBarWidth * 0.5, staminaBarY + staminaBarHeight * 0.5, string(floor(_player.stamina)) + " / " + string(_player.stamina_max) );
    
    
    // ============================================================
    // LIVES
    // ============================================================
    draw_sprite(spr_lifeIcon, 0, lifeIconX, lifeIconY);

    draw_set_halign(fa_center);
    draw_set_valign(fa_middle);
    draw_set_color(c_black);
    draw_set_font(fnt_HUD);

    draw_text(lifeIconX, lifeIconY, string(_player.currentLives));
    
    // --- IMPORTANTE: RESETAR O ALINHAMENTO ---
    // Se não resetar, o Debug e outros textos do jogo vão ficar centralizados e bagunçados!
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_color(c_white);
}