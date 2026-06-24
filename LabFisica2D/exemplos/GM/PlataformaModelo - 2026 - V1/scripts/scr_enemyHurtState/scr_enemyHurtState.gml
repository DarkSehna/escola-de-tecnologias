function scr_enemyHurtState()
{

    hsp = -hitDir * knockbackHsp;
    hsp = lerp(hsp, 0, 0.7);
    
    // 3. Contagem regressiva do tempo de "atordoamento"
    hurtTime--;
    
    // 4. Condição de Saída
    if (hurtTime <= 0)
    {
        //image_blend = c_white;
        hsp = 0;
        state = choose(ENEMY_STATE.PATROL,ENEMY_STATE.IDLE);
        return;
    }
}