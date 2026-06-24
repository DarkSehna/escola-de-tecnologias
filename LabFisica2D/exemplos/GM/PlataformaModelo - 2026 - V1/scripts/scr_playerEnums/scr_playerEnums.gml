/// ------------------------------------------------------------------
/// Enums relacionados ao Player
/// Servem para definir os estados da máquina de estados
/// ------------------------------------------------------------------
// Usamos ENUMs para dar nomes legíveis aos estados, mas o GMS2 armazena como número inteiro.
    enum PLAYER_STATE 
{
    GROUND,    // NOVO: Ações exclusivas do chão (Andar, Fricção de chão, Pular)
	AIR,       // NOVO: Ações exclusivas do ar (Cair, Pulo Duplo, Air Dash)
    DASH,       // Estado de dash
    HURT,       // Estado de dano/invencibilidade
    DEAD,        // Estado de morte
    ATTACK     // Estado de ataque
}
    
/*
* enum não usa ponto e vírgula no final 
* os valores são separados por vírgula 
* internamente o GameMaker transforma isso em números (0, 1, 2…) 
* você nunca precisa usar esses números diretamente
* 
* Depois que o script existe: 
*  o enum fica disponível globalmente 
*  qualquer objeto ou script pode usar:
* 
* Não precisa: 
*  chamar o script 
*  executar função 
*  fazer include
*/