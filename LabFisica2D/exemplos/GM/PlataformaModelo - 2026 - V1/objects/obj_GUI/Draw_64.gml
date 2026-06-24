var p = instance_find(obj_player, 0);

if (p != noone)
{
    scr_drawHUD(p);

    if (p.debugMode)
    {
        scr_drawDebug(p);
        draw_text(32, 160, "DEBUG: ON (F1 para alternar)");
    }
    else 
    {
        draw_text(32, 160, "DEBUG: OFF (F1 para alternar)");
    }
}