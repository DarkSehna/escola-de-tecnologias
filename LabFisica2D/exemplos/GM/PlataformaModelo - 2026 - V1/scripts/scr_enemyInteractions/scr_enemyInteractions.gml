function scr_enemyInteractions()
{
    //Comando de teste ao tocar no Player
    var en = instance_place(x, y, obj_player);
    if (en != noone)
    {
        //Verificamos se o inimigo está a direita ou a esquerda do player
        var _hitDir = (x < en.x) ? 1 : -1; 
        scr_enemyTakeDamage(_hitDir, 50);
    }
}