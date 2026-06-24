function scr_collisionY()
{
    // Resetamos o status de chão (grounded) a cada frame
    // Se colidirmos no bloco abaixo, ele será redefinido como true.
    grounded = false; 
    
    // Checa se VAI colidir na próxima posição vertical (y + vsp)
    if (place_meeting(x, y + vsp, colMask)) {
        
        // Se estiver caindo (vsp > 0) e colidir, definimos o status de "no chão"
        if (vsp > 0) {
            grounded = true;
        }
        
        // Move pixel a pixel até a borda
        while (!place_meeting(x, y + sign(vsp), colMask)) {
            y += sign(vsp);
        }
        
        // Zera a velocidade vertical ao colidir (chão ou teto)
        vsp = 0;
    } 
    
    // Aplica o movimento vertical restante
    y += vsp;
}