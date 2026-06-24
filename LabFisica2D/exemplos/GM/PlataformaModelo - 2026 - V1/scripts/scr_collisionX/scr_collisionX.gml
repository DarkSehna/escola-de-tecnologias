function scr_collisionX()
{
	// Checa se VAI colidir na próxima posição horizontal (x + hsp)
	if (place_meeting(x + hsp, y, colMask)) {
    
	    // Se for colidir, move pixel a pixel até a borda
	    while (!place_meeting(x + sign(hsp), y, colMask)) {
	        x += sign(hsp);
	    }
    
	    // Zera a velocidade horizontal ao colidir
	    hsp = 0;
	}

	// Aplica o movimento horizontal restante
	x += hsp;
}