function scr_playerInput()
{
    // =================================================================
    // 1. CAPTURA DE ENTRADAS DE TECLADO
    // =================================================================
    // Teclas Contínuas (Andar/Mover)
    leftKey  = keyboard_check(vk_left)  || keyboard_check(ord("A"));
    rightKey = keyboard_check(vk_right) || keyboard_check(ord("D"));

    jumpHeld     = keyboard_check(vk_up) || keyboard_check(vk_space) || keyboard_check(ord("W")) || keyboard_check(ord("Z"));
    // Teclas de Ação (Apenas no frame em que são pressionadas)
    // Usar _pressed é crucial para ações instantâneas.
    jumpPressed  = keyboard_check_pressed(vk_up) || keyboard_check_pressed(vk_space) || keyboard_check_pressed(ord("W")) || keyboard_check_pressed(ord("Z"));

    dashPressed  = keyboard_check_pressed(ord("C")) || keyboard_check_pressed(ord("E"));
    attackPressed = mouse_check_button_pressed(mb_left) || keyboard_check_pressed(ord("X"));

    // =================================================================
    // 2. CÁLCULO DE DIREÇÃO BASE (TECLADO)
    // =================================================================
    
    // Define a direção base (1, -1 ou 0)
    inputX = rightKey - leftKey;

    // =========================
    // GAMEPAD (opcional)
    // =========================
    if (gamepad_is_connected(0))
    {
        var padX = gamepad_axis_value(0, gp_axislh);

        // Deadzone manual 
        if (abs(padX) > 0.35)
            inputX = padX;
        //Poderia ser
        //gamepad_set_axis_deadzone(0, 0.35); // 0.35 é um bom valor
        
        // Ações de toque do Gamepad (Combinamos com o teclado ou sobrescrevemos, dependendo da necessidade)
        // Aqui, vamos usar OR Binário (|=) para que o Gamepad OU o Teclado ativem a ação.
        jumpPressed   |= gamepad_button_check_pressed(0, gp_face1);
        dashPressed   |= gamepad_button_check_pressed(0, gp_face2);
        attackPressed |= gamepad_button_check_pressed(0, gp_face3);
    }
    
    /*
     * Held → ação contínua (andar, segurar pulo) 
     * Pressed → ação pontual (pulo, ataque, dash) 
     * inputX → direção desejada, não movimento 
     * teclado e controle alimentam as mesmas variáveis
    */
}
