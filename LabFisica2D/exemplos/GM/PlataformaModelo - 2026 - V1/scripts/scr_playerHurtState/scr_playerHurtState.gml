function scr_playerHurtState()
{
    // 1. Aplicar o Knockback (Velocidade fixa de empurrão)
    // Usamos hitDir para saber para qual lado seremos jogados
    hsp = -hitDir * knockbackHsp;
    hsp = lerp(hsp, 0, 0.7);
    
    // 2. Visual: Piscar ou mudar cor (Opcional)
    //image_blend = c_red;
    
    // 3. Contagem regressiva do tempo de "atordoamento"
    hurtTime--;
    
    // 4. Condição de Saída
    if (hurtTime <= 0)
    {
        //image_blend = c_white;

        state = grounded ? PLAYER_STATE.GROUND : PLAYER_STATE.AIR;
        return;
    }
}