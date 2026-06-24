function scr_playerStateName(_s)
{
    switch (_s)
    {
        case PLAYER_STATE.GROUND: return "GROUND";
        case PLAYER_STATE.AIR:    return "AIR";
        case PLAYER_STATE.DASH:   return "DASH";
        case PLAYER_STATE.HURT:   return "HURT";
        case PLAYER_STATE.ATTACK: return "ATTACK";
        case PLAYER_STATE.DEAD:   return "DEAD";
    }
    return "UNKNOWN";
}