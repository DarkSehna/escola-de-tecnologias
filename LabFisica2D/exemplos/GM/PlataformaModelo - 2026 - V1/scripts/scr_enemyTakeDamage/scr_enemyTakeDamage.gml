function scr_enemyTakeDamage(_hitDir, _dmg)
{
    // não toma dano se estiver invencível
    if (hurtTime > 0) return;
    // aplica dano
    hp -= _dmg;

    //Morte do Inimigo
    if (hp <= 0 && state != ENEMY_STATE.DEAD)
    {
        state = ENEMY_STATE.DEAD;

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
        // impulso vertical do knockback
        vsp = -knockbackVsp;
        // entra no estado hurt
        state = ENEMY_STATE.HURT;
    }
}