function scr_playerFreeState()
{
    // ============================================================
    // ESTADO FREE (NORMAL) DO PLAYER
    // ============================================================
    // Neste estado o player pode:
    // - Andar
    // - Parar
    // - Pular
    // - Cair
    // A física (gravidade + colisão) é tratada pelo obj_lifeForm
    
    // =================================================================
    // 1. INPUT
    // =================================================================
    // Chamamos o script de Input novamente no estado Free.
    // Embora o input possa ser chamado no Step do Player, chamá-lo aqui
    // garante que as variáveis estejam atualizadas para a lógica deste estado.
    // (Depende da arquitetura. Aqui, o input é global, mas mantemos o call)
    scr_playerInput();
    
    // =================================================================
    // 2. MOVIMENTO
    // =================================================================
    // Delega o cálculo do vetor horizontal ao script dedicado.
    scr_playerMove();
    
    // =================================================================
    // 3. PULO
    // =================================================================
    // O pulo só acontece se:
    // - o jogador apertou o botão de pulo (jumpPressed)
    // - o player está no chão (grounded)
    // grounded é o status físico (definido em scr_collisionY).
    if (jumpPressed && grounded)
    {
        vsp = jspd;         // Aplica a força de pulo (jspd é negativo para ir para cima).
        grounded = false;   // Remove o status de chão imediatamente.
    }
    
    
    // ------------------------------------------------------------
    // 4. TRANSIÇÕES DE ESTADO (futuro)
    // ------------------------------------------------------------
    // Exemplo:
    // if (attackPressed) state = PLAYER_STATE.ATTACK;
}