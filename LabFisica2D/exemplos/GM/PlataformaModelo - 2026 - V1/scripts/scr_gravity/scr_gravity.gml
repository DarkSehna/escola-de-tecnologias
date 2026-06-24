function scr_gravity()
{
	// Aumenta a velocidade vertical (vsp) com a aceleração da gravidade (grv)
vsp += grv;

	// Opcional: Limite de velocidade vertical (para evitar queda infinita ou muito rápida)
	// A constante "10" é um valor de exemplo para a Velocidade Terminal.
	vsp = min(vsp, maxFallSpeed);
}