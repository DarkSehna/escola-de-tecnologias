var _target = instance_place(x, y, obj_lifeForm);

if (_target != noone && _target != creator)
{
    // Se o alvo for diferente do criador, ele vai ter o scr_enemyTakeDamage
    with(_target) 
    {
        var _dir = (other.x < x) ? -1 : 1;
        scr_enemyTakeDamage(_dir, 20);
    }
    instance_destroy(); // Destrói a hitbox após o acerto (opcional)
}
 attackTime--;

if (attackTime <= 0)
{
    instance_destroy();
}