function scr_playerAttackState()
{
    // trava movimento durante o ataque
    hsp = 0;

    // cria a hitbox só no primeiro frame do ataque
    if (attackTime == attackTimeMax)
    {
        var hit = instance_create_layer(x + (image_xscale * 32), y, "Instances", obj_playerAttackHitbox);
        hit.creator = id; // O player diz: "Eu criei isso!"
        hit.damage = attackDamage;
        hit.image_xscale = image_xscale;
    }

    attackTime--;

    if (attackTime <= 0)
    {
        isAttacking = false;
        state = grounded ? PLAYER_STATE.GROUND : PLAYER_STATE.AIR;
        return;
    }
}