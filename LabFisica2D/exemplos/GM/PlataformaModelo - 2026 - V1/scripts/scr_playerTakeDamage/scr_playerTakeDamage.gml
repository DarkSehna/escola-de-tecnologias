function scr_playerTakeDamage(_hitDir, _dmg)
{
    // não toma dano se estiver invencível
    if (invTime > 0) return;

    // aplica dano
    hp -= _dmg;

    //Morte do Player
    if (hp <= 0 && state != PLAYER_STATE.DEAD)
    {
        state = PLAYER_STATE.DEAD;
        deadTime = deadTimeMax;

        image_alpha = 1;
        image_blend = c_white;
        exit;
    }
    else 
    {
        // define direção do hit (de onde veio)
        hitDir = _hitDir;
        // inicia timers
        hurtTime = hurtTimeMax;
        invTime  = invTimeMax;
        // impulso vertical do knockback
        vsp = -knockbackVsp;
        // entra no estado hurt
        state = PLAYER_STATE.HURT;
    }
}