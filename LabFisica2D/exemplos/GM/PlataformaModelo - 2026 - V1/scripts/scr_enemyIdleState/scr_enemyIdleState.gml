function scr_enemyIdleState()
{
    idleTime--;
    if (idleTime <= 0) {
        state = ENEMY_STATE.PATROL;
        hsp = (image_xscale == 1) ? walkSpeed : -walkSpeed; // Volta a andar na direção que estava
    }
}