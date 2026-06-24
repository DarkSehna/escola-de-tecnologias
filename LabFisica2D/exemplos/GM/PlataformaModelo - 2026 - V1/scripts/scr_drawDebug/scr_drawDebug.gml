function scr_drawDebug(_player)
{
    var debugX = 640;
    var debugY = 32;

    draw_text(debugX, debugY, "hurtTime: " + string(floor(_player.hurtTime)) + "/" + string(_player.hurtTimeMax));
    draw_text(debugX, debugY + 32, "invTime: " + string(floor(_player.invTime)) + "/" + string(_player.invTimeMax));
    draw_text(debugX, debugY + 64, "deadTime: " + string(floor(_player.deadTime)) + "/" + string(_player.deadTimeMax));
    draw_text(debugX, debugY + 96, "CP: " + string(_player.checkpointX) + ", " + string(_player.checkpointY));

    draw_text(debugX-192, 32, "state: " + scr_playerStateName(_player.state));
    
    draw_text(debugX*1.5, debugY, " * K = kill (matar) \n * L = Low HP(perde vida) \n * J = HEAL (cura) \n * U = Rcuperar stamina \n * T = teleport \n * H = Hurt \n * Y = checkpoint \n * F1 = toggle debug \n * F5 = Restart");

}