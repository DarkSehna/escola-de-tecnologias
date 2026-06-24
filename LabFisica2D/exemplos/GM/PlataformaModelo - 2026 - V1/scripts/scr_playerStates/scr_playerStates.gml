function scr_playerStates()
{
    /*
     * Em engines reais:
     * estado = “em que situação o personagem está”
     * movimento = “o que ele consegue fazer dentro desse estado”
    */
    
     switch (state)
    {
        case PLAYER_STATE.GROUND:
            scr_playerGroundState();
            break;
        
        case PLAYER_STATE.AIR:
            scr_playerAirState();
            break;

        case PLAYER_STATE.ATTACK:
            scr_playerAttackState();
            break;

        case PLAYER_STATE.HURT:
            scr_playerHurtState();
            break;

        case PLAYER_STATE.DASH:
            scr_playerDashState();
            break;

        case PLAYER_STATE.DEAD:
            scr_playerDeadState();
            break;
    }
}