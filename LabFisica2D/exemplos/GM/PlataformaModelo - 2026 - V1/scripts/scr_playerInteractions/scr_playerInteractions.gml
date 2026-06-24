function scr_playerInteractions()
{
//------------------------------------------CHECKPOINT----------------------------------------------    
    //Tempo de chechpoint
    if (checkpointLock > 0) 
    {
        checkpointLock--;
    }
    
    // CHECKPOINT - ATIVAÇÃO (mais robusto)
    if (checkpointLock <= 0)
    {
        var cp = instance_place(x, y, obj_checkpoint);
        if (cp != noone && cp != checkpointId)
        {
            checkpointX = cp.x + 16;
            checkpointY = cp.y;
            checkpointId = cp;
            
            checkpointLock = checkpointLockMax;
        }
    }
    
//------------------------------------------ESPINHOS----------------------------------------------    
    //Colisão com o espinho
    var hz = instance_place(x, y, obj_spike);
    if (hz != noone && invTime <= 0)
    {
    
        // Calculamos a direção baseada no centro dos dois
        // Centro do player (x) vs Centro do espinho (hz.x + 16)
        var _hzCenter = (hz.bbox_left + hz.bbox_right) * 0.5; // centro real em X
        var _hitDir = (x < _hzCenter) ? 1 : -1;
    
    
        scr_playerTakeDamage(_hitDir, 10);
    }
    
//------------------------------------------INIMIGO----------------------------------------------    
    var en = instance_place(x, y, obj_enemy);
    if (en != noone && invTime <= 0)
    {
        //Verificamos se o inimigo está a direita ou a esquerda do player
        var _hitDir = (x < en.x) ? 1 : -1; 
        scr_playerTakeDamage(_hitDir, 15);
    }
}