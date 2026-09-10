# Projeto: Modelo Construct 3 - Plataforma Básico (Arquivo 1)

## Sistema 1: Armadilhas e Progressão

Este bloco controla o reinício da fase e a transição entre layouts.

* **Evento:** `personagem` colide com `Espinhos`.

  * **Ação:** Sistema reinicia o layout.

* **Evento:** `personagem` colide com `Portal`.

  * **Ação:** Sistema vai para o layout correspondente à variável `Portal.ProximaFase`.

## Sistema 2: Inteligência Artificial (Patrulha de Inimigo)

Este bloco controla a movimentação autônoma de um inimigo de um lado para o outro usando a variável de instância "Dist".

* **Evento:** Sistema - Ao iniciar layout.

  * **Ação:** Define a variável `Dist` do Inimigo escolhendo aleatoriamente entre "Direita" e "Esquerda".

* **Evento:** `Inimigo` compara se `Dist` = "Direita".

  * **Ação:** Inimigo simula o comportamento Platform pressionando para a "Direita".

* **Evento:** `Inimigo` compara se `Dist` = "Esquerda".

  * **Ação:** Inimigo simula o comportamento Platform pressionando para a "Esquerda".

### Controle de Colisão e Retorno do Inimigo

* **Evento:** `Inimigo` colide com `ColisorInimigo` (Parede invisível).

  * **Sub-evento:** Se `Dist` = "Direita".

    * **Ação:** Define `Dist` para "Esquerda".

  * **Sub-evento:** Senão.

    * **Ação:** Define `Dist` para "Esquerda" *(Nota de Debugging: O comportamento esperado no 'Senão' seria mudar para "Direita", para criar o vai-e-vem correto).*

## Sistema 3: Combate (Personagem vs Inimigo)

Lógica clássica de pulo na cabeça (estilo Mario).

* **Evento:** `personagem` colide com `Inimigo`.

  * **Sub-evento (Ataque bem-sucedido):** Se `personagem.Y` for menor que `Inimigo.Y` (está acima) E `personagem` está caindo.

    * **Ação:** Define o vetor Y do Comportamento Plataforma para -500 (efeito de quicar).

    * **Ação:** Destrói o `Inimigo`.

  * **Sub-evento (Dano sofrido):** Senão.

    * **Ação:** Sistema reinicia o layout (Personagem morre ao encostar de lado).

# Projeto: Modelo Construct 3 - Mecânicas de Ambiente (Arquivo 2)

## Sistema 1: Física de Água (Natação)

Este bloco altera as propriedades do comportamento "Plataforma" do jogador para simular a densidade e a flutuabilidade da água, e restaura a gravidade normal quando ele sai da água.

* **Evento:** `player` está sobrepondo `water` (Água).

  * **Ação:** Define a gravidade do Comportamento Plataforma para 200 (reduz o peso/flutuação).

  * **Ação:** Define a aceleração do Comportamento Plataforma para 100 (movimento mais pesado).

  * **Ação:** Define a velocidade máxima do Comportamento Plataforma para 500 (limita a velocidade dentro da água).

* **Evento:** `player` NÃO está sobrepondo `water` (Condição Invertida).

  * **Ação:** Define a gravidade do Comportamento Plataforma para 1500 (restaura a gravidade padrão do jogo).

* **Evento:** `player` NÃO está sobrepondo `water` E `player` está no chão.

  * **Ação:** Define a aceleração do Comportamento Plataforma para 1500 (restaura a aceleração normal em terra).

  * **Ação:** Define a velocidade máxima do Comportamento Plataforma para 1000 (restaura a velocidade de corrida normal).

# Projeto: Modelo Construct 3 - Animação e Interação do Jogador (Arquivo 3)

## Sistema 1: Máquina de Estados Visual (Animações de Movimento)

Este bloco controla a transição entre a animação de correr ("Move") e ficar parado ("Idle"). Ele usa lógica de teclado, incluindo um tratamento de exceção para quando o jogador aperta as duas direções simultaneamente.

* **Evento:** `Teclado` - Seta para Direita (→) está pressionada.

  * **OU (Bloco OR):** `Teclado` - Seta para Esquerda (←) está pressionada.

  * **Ação:** Define a animação do `Player` para "Move" (executar do início).

* **Evento:** `Teclado` - Seta para Direita (→) NÃO está pressionada (Condição Invertida).

  * **E Evento:** `Teclado` - Seta para Esquerda (←) NÃO está pressionada (Condição Invertida).

  * **Ação:** Define a animação do `Player` para "Idle" (executar do início).

* **Evento:** `Teclado` - Seta para Direita (→) está pressionada.

  * **E Evento:** `Teclado` - Seta para Esquerda (←) está pressionada.

  * **Ação:** Define a animação do `Player` para "Idle" (executar do início).

## Sistema 2: Espelhamento de Sprite (Facing)

Garante que o personagem olhe para o lado correto em que está caminhando.

* **Evento:** `Teclado` - Ao pressionar Seta para Direita (→).

  * **Ação:** Define `Player` como Não espelhado.

* **Evento:** `Teclado` - Ao pressionar Seta para Esquerda (←).

  * **Ação:** Define `Player` como Espelhado.

## Sistema 3: Interação com Objetos do Cenário (Trampolim e Perigo)

* **Evento:** `Player` colide com `trampolim`.

  * **Ação:** Define o vetor Y do Comportamento Plataforma do jogador para `-trampolim.pulo` (Usa o valor armazenado na variável de instância 'pulo' do próprio objeto trampolim para calcular a força do salto).

* **Evento:** `Player` colide com `Lava`.

  * **Ação:** Sistema reinicia o layout.

# Projeto: Modelo Construct 3 - Linhas do Tempo e Interface (Arquivo 4)

## Sistema 1: Inicialização e Controle de Animação

Este bloco gerencia a limpeza da tela ao iniciar o layout e dispara uma animação usando o recurso de Linha do Tempo (Timeline). Ao finalizar a animação, ele recria o elemento de texto.

* **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Destrói o objeto `Texto`.

  * **Ação:** Executa a `LinhaDoTempo` "Square" com a etiqueta "S".

* **Evento:** `LinhaDoTempo` - Ao terminar a etiqueta "S".

  * **Ação:** `Sistema` cria o objeto `Texto` na camada 1 em (X: 0, Y: 0). (Parâmetros: criar hierarquia = Falso, template = vazio).

# Projeto: Modelo Construct 3 - Armadilhas e Patrulha Simples (Arquivo 5)

## Sistema 1: Armadilhas (Trap)

Lógica básica de punição por colisão.

* **Evento:** `Player` colide com `Trap`.

  * **Ação:** Sistema reinicia o layout.

## Sistema 2: IA de Patrulha Básico (Variação de Aluno)

*Nota para a IA: Esta lógica é uma variação muito semelhante à do Arquivo 1, usando a variável "Direcao" em vez de "Dist" e sem a mecânica de rebater na parede invisível ainda.*

* **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Define a variável `Direcao` do Inimigo escolhendo aleatoriamente entre "direita" e "esquerda".

* **Evento:** `Inimigo` compara se `Direcao` = "esquerda".

  * **Ação:** Inimigo simula o comportamento Plataforma pressionando para a "Esquerda".

* **Evento:** `Inimigo` compara se `Direcao` = "direita".

  * **Ação:** Inimigo simula o comportamento Plataforma pressionando para a "Direita".

# Projeto: Modelo Construct 3 - Plataforma Avançado "Jorge" (Arquivo 6)

## Folha de Eventos 1 (ES 1): IA de Inimigos e Combate Básico

Controla o inimigo "Goons" e as interações físicas de dano.

* **Patrulha do Inimigo (Goons):**

  * **Sistema - Ao iniciar layout:** Define a variável `DIR` do Goons escolhendo aleatoriamente "right" ou "left".

  * **Movimento:** Se `DIR` = "right", simula pulsação para Direita. Se `DIR` = "left", simula pulsação para Esquerda.

  * **Colisão com Parede:** Ao colidir com `EnemyCollider`, inverte a variável `DIR` (vai e vem perfeito).

* **Interação Jogador (Jorge) vs Inimigo (Goons):**

  * **Pulo na cabeça:** Se Jorge colide com Goons, está acima dele (Y < Goons.Y) e está caindo -> Destrói o Goons.

  * **Dano sofrido:** Senão (encostou de lado) -> Define `Health` do Sistema para 0.

* **Ataque Corpo-a-Corpo:**

  * **Colisão:** Se a hitbox `PunchHAND` colide com Goons -> Destrói o Goons e gera o efeito visual `Punch`.

## Folha de Eventos 2 (ES 2): Variáveis Globais, Colecionáveis e Segredos

Gerencia o progresso da fase, moedas (Bananas) e paredes falsas.

* **Variáveis Globais:** `BananaNUMB` (atuais), `DeadNUMB` (mortes), `Health` (vida), `BananaNUMBSAVE` (bananas salvas).

* **Dano Ambiental:**

  * **Colisão:** Jorge colide com `espinho` OU `espinho_sus` -> `Health` = 0.

* **Colecionáveis e Progressão:**

  * **Bananas:** Jorge colide com `Banana` -> Destrói Banana e adiciona 1 a `BananaNUMB`.

  * **Fim de Fase:** Jorge colide com `EscadaDeSaida` -> Vai para a próxima fase, soma `BananaNUMB` ao `BananaNUMBSAVE` e zera o `BananaNUMB` atual.

  * **Interface:** Atualiza o texto de Bananas somando as atuais com as salvas. Atualiza o texto de Mortes.

* **Sistema de Parede Falsa (Segredo):**

  * Se Jorge sobrepõe `WallTrigger` -> Variável `OnWall` = Verdadeiro (Senão, Falso).

  * Se `OnWall` é verdadeiro E `ParedeInvisivel` tem a variável `CanFade` -> Define opacidade de `ParedeInvisivel` e `FakeSpike` para 20 (Fica transparente). Senão, volta para 100.

## Folha de Eventos 3 (ES 3): Animação Avançada, Hitboxes e Fall Damage

Controla a máquina de estados do jogador, o temporizador do soco e o dano por queda.

* **Animações de Movimento:**

  * Movendo E no chão -> Animação "WALK".

  * NÃO movendo E `CanAttack` é verdadeiro -> Animação "IDLE".

  * Caindo -> Animação "FALL".

  * Teclado Esquerda/Direita -> Espelha ou Não Espelha o Jorge.

* **Sistema de Morte e Respawn:**

  * Se `Health` <= 0 -> Resgata as bananas salvas (`BananaNUMB` = `BananaNUMBSAVE`), adiciona 1 morte, reinicia o layout e restaura `Health` para 2.

* **Sistema de Ataque (Soco):**

  * **Gatilho:** Pressionar 'E' -> `CanAttack` = Falso.

  * **Animação:** Se NÃO pode atacar E NÃO está se movendo -> Animação "PUNCH".

  * **Geração de Hitbox:** Durante a animação "PUNCH" no Quadro 1 -> Gera `PunchHAND`.

  * **Finalização:** Quando "PUNCH" terminar -> `CanAttack` = Verdadeiro.

  * **Temporizadores:** `PunchHAND` dura 0.02s. Efeito `Punch` dura 0.1s. `PunchHAND` copia o espelhamento do Jorge.

* **Dano por Queda (Fall Damage):**

  * **Acúmulo:** A cada tick que o Jorge está caindo -> Adiciona 1 a `FallTime`.

  * **Impacto Mortal:** A cada tick, se Jorge colide com Chão E `FallTime` >= 50 -> `Health` = 0.

  * **Pouso Seguro:** Se Jorge NÃO está caindo E `FallTime` < 50 -> Zera o `FallTime`.

* **Outros Perigos:** Colidir com `Desmonoramento` -> `Health` = 0.

# Projeto: Modelo Construct 3 - Top-Down Shooter estilo "Brawl Stars" (Arquivo 7)

## Sistema 1: Controle Principal do Jogador

* **Inicialização:** Ao iniciar o layout, o `Player` é movido para o topo da camada.

* **Mira Contínua:** A cada tick, o ângulo de tiro (`ShootAngle`) acompanha o ângulo do jogador (com um ajuste de -45 graus).

## Sistema 2: Arsenal e Troca de Armas (PlayerShootControl)

O jogador aperta a tecla "O" para circular entre 5 tipos de ataques. Cada arma define a cadência (`frequencia`), a distância máxima (`ShootDistance`) e dispara uma animação de interface (Interpolação de Opacidade no texto).

* **0 - Shelly:** Frequência 0.5, Distância 200. Tiro em área (Spread).

* **1 - Colt:** Frequência 0.1, Distância 200. Tiros duplos/rápidos.

* **2 - Penny:** Frequência 0.5, Distância 100. Tiro único que explode/dispersa.

* **3 - Frank:** Ataque de área/corpo-a-corpo de curta duração.

* **4 - Test:** Tiro com animação de carregamento antes de disparar.

## Sistema 3: Comportamento dos Tiros e Impacto

Regras universais para os projéteis na tela.

* **Destruição Base:** O `tiro` é destruído se colidir com o `ground` (chão/parede), se atingir um `inimigo` (destruindo o inimigo também), ou se passar da distância máxima (`Player.ShootDistance`).

* **Mecânica da Penny (Tiro de Dispersão):** Se o tiro atingir a distância máxima E a arma for "Penny", ele subtrai o multiplicador e gera múltiplos projéteis (`tiroDispersão`) em ângulos diferentes (`ShootAngleSum`), criando um efeito de estilhaço.

* **Mecânica do Frank:** O `AtaqueFrank` destrói inimigos, destrói moitas (incluindo a camada da moita) e some após 1 segundo (Cronômetro).

* **Cooldown de Tiro:** Quando o cronômetro "tiro" do Player acaba, a variável `canShoot` é alternada, permitindo atirar novamente.

## Sistema 4: Lógica de Disparo (Gatilhos)

Quando a Barra de Espaço é pressionada e `canShoot` é verdadeiro, o jogo verifica qual é a arma ativa (`ShootTipe`):

* **Shelly:** Inicia o cooldown e usa um loop ("Repetir `shootnums` vezes") para gerar múltiplos tiros em ângulos sequenciais.

* **Colt:** Inicia o cooldown e gera dois tiros simultâneos usando pontos de imagem diferentes do jogador (simulando duas pistolas).

* **Penny:** Inicia o cooldown e gera um tiro único.

* **Frank:** Inicia o cooldown e gera o `AtaqueFrank`, iniciando um temporizador de 1 segundo para a duração do ataque.

* **Test:** Gera uma animação (`TiroAnim`). Somente quando a animação "Shoot" termina, os tiros reais são instanciados e espalhados.

## Sistema 5: Stealth e Visão (A Moita)

Mecânica de furtividade usando sobreposição e opacidade de camadas.

* **Escondido:** Se o `Player` sobrepõe a `moita` -> A camada da moita fica transparente (Opacidade 0) para o jogador ver dentro, e a camada externa escurece (Opacidade 50).

* **Exposto:** Se NÃO sobrepõe a moita -> A camada da moita volta a ficar opaca (escondendo o que tem dentro) e a camada externa fica normal.

## Sistema 6: IA do Inimigo (Wander e Line of Sight)

Movimentação aleatória em 8 Direções com detecção de visão.

* **Patrulha Aleatória:** Ao iniciar ou colidir com uma parede, escolhe uma direção aleatória ("direita", "esquerda", "cima", "baixo") e anda para ela. Um cronômetro "virar" (entre 0.5 e 1.5 segundos) faz ele mudar de rota sozinho.

* **Campo de Visão (Line of Sight):** * Se NÃO tem visão do jogador: Mantém opacidade em 100.

  * Se TEM visão do jogador: Opacidade cai para 50, ele muda de direção imediatamente e recalcula a rotação.

# Projeto: Modelo Construct 3 - Plataforma Simples com WASD (Arquivo 8)

## Sistema 1: Movimentação Customizada (WASD)

Este aluno optou por desativar os controles padrões das setas e mapear manualmente as teclas WASD para o comportamento Plataforma.

* **Evento:** `Teclado` - Ao pressionar D.

  * **Ação:** `Player` simula o comportamento Plataforma pressionando para a Direita.

* **Evento:** `Teclado` - Ao pressionar A.

  * **Ação:** `Player` simula o comportamento Plataforma pressionando para a Esquerda.

* **Evento:** `Teclado` - Ao pressionar W.

  * **Ação:** `Player` simula o comportamento Plataforma pressionando Pulo.

## Sistema 2: Morte Básica

* **Evento:** `Player` colide com `spike` (espinho).

  * **Ação:** Sistema reinicia o layout.

## Sistema 3: IA de Inimigo (Com erro de lógica)

Sistema de patrulha simples, mas com um erro de digitação clássico de aluno na hora de copiar e colar blocos.

* **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Define a variável `Dir` do Inimigo escolhendo aleatoriamente entre "right" e "left".

* **Evento:** `Inimigo` compara se `Dir` = "left".

  * **Ação:** Inimigo simula o comportamento Plataforma pressionando para a **Esquerda**.

* **Evento:** `Inimigo` compara se `Dir` = "right".

  * **Ação:** Inimigo simula o comportamento Plataforma pressionando para a **Esquerda**. *(Nota de Debug: Aqui o aluno esqueceu de trocar a ação para "Direita", fazendo com que o inimigo ande apenas para a esquerda, não importa o valor sorteado na variável).*

# Projeto: Modelo Construct 3 - Plataforma "P1" e Inimigo "TypeA" (Arquivo 9)

## Sistema 1: Armadilhas Básicas

* **Evento:** `P1` colide com `Spikes`.

  * **Ação:** Sistema reinicia o layout.

## Sistema 2: IA de Patrulha (Vai-e-Vem)

Lógica de movimentação autônoma do inimigo com colisor invisível.

* **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Define a variável `Dir` do `EnemyTypeA` escolhendo aleatoriamente entre "direita" e "esquerda".

* **Evento:** `EnemyTypeA` compara se `Dir` = "esquerda".

  * **Ação:** Simula o comportamento Plataforma pressionando para a Esquerda.

* **Evento:** `EnemyTypeA` compara se `Dir` = "direita".

  * **Ação:** Simula o comportamento Plataforma pressionando para a Direita.

### Inversão de Direção

* **Evento:** `EnemyTypeA` colide com `EnemyCollider4Noobz`.

  * **Sub-evento:** Se `Dir` = "direita".

    * **Ação:** Define `Dir` para "esquerda".

  * **Sub-evento:** Senão.

    * **Ação:** Define `Dir` para "direita".

*(Nota de Otimização Pedagógica: No código original, o aluno duplicou os eventos de "Simular Plataforma Esquerda/Direita" logo após o bloco de colisão. Ótimo exemplo para abrir em sala e ensinar sobre "Clean Code" e a desnecessidade de repetir instruções que já estão rodando em todo tick no topo da folha).*

## Sistema 3: Combate (Interação Jogador vs Inimigo)

* **Evento:** `P1` colide com `EnemyTypeA`.

  * **Sub-evento (Pulo na cabeça):** Se `P1.Y` < `EnemyTypeA.Y` (está acima) E `P1` está caindo.

    * **Ação:** Destrói `EnemyTypeA`.

    * **Ação:** Define vetor Y de Plataforma para -500 (rebote).

  * **Sub-evento (Dano lateral):** Senão.

    * **Ação:** Sistema reinicia o layout.

# Projeto: Modelo Construct 3 - Base Didática Plataforma 2D (Arquivo 10)

*Nota: Este arquivo representa a estrutura base ("Projeto Trilho") ensinada aos alunos para a introdução ao motor. Ele contém redundâncias intencionais ou acidentais típicas do processo de aprendizagem em sala.*

## Sistema 1: Armadilhas Básicas e Punição

* **Evento:** `Player` colide com `Spikes`.

  * **Ação:** Sistema reinicia o layout.

## Sistema 2: IA de Patrulha do Inimigo

Lógica de movimentação autônoma com colisor invisível (Vai-e-Vem).

* **Inicialização:**

  * **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Define a variável `Dir` do `inimigo` escolhendo aleatoriamente "esquerda" ou "direita".

* **Movimentação Base:**

  * **Evento:** `inimigo` compara se `Dir` = "direita".

  * **Ação:** Simula Plataforma pressionando Direita.

  * **Evento:** `inimigo` compara se `Dir` = "esquerda".

  * **Ação:** Simula Plataforma pressionando Esquerda.

### Inversão de Direção com Colisor (`ColisprDoInimigo`)

* **Evento:** `inimigo` colide com `ColisprDoInimigo`.

  * **Sub-evento:** Se `Dir` = "esquerda".

    * **Ação:** Define `Dir` para "direita".

  * **Sub-evento:** Senão.

    * **Ação:** Define `Dir` para "esquerda".

*(Nota Didática: Os blocos de movimentação base se repetem no final deste código. Para turmas mais avançadas, isso serve como exercício de otimização de "Clean Code").*

## Sistema 3: Combate (Pulo na Cabeça)

Interação física clássica entre Jogador e Inimigo.

* **Evento:** `Player` colide com `inimigo`.

  * **Sub-evento (Ataque Bem-Sucedido):** Se `Player.Y` < `inimigo.Y` (está acima) E `Player` está caindo.

    * **Ação:** Destrói `inimigo`.

    * **Ação:** Define vetor Y de Plataforma para -500 (efeito de rebote na cabeça).

  * **Sub-evento (Dano Sofrido):** Senão (encostou lateralmente ou por baixo).

    * **Ação:** Sistema reinicia o layout.

# Projeto: Modelo Construct 3 - Plataforma Avançado com Gamepad (Arquivo 11)

*Nota: Projeto modelo criado pelo professor, organizado em Grupos de Eventos para fins didáticos, apresentando mecânicas avançadas de plataforma fantasma e suporte a controle de videogame.*

## Grupo: Objetos (Interações de Cenário)

* **Progressão:** `Personagem` colide com `Portal` -> Sistema vai para o layout correspondente à variável `Portal.NextLevel`.

* **Armadilhas Letais:** `Personagem` colide com `Espinhos` OU `EspinhosMoveis` -> Sistema reinicia o layout.

* **Mecânica de Plataforma Fantasma/Esmagadora (`chaoQueSeMove`):**

  * **Intangível:** Se Opacidade <= 30 -> Define Comportamento Sólido como Desabilitado.

  * **Tangível:** Se Opacidade > 50 -> Define Comportamento Sólido como Habilitado.

  * **Esmagamento:** Se `chaoQueSeMove` está sobrepondo o `Personagem` E a Opacidade > 50 -> Sistema reinicia o layout (O personagem é esmagado ou sufocado pela plataforma se materializando em cima dele).

## Grupo: Inimigos (IA e Combate)

* **Patrulha Padrão (Vai-e-Vem):**

  * Movimento contínuo baseado na variável `dir` ("direita" ou "esquerda").

  * Ao colidir com `ColisorInimigo`, inverte a variável `dir`.

* **Combate Físico (Pulo na Cabeça):**

  * **Ataque:** `Personagem` colide com `Inimigo` + Caindo + Acima do inimigo (`Y < Inimigo.Y`) -> Destrói o Inimigo e aplica vetor Y de -500 (rebote).

  * **Dano:** Senão -> Sistema reinicia o layout.

## Lógica Raiz (Fora dos Grupos)

* **Inicialização:** `Sistema` - Ao iniciar layout -> Define a variável `dir` do `Inimigo` escolhendo aleatoriamente entre "direita" e "esquerda".

## Grupo: Controles (Gamepad)

Mapeamento de controle analógico e botões de Xbox/PlayStation para o comportamento Plataforma.

* **Analógico Direito:** `Gamepad 0` Eixo X do analógico esquerdo > 1 -> Simula Plataforma Direita.

* **Analógico Esquerdo:** `Gamepad 0` Eixo X do analógico esquerdo < -1 -> Simula Plataforma Esquerda.

* **Pulo:** `Gamepad 0` Botão A pressionado -> Simula Plataforma Pulo.

# Projeto: Modelo Construct 3 - Plataforma Básico Aluna (Arquivo 12)

*Nota: Variação de projeto de aluno desenvolvida em dinâmica de turma cheia (acompanhamento passo a passo). Apresenta a estrutura fundamental de um jogo de plataforma.*

## Sistema 1: Armadilhas (Spikes)

* **Evento:** `Player2` colide com `spikes`.

  * **Ação:** Sistema reinicia o layout.

## Sistema 2: IA de Inimigo (Patrulha Vai-e-Vem)

* **Inicialização:**

  * **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Define a variável `dir` do `Inimigo` escolhendo aleatoriamente "direita" ou "esquerda".

* **Movimentação Base:**

  * **Evento:** `Inimigo` compara se `dir` = "esquerda".

  * **Ação:** Simula Plataforma pressionando Esquerda.

  * **Evento:** `Inimigo` compara se `dir` = "direita".

  * **Ação:** Simula Plataforma pressionando Direita.

* **Inversão de Rota (Colisão com `wallMove`):**

  * **Evento:** `Inimigo` colide com `wallMove`.

  * **Sub-evento:** Se `dir` = "esquerda".

    * **Ação:** Define `dir` para "direita".

  * **Sub-evento:** Senão.

    * **Ação:** Define `dir` para "esquerda".

## Sistema 3: Combate (Interação Física)

* **Evento:** `Player2` colide com `Inimigo`.

  * **Sub-evento (Ataque Bem-Sucedido):** Se `Player2.Y` < `Inimigo.Y` (está acima) E `Player2` está caindo.

    * **Ação:** Define o vetor Y de Plataforma para -500 (Efeito de quique).

    * **Ação:** Destrói o `Inimigo`.

  * **Sub-evento (Dano Sofrido):** Senão (encostou nas laterais).

    * **Ação:** Sistema reinicia o layout.

# Projeto: Modelo Construct 3 - Plataforma Fantasma e Inimigo Obstáculo (Arquivo 13)

*Nota: Projeto com mecânica de plataforma que alterna solidez baseada em opacidade. O inimigo atua como um obstáculo letal irremovível (sem mecânica de dano por pulo).*

## Sistema 1: Plataforma Fantasma (chaoQueSeMove)

Mecânica atrelada ao comportamento de Opacidade/Fade (geralmente alterada por um comportamento Seno ou evento de tempo).

* **Evento:** `chaoQueSeMove` compara Opacidade < 20.

  * **Ação:** Define Sólido como Desabilitado (Plataforma intangível).

* **Evento:** `chaoQueSeMove` compara Opacidade > 50.

  * **Ação:** Define Sólido como Habilitado (Plataforma tangível).

## Sistema 2: Armadilhas (Trap)

* **Evento:** `Player` colide com `Trap`.

  * **Ação:** Sistema reinicia o layout.

## Sistema 3: IA de Patrulha Básico

* **Inicialização:**

  * **Evento:** `Sistema` - Ao iniciar layout.

  * **Ação:** Define a variável `Dir` do `Inimigo` escolhendo aleatoriamente entre "direita" e "esquerda".

* **Movimentação:**

  * **Evento:** `Inimigo` compara se `Dir` = "direita".

  * **Ação:** Simula Plataforma pressionando Direita.

  * **Evento:** `Inimigo` compara se `Dir` = "esquerda".

  * **Ação:** Simula Plataforma pressionando Esquerda.

* **Inversão de Direção:**

  * **Evento:** `Inimigo` colide com `ColisorDoInimigo`.

  * **Sub-evento:** Se `Dir` = "direita".

    * **Ação:** Define `Dir` para "esquerda".

  * **Sub-evento:** Senão.

    * **Ação:** Define `Dir` para "direita".

## Sistema 4: Interação com Inimigo (Morte Instantânea)

* **Evento:** `Player` colide com `Inimigo`.

  * **Ação:** Sistema reinicia o layout (Morte instantânea ao tocar em qualquer parte do inimigo).

# Projeto: Modelo Construct 3 - Padrão de Patrulha Básico (Arquivo 14)

*Nota: Projeto didático que evidencia o padrão clássico de ensino da lógica de plataforma (Inimigo vai-e-vem e pulo na cabeça).*

## Sistema 1: IA de Patrulha (Vai-e-Vem)

* **Inicialização:** `Sistema` - Ao iniciar layout -> Define `Dir` do `Inimigo` para escolher("direita","esquerda").

* **Movimento Base:** * Se `Dir` = "direita" -> Simula Plataforma Direita.

  * Se `Dir` = "esquerda" -> Simula Plataforma Esquerda.

* **Inversão de Rota:** `Inimigo` colide com `ColisorInimigo` -> Se "direita", vira "esquerda" (Senão, vira "direita").

## Sistema 2: Combate (Ataque por Cima)

* **Evento:** `Player` colide com `Inimigo`.

  * **Sub-evento (Ataque):** Se `Player.Y` < `Inimigo.Y` (está acima).

    * **Ação:** Destrói `Inimigo`.

    * **Ação:** Define vetor Y de Plataforma para -500.

  * **Sub-evento (Dano):** Senão.

    * **Ação:** Sistema reinicia o layout.

*(Nota de Debugging: Diferente das outras versões, este aluno não incluiu a condição "Plataforma está caindo". Sem isso, ocorre o famoso bug onde o jogador pode matar o inimigo batendo a cabeça na sola do pé dele se pular de baixo para cima).*

# Projeto: Modelo Construct 3 - Plataforma Incompleto / Com Erros (Arquivo 15)

*Nota: Projeto de aluno contendo erros clássicos de lógica (movimento duplicado) e mapeamento de controles incompleto. Excelente exemplo para exercícios de debugging.*

## Sistema 1: Armadilhas (Traps)

* **Evento:** `Sprite` (Personagem) colide com `Traps`.

  * **Ação:** Sistema reinicia o layout.

## Sistema 2: IA de Patrulha (Com Erro de Lógica)

* **Inicialização:** `Sistema` - Ao iniciar layout -> Define a variável `dir` do `Inimigo` escolhendo aleatoriamente "direita" ou "esquerda".

* **Movimento Base:**

  * Se `dir` = "esquerda" -> Simula Plataforma Esquerda.

  * Se `dir` = "direita" -> Simula Plataforma **Esquerda**. *(Nota de Debugging: O aluno duplicou o evento mas esqueceu de mudar a ação. O inimigo só andará para a esquerda, independente da variável).*

* **Inversão de Rota:** `Inimigo` colide com `ColisorDoInimigo` -> Se `dir` = "direita", vira "esquerda" (Senão, vira "direita").

## Sistema 3: Controles Customizados (Incompleto)

O aluno iniciou o mapeamento das teclas WASD, mas parou no primeiro botão.

* **Evento:** `Teclado` - Ao pressionar D.

  * **Ação:** `Sprite` simula o comportamento Plataforma pressionando Direita.

# Projeto: Modelo Construct 3 - Geração Procedural de Labirinto (Arquivo 16)

*Nota: Projeto avançado desenvolvido em conjunto com uma turma de 15 alunos. Utiliza matemática de grade (grid), loops aninhados e aleatoriedade para gerar um labirinto único a cada partida, incluindo *spawns* seguros para chaves e inimigos.*

## Variáveis Globais (Configuração da Grade)

* `Altura` = 29 (Linhas da grade)

* `Largura` = 52 (Colunas da grade)

* `Gap` = 2 (Fator de densidade/buracos no labirinto)

* `EnemyMax` = 10 (Quantidade de inimigos a serem gerados)

## Sistema 1: Inicialização (Setup)

* **Evento:** `Sistema` - Ao iniciar layout.

  * **Ações:** * Chama a Função `Maze` (Gera o cenário).

    * Define a direção inicial do Inimigo (`Dir`) sorteando de 1 a 4.

    * Destrói a `Chave` original e recria em uma coordenada de grade aleatória: `(aleatorio(1, Largura) * 32, aleatorio(1, Altura) * 32)`.

## Grupo: Inimigo (Movimento em Grade e Spawn)

* **Movimentação Base (Comportamento MovimentoEmGrid):**

  * `Dir` 1 = Esquerda / `Dir` 2 = Direita / `Dir` 3 = Acima / `Dir` 4 = Abaixo.

* **Inteligência de Rota:**

  * Se colidir com `Parede` OU NÃO estiver se movendo -> Sorteia nova `Dir` (1 a 4).

* **Sistema de Spawn Seguro:**

  * Enquanto `EnemyMax` ≠ 0 -> Cria inimigo em posição aleatória da grade (multiplicado por 32) e subtrai 1 de `EnemyMax`.

  * *Tratamento de Erro:* Se o inimigo recém-criado nascer sobrepondo uma `Parede` -> Destrói o inimigo e adiciona 1 de volta ao `EnemyMax` (forçando o sistema a tentar outra posição no próximo tick).

## Grupo: Maze (Função de Geração Procedural)

Este bloco desenha os limites e o miolo do labirinto usando laços de repetição (Loops).

* **Bordas Horizontais (Teto e Chão):** Loop "x" de 1 a `Largura`. Cria paredes em Y=32 e Y=Altura*32. Marca as paredes de baixo com a variável `Position` = "Bottom" e `JustCreated` = Verdadeiro.

* **Bordas Verticais (Esquerda e Direita):** Loop "y" de 2 a `Altura-1`. Cria paredes laterais. Marca as da direita com `Position` = "Right" e `JustCreated` = Verdadeiro.

* **Geração do Miolo (Lógica de Labirinto):**

  * Loop aninhado: "x" (2 até Largura-2) e "y" (3 até Altura-2).

  * **Condição de Grade:** Só executa se `IndiceLoop("x") % 2 = 1` e `IndiceLoop("y") % 2 = 1` (Garante o espaçamento de corredores usando Módulo).

  * **Geração Aleatória:** Se `aleatorio(10) > Gap`, cria uma Parede central.

  * **Conexões:** Sorteia uma direção `r` (0 a 4) e cria uma parede adjacente calculando o offset em X e Y usando Álgebra Booleana `(32 * (r=0))`, etc.

## Sistema 2: Posicionamento Final de Itens

* **Chave Segura:** Se a `Chave` nascer sobrepondo uma `Parede` -> É destruída e gerada novamente em outro ponto aleatório da grade.

* **Porta de Saída Aleatória:** * Seleciona as Paredes que têm a variável `Position` como "Right" ou "Bottom" (Bordas).

  * Filtra pelas que acabaram de ser criadas (`JustCreated`).

  * Pega uma Parede aleatória dessa seleção, destrói, e cria a `Porta` exatamente no lugar dela.

# Projeto: Modelo Construct 3 - Sistema Básico de Portal (Arquivo 17)

*Nota: Estrutura introdutória clássica. Um dos primeiros códigos desenvolvidos para ensinar transição de fases.*

## Sistema 1: Transição de Layout

* **Evento:** `Player` colide com `Portal`.

  * **Ação:** Sistema vai para o layout definido na variável de instância `PortalID` do objeto `Portal`. *(Nota Didática: Ensina o conceito de reaproveitamento de código, onde vários portais usam a mesma linha de evento, mudando apenas a variável interna de cada um para definir o destino).*

# Projeto: Modelo Construct 3 - RPG Top-Down com Interação e Armas (Arquivo 18)

*Nota: Protótipo de jogo com visão superior (Top-Down) contendo movimentação em 4 direções, sistema de interação com texto (máquina de escrever) e troca rápida de armas.*

## Inicialização

* **Sistema - Ao iniciar layout:** Limpa a interface (Destrói `Info` e `TextImg`) e define a arma inicial (`WeaponSwap` = "Fist").

## Grupo: Move (Movimentação Customizada WASD)

Mapeia as teclas WASD para o comportamento 8-Direções e salva a direção atual em uma variável.

* **W:** Simula Cima -> Define `Direction` = "Up"

* **S:** Simula Baixo -> Define `Direction` = "Down"

* **A:** Simula Esquerda -> Define `Direction` = "Left"

* **D:** Simula Direita -> Define `Direction` = "Rigth" *(Nota: Erro de digitação mantido por consistência nas animações)*

## Grupo: Interact (Sistema de Interação e Leitura)

* **Gatilho:** `Player` sobrepõe `AreaInt` + Pressiona a tecla "E".

  * **Ação:** Cria a caixa de texto (`Info`) e a imagem da caixa (`TextImg`) na interface (camada 1).

* **Efeito Máquina de Escrever:** * Ao criar `Info` -> Aciona o comportamento Máquina de Escrever com o texto "Você encontrou uma prova" (duração de 2 segundos).

* **Finalização:** * Quando a Máquina de Escrever termina -> Aguarda 2 segundos e destrói os elementos de UI (`Info`, `TextImg`) e o item do chão (`Prova`).

## Grupo: Powers (Sistema de Armas e Ataque)

Gerencia a troca de armas (teclas 1, 2, 3) e o ataque (tecla C).

* **Troca de Armas (Inputs):** Tecla 1 = "Fist", Tecla 2 = "Gun", Tecla 3 = "Dagger".

* **Feedback Visual (UI):** A animação do objeto de interface `WeaponSelect` muda de acordo com o estado atual da variável `WeaponSwap`.

* **Ataque (Tecla C):** * Gera o objeto `attack` (hitbox/efeito).

  * Verifica a arma equipada (`WeaponSwap`) e define a animação correspondente do `attack` ("Fist", "Gun" ou "Dagger").

* **Limpeza do Ataque:** Quando a animação do `attack` termina, aguarda 1.0 segundo e o destrói.

## Grupo: Anim (Animações de Movimento)

* Se `Direction` = "Up", "Down", "Left" ou "Rigth" -> Define a animação correspondente para o Player.

* Se Comportamento 8-Direções NÃO estiver se movendo -> Define animação para "Idle".

# Projeto: Modelo Construct 3 - Freeway / Atravessar a Rua (Arquivo 19)

*Nota: Projeto didático que recria a mecânica clássica de Frogger/Freeway. Utiliza movimentação baseada em grade (grid) para simular os "saltos" do personagem no trânsito.*

## Grupo: Movimentação Player (TileMovement)

Mapeia as setas do teclado para o comportamento de Movimento em Grid (TileMovement), garantindo o movimento bloco a bloco, e aciona as animações direcionais.

* **Evento:** `Teclado` - Ao pressionar Seta para Cima (↑).

  * **Ação:** `Personagem` simula TileMovement pressionando Acima.

  * **Ação:** Define animação para "Cima" (executar do início).

* **Evento:** `Teclado` - Ao pressionar Seta para Baixo (↓).

  * **Ação:** `Personagem` simula TileMovement pressionando Abaixo.

  * **Ação:** Define animação para "Baixo" (executar do início).

* **Evento:** `Teclado` - Ao pressionar Seta para Direita (→).

  * **Ação:** `Personagem` simula TileMovement pressionando Direita.

  * **Ação:** Define animação para "Direita" (executar do início).

* **Evento:** `Teclado` - Ao pressionar Seta para Esquerda (←).

  * **Ação:** `Personagem` simula TileMovement pressionando Esquerda.

  * **Ação:** Define animação para "Esquerda" (executar do início).

## Grupo: Morte do Jogador (Obstáculos)

* **Evento:** `Personagem` colide com `Carro1`.

  * **Ação:** Sistema reinicia o layout.

## Grupo: Fim do Jogo (Condição de Vitória)

* **Evento:** `Personagem` colide com `Final` (provavelmente a calçada/chegada do outro lado da rua).

  * **Ação:** Sistema vai para o layout "Fim".

# Projeto: Modelo Construct 3 - Plataforma Básico com Bug de Colisão (Arquivo 20)

*Nota: Projeto didático de plataforma. Contém um erro clássico de estrutura de eventos na hora de separar o ataque bem-sucedido do dano sofrido.*

## Sistema 1: Armadilhas e Fim de Fase

* **Morte:** `Player` colide com `spike` -> Sistema reinicia o layout.

* **Vitória/Loop:** `Player` colide com `finishline` -> Sistema reinicia o layout. *(Nota: Em projetos finais, isso normalmente levaria para a próxima fase).*

## Sistema 2: IA de Patrulha (O Cara)

Lógica padrão de vai-e-vem usando as nomenclaturas criativas do aluno.

* **Inicialização:** `Sistema` - Ao iniciar layout -> Define `Dir` do `InimigoOcara` para escolher("direita","esquerda").

* **Movimento:**

  * Se `Dir` = "direita" -> Simula Plataforma Direita.

  * Se `Dir` = "esquerda" -> Simula Plataforma Esquerda.

* **Inversão:** `InimigoOcara` colide com `colisaodoocara` -> Se `Dir` = "direita", vira "esquerda" (Senão, vira "direita").

## Sistema 3: Combate (Com Bug Lógico)

* **Evento 1 (Ataque):** `Player` colide com `InimigoOcara`.

  * **Condições Adicionais:** `Player.Y` < `InimigoOcara.Y` E Plataforma está caindo.

  * **Ações:** Destrói `InimigoOcara` e Define vetor Y para -500.

* **Evento 2 (Dano - Erro de Estrutura):** `Player` colide com `InimigoOcara`.

  * **Ação:** Sistema reinicia layout.

*(Nota de Debugging para o Professor: Como o Evento 2 não é um sub-evento "Senão" do Evento 1, ele roda de forma independente. Se o jogador pular na cabeça do inimigo, o Construct executa o Evento 1 e, logo em seguida, o Evento 2, causando morte mútua. A correção em sala de aula seria transformar o Evento 2 em um bloco "Senão" atrelado às condições do Evento 1).*

# Projeto: Modelo Construct 3 - Flappy Bird Clone (Arquivo 21)

*Nota: Recriação completa da mecânica do Flappy Bird. Excelente exemplo de jogo estilo "Infinite Runner" utilizando Delta Time (dt) para movimentação suave e geração contínua de obstáculos.*

## Variáveis Globais (Configuração de Balanceamento)

* `SegundosPorObstaculo` = 2 (Tempo entre a criação de novos canos)

* `ForçaPulo` = 600 (Força do pulo do pássaro)

* `VelocidadeScroll` = 300 (Velocidade em que o cenário se move para a esquerda)

* `Pontos` = 0

## Sistema 1: Inicialização (Setup da Fase)

* **Evento:** `Sistema` - Ao iniciar layout.

  * **Ações de Reset:** Zera os `Pontos`, destrói canos residuais (`CanoSuperior`, `CanoInferior`) e reseta a posição X das camadas de chão para 0.

  * **Impulso Inicial:** Define o vetor Y do `Player` para `-ForçaPulo` e inclina o ângulo para 320 graus (bico para cima).

## Sistema 2: Controles (Flap)

* **Evento:** `Mouse` - Em qualquer clique.

  * **Ação:** Define o vetor Y do `Player` (Plataforma) para `-ForçaPulo`.

  * **Ação:** Define o ângulo do `Player` para 320 graus.

## Sistema 3: Lógica Contínua (Every Tick e Delta Time)

O coração do jogo rodando a cada frame, utilizando `dt` para independência de framerate.

* **Física e Interface:**

  * Rotaciona o `Player` em `60 * dt` graus no sentido horário (faz o bico ir caindo com o tempo).

  * Mantém o `PontosTexto` no topo da camada e atualiza seu valor.

* **Movimentação do Cenário (Scroll):**

  * Subtrai `VelocidadeScroll * dt` da posição X de `CanoSuperior`, `CanoInferior`, `CamadaChão` e `CamadaChão2`. (Tudo se move para a esquerda, dando a ilusão de que o pássaro voa para a direita).

## Sistema 4: Parallax Infinito (Reset do Chão)

Cria a ilusão de um chão infinito reposicionando as imagens quando saem da tela.

* Se `CamadaChão.X` <= -700 -> Define X para 0.

* Se `CamadaChão2.X` <= -500 -> Define X para 0.

## Sistema 5: Condições de Derrota (Game Over)

Se o `Player` colidir com `CamadaChão`, `CanoInferior`, `CanoSuperior` OU sair do layout -> Sistema vai para a tela "Menu".

## Sistema 6: Geração Procedural de Obstáculos (Spawners)

Cria os canos em alturas aleatórias mantendo um espaço fixo entre eles.

* **Evento:** A cada `SegundosPorObstaculo` (2) segundos.

  * **Cria Cano Superior:** X = 700 (fora da tela pela direita), Y = Aleatório entre -175 e 25.

  * **Cria Cano Inferior:** X = 700, Y = `CanoSuperior.Y` + 900 (Garante sempre o mesmo buraco para o pássaro passar, baseado na posição sorteada do cano de cima).

  * Define a variável de instância `Pontuado` do Cano Superior como Falso.

## Sistema 7: Pontuação e Otimização de Memória

* **Destruição (Garbage Collection):** Se `CanoSuperior.X` ou `CanoInferior.X` < -50 (passou da tela pela esquerda) -> Destrói os objetos para não travar a memória.

* **Marcar Ponto:** Se `CanoSuperior.X` <= `Player.X` (pássaro ultrapassou o cano) E `Pontuado` é Falso -> Adiciona 1 aos `Pontos` e define `Pontuado` como Verdadeiro (para não pontuar duas vezes no mesmo cano).

# Projeto: Modelo Construct 3 - Plataforma "Padrão de Aluno" (Arquivo 22)

*Nota: Projeto clássico de nivelamento em turma, contendo todas as mecânicas da "Base Universal" (Armadilhas, Inimigo Vai-e-Vem, Plataforma Fantasma, Combate e Portais). Contém um evento vazio residual típico de projetos em desenvolvimento.*

## Sistema 1: Armadilhas e Progressão

* **Morte:** `Player` colide com `Traps` -> Sistema reinicia o layout.

* **Vitória/Avanço:** `Player` colide com `portal` -> Sistema vai para o próximo layout (variável nativa do Construct, útil para não precisar nomear as fases na mão).

## Sistema 2: IA de Inimigo (Patrulha Vai-e-Vem)

* **Inicialização:** `Sistema` - Ao iniciar layout -> Define variável `dir` do `Inimigo` para escolher("direita", "esquerda").

* **Movimentação Base:**

  * Se `dir` = "esquerda" -> Simula Plataforma Esquerda.

  * Se `dir` = "direita" -> Simula Plataforma Direita.

* **Inversão com Colisor:** `Inimigo` colide com `ColisorDoInimigo`.

  * Se `dir` = "direita" -> Define `dir` para "esquerda" (Senão, "direita").

## Evento Fantasma / Lixo de Código

* **(não possui condições) -> (não possui ações)** *(Nota de Debugging: Evento em branco criado acidentalmente e não removido, muito comum em projetos iniciantes).*

## Sistema 3: Combate (Pulo na Cabeça)

* **Evento:** `Player` colide com `Inimigo`.

  * **Sub-evento (Ataque):** Se `Player.Y` < `Inimigo.Y` (está acima) E Plataforma está caindo.

    * **Ação:** Define vetor Y de Plataforma para -500 (Rebote).

    * **Ação:** Destrói `Inimigo`.

  * **Sub-evento (Dano):** Senão.

    * **Ação:** Sistema reinicia layout.

## Sistema 4: Plataforma Fantasma (`BlocoQueSeMove`)

Alternância de solidez baseada no fade/opacidade do objeto.

* Se Opacidade < 20 -> Define Sólido como Desabilitado.

* Se Opacidade > 50 -> Define Sólido como Habilitado.

# Projeto: Modelo Construct 3 - Mega Plataforma / Masterclass Eletiva (Arquivo 23)

*Nota: Projeto "Magnum Opus" desenvolvido em uma disciplina eletiva de Ensino Médio. Funciona como um compilado de mecânicas avançadas (Gimmicks) de jogos de plataforma, implementadas a partir de pedidos de alunos. Utiliza separação de Hitbox e funções matemáticas avançadas.*

## Sistema 1: Inicialização e Hitbox (Setup)

* Configura a interface, define escalas e esconde a opacidade da camada de escuridão (`BlackWindow`).

* **Hitbox Separada:** Fixa o objeto visual `PlayerAnim` no objeto físico `PlayerCollision`. Essa técnica evita que a mudança de frames de animação cause bugs de colisão no cenário.

* Grava a posição inicial (`FirstX`, `FirstY`) para o sistema de Checkpoint.

## Grupo: Environment & Gimmicks (Mecânicas de Cenário)

* **`CoinEffect`:** Rotaciona as moedas e pisca um efeito visual de "Divide" a cada 0.5 segundos usando a variável `EffectEnable`.

* **`FadeWall` (Passagens Secretas):** Quando o player sobrepõe uma parede secreta (`chao` ou `chaoTiled` com a variável `CanFade`), a opacidade cai de 100 para 10/30.

* **`InvisibleBlocks`:** Blocos que ficam tangíveis/intangíveis dependendo da sua opacidade (que flutua guiada por um comportamento Senoide).

* **`SwitchBlock` (Palácio de Cristal do Mario):** Bater no `SwitchBlock` alterna a variável global `Switch` e chama a função `UpdateBlocks`.

  * *Função `UpdateBlocks`:* Se ativado, os blocos Vermelhos ficam sólidos e visíveis, e os Azuis ficam intangíveis e invisíveis. Se desativado, inverte a lógica.

* **`DoubleSenoide`:** Plataformas móveis complexas que leem valores de Seno vertical e horizontal, possuindo um temporizador (`TimerVertical`) para pausar nos limites do movimento antes de retornar.

* **`FireBar` (Barra de Fogo):** Utiliza o comportamento "Orbit" (Órbita). Um objeto base gera múltiplos fogos ao seu redor no momento da criação, multiplicando o raio de órbita pelo Índice do Loop (criando uma linha de fogo giratória).

## Grupo: Sistemas Avançados do Jogador

* **`CameraZone` (Câmera Dinâmica):**

  * Utiliza `clamp` para trancar a visualização da câmera dentro das bordas de um objeto delimitador (`CameraZone`).

  * Utiliza `lerp` com Delta Time (`dt`) para criar um pan (deslizamento) suave acompanhando o jogador.

* **`Lader` (Escadas):**

  * Mecânica complexa de troca de Comportamentos (Behaviors).

  * Ao tocar na escada e apertar Cima/Baixo, o comportamento `Platform` (que tem gravidade) é desabilitado, e o `8Direction` é habilitado.

  * *Função `DropOffLadder`:* Inverte o processo e aplica um leve vetor Y negativo para o personagem dar um "pulinho" ao sair do topo da escada.

* **`Cave` (Sistema de Escuridão):**

  * Ao entrar na caverna, a variável `BlackLayerOpacity` sobe gradativamente até 95%, escurecendo a tela inteira (exceto uma luz fixada no jogador).

  * O texto da UI (Moedas/Vidas) muda de preto para branco (`rgbEx(255, 255, 255)`) para contrastar com o fundo escuro.

## Sistema 2: Combate, Morte e Cheats

* **Inimigo:** Patrulha padrão com inversão de colisor. Morte ocorre se o player pular na cabeça caindo. Ele resgata variáveis do próprio inimigo morto (moedas e vidas) para dar ao jogador.

* **Dano e Morte:** Se a vida (`Lifes`) chegar a zero, reseta todo o layout e as variáveis globais, além de devolver o jogador para a `FirstLevel`.

* **`Hacks` (Developer Mode):** Apertar "O" liga/desliga o grupo de cheats (feedback visual com temporizador "Ok"). Se ligado, apertar "P" adiciona vidas infinitas para testes.

# Projeto: Modelo Construct 3 - Plataforma com Checkpoint e IA de Perseguição (Arquivo 24)

*Nota: Projeto de nível intermediário. Mantém a base de plataforma clássica, mas substitui a punição de "Game Over" (Restart Layout) por um sistema moderno de Checkpoints por coordenadas, além de adicionar um sistema de visão (Agro) aos inimigos.*

## Variáveis Globais e Inicialização

* `Moeda` = 0 (Controla a pontuação).

* **Setup:** Ao iniciar layout -> Define a direção do inimigo (`dir`), salva a posição inicial do `Player` nas variáveis `CheckX` e `CheckY`, e atualiza o texto de moedas.

## Sistema 1: Movimentação e Espelhamento

* Setas Direita/Esquerda controlam o espelhamento do `Player` (Não espelhado / Espelhado).

## Sistema 2: Interações de Cenário Avançadas

* **Trampolim:** `Player` colide com `Trampolim` -> Define vetor Y para `Trampolim.ForcaDoPulo * -1`. *(Nota Matemática: Multiplicar por -1 inverte o valor positivo da força para um vetor negativo, gerando o pulo).*

* **Parede Falsa:** Se `Player` sobrepõe `paredeFalsa` -> Opacidade cai para 50 (Revela segredo). Senão -> Opacidade volta para 100.

* **Plataforma Móvel/Fantasma:** * Opacidade < 5 -> Intangível (Sólido Desabilitado).

  * Opacidade > 50 -> Tangível (Sólido Habilitado).

* **Porta de Transição:** `Player` colide com `Porta` -> Vai para o layout armazenado em `Porta.Fase` e teleporta o jogador para as coordenadas locais `(Porta.TPX, Porta.TPY)`.

## Sistema 3: Checkpoint e Punição (Lava/Inimigo)

Substitui o "Reiniciar Layout" por teletransporte seguro.

* **Salvar Progresso:** `Player` colide com `checkpoint` -> Salva as coordenadas do objeto nas variáveis do jogador (`CheckX`, `CheckY`).

* **Dano por Lava:** `Player` colide com `Lava` -> Retorna a posição do jogador para `(CheckX, CheckY)`.

## Sistema 4: IA de Inimigo (Patrulha vs Perseguição)

Máquina de estados baseada no comportamento "Campo de Visão" (Line of Sight).

* **Estado 1: Perseguição (Chase)**

  * Se o `inimigo` TEM Campo de Visão do `Player`:

    * Se `inimigo.X` < `Player.X` (Jogador está à direita) -> Simula Plataforma Direita.

    * Se `inimigo.X` > `Player.X` (Jogador está à esquerda) -> Simula Plataforma Esquerda.

* **Estado 2: Patrulha (Wander)**

  * Se o `inimigo` NÃO TEM Campo de Visão do `Player`:

    * Continua o movimento baseado na variável `dir` (Vai-e-Vem).

    * Colidir com `ColisorInimigo` inverte a variável `dir`.

## Sistema 5: Combate e Coleta

* **Pulo na Cabeça:** `Player` colide com `inimigo` E está acima (`Y < inimigo.Y`) E está caindo -> Rebote (-500) e destrói o inimigo.

* **Dano Sofrido:** Senão -> Teleporta o jogador de volta para o Checkpoint `(CheckX, CheckY)`.

* **Moedas:** `Player` colide com `Moeda` -> Destrói moeda, soma 1 à variável global e atualiza o `TextoMoedas` (a cada tick).

# Projeto: Modelo Construct 3 - Plataforma Avançado com Wall Jump (Arquivo 25)

*Nota: Projeto dividido em múltiplas folhas de eventos (Event Sheets) usando a função "Incluir". Apresenta mecânicas complexas como Wall Jump, Barra de Vida (Width), Carregamento Dinâmico de Fases e IA com pulo aleatório.*

## Folha de Eventos 1: Inimigos (IA de Patrulha e Pulo Aleatório)

* **Movimentação Base:** Vai-e-Vem padrão baseado na variável `Direcao` ("direita" ou "esquerda").

* **Colisão de Retorno:** Inverte a `Direcao` ao bater em `ColisorInimigo`.

* **Comportamento Aleatório (Pulo):**

  * **Gatilho:** `Inimigo` colide com `ColisorInimigoPulo` (Um colisor invisível focado em pulo).

  * **Ação:** Define a variável `PodePular` com um valor aleatório entre 1 e 10 `arredondar(aleatorio(1,10))`.

  * **Resolução (40% de chance):** Se `PodePular` for 2, 4, 6 ou 8 -> O Inimigo simula a tecla Pulo. *(Nota de Game Design: Cria um comportamento imprevisível para o jogador, onde o inimigo às vezes pula o obstáculo e às vezes não).*

## Folha de Eventos 2: Player (Combate, Vida e Wall Jump)

* **Variáveis:** `VetorX` = 1000, `LevelNumb` = 1.

* **Mecânica de Wall Jump (Pulo na Parede):**

  * **Condições:** Apertar Seta para Cima (↑) + Player NÃO está no chão.

  * **Parede na Direita:** Define vetor X para `-1 * VetorX` (empurra para a esquerda) e vetor Y para `-500` (empurra para cima).

  * **Parede na Esquerda:** Define vetor X para `VetorX` (empurra para a direita) e vetor Y para `-500` (empurra para cima).

* **Sistema de Vida e UI:**

  * **Setup:** Ao iniciar layout -> Iguala `VidaAtual` à `VidaMax`. Ajusta a largura visual da `VidaFundo` e `VidaBarra` multiplicando a vida máxima por 2 (1 ponto de vida = 2 pixels na tela).

  * **Dano:** Ao bater no inimigo (pela lateral) -> Subtrai 5 de `VidaAtual` e atualiza a largura da `VidaBarra` (`VidaAtual * 2`).

  * **Morte:** Se `VidaAtual` <= 0 -> Reinicia layout, reseta vida e zera moedas.

* **Combate (Pulo na cabeça):** Bater por cima caindo -> Destrói inimigo e aplica super rebote de vetor Y -800.

* **Progressão Dinâmica (Portal):** Colidir com `Portal` -> Soma 1 em `LevelNumb` e vai para o layout `"Fase " & LevelNumb`. *(Nota: Excelente uso de concatenação de strings para evitar programar um portal diferente por fase).*

## Folha de Eventos 3: Props (Cenário, Tempo e Coletáveis)

* **Variáveis Globais:** `Timer` = 300, `Coin` = 0.

* **Plataforma Fantasma:** `PlataformaAndarilha` fica intangível com Opacidade <= 20 e tangível com Opacidade > 30.

* **Cronômetro (Timer):** A cada 1 segundo -> Subtrai 1 de `Timer` e atualiza o texto na tela.

* **Economia (Moedas):** Colidir com `Coin` -> Destrói moeda, soma 1 à global e atualiza o texto.

* **Botão de Saída (Quit):** Clique esquerdo do mouse no objeto `Ground` -> Fecha o navegador (`Navegador: Fechar`).

## Folha de Eventos 4: Main

* Centraliza o código incluindo as folhas `<Inimigos>`, `<Player>` e `<Props>`.

# Projeto: Modelo Construct 3 - Plataforma com Death Counter e Gamepad (Arquivo 26)

*Nota: Projeto focado em "Try and Error" (Tentativa e Erro). Em vez de dar Game Over, o jogo pune os erros do jogador incrementando um contador de mortes e o devolvendo rapidamente ao último checkpoint.*

## Variáveis Globais e Setup

* `Coins` = 0 / `Mortes` = 0

* **Inicialização:** `Sistema` - Ao iniciar layout -> Define direção do `Inimigo`, e grava o *spawn* inicial do `Personagem` nas variáveis `checkX` e `checkY`.

## Grupo: Objetos (Armadilhas, Moedas e HUD)

* **HUD Contínuo:** `Sistema` - A cada tick -> Atualiza os textos `CoinText` e `DeathText` na tela.

* **Transição de Fase:** Colidir com `Portal` -> Vai para o layout armazenado na variável `Portal.NextLevel`.

* **Sistema de Checkpoint:** Colidir com `checkpoint` -> Atualiza as variáveis `checkX` e `checkY` do personagem.

* **Coleta de Moedas:** Colidir com `Coin` -> Destrói a moeda e soma 1 em `Coins`.

* **Sistema de Punição (Morte):** * **Armadilhas Fixas/Móveis:** Colidir com `Espinhos` OU `EspinhosMoveis` -> Teleporta o personagem para `(checkX, checkY)` e soma 1 em `Mortes`.

  * **Esmagamento:** Se `chaoQueSeMove` está sobrepondo o personagem E sua opacidade > 50 (sólido) -> Teleporta para `(checkX, checkY)` e soma 1 em `Mortes`.

* **Plataforma Fantasma:** `chaoQueSeMove` com Opacidade <= 30 fica intangível; com Opacidade > 50 fica sólido.

## Grupo: Inimigos (IA e Combate)

* **Patrulha Vai-e-Vem:** Movimenta baseado na variável `dir`. Bater no `ColisorInimigo` inverte a direção.

* **Combate:** * **Ataque (Pulo na Cabeça):** `Personagem` caindo E acima do `Inimigo` -> Destrói o inimigo e rebote de Y para -500.

  * **Dano (Morte):** Senão -> Teleporta o personagem para `(checkX, checkY)` e soma 1 em `Mortes`.

## Grupo: Controles (Gamepad Mapeado)

Mapeamento direto de controle analógico para a física de Plataforma.

* **Analógico Direito:** `Gamepad 0` Eixo X do analógico esquerdo > 1 -> Simula Plataforma Direita.

* **Analógico Esquerdo:** `Gamepad 0` Eixo X do analógico esquerdo < -1 -> Simula Plataforma Esquerda.

* **Pulo:** `Gamepad 0` Botão A pressionado -> Simula Plataforma Pulo.

# Projeto: Modelo Construct 3 - Plataforma "Amongus" com Sistema de Caverna (Arquivo 27)

*Nota: Projeto autêntico de aluno. Destaca-se pela nomenclatura criativa (erros ortográficos intencionais/comuns) e pela implementação bem-sucedida de um sistema avançado de iluminação dinâmica ensinado em sala.*

## Variáveis Globais e Setup Inicial

* `Chave` = 0 (Contador de coletáveis).

* `OnCave` = falso / `EnterCave` = falso / `BlackLayerOpacity` = 0 (Controle de iluminação).

* **Setup:** Sorteia a `Direcau` da `Araanha1`. Salva a posição do jogador (`amongus`) nas variáveis `xi` e `yi`.

## Loop Contínuo (A cada Tick)

* Atualiza o HUD de chaves (`textohud`).

* Prende o objeto `Ligth` (Luz/Máscara) nas coordenadas do `amongus`.

* Atualiza a opacidade da camada "BlackWindow" (Escuridão) com base na variável `BlackLayerOpacity`.

## Grupo: Inimigo

* **Morte por Armadilha:** Colidir com `espinhu` -> Chama a função `PlayerReset`.

* **IA da Aranha (`Araanha1`):** * Patrulha baseada na variável `Direcau` ("direita" ou "esquerda").

  * Inverte a direção ao bater em `Colisoraranha`.

* **Combate:** * **Ataque:** `amongus` caindo e acima da aranha -> Destrói `Araanha1` e quica (-500 no vetor Y).

  * **Dano:** Senão -> Chama a função `PlayerReset`.

## Grupo: Ações Players (Progressão e Coletáveis)

* **Checkpoint:** Colidir com `Checkpoint` -> Atualiza as variáveis locais de renascimento (`xi`, `yi`).

* **Porta:** Colidir com `Portau` -> Vai para o layout armazenado em `Portau.nextlevel`.

* **Coletáveis:** Colidir com `Coletavel` -> Soma 1 em `Chave` e destrói o item.

* **Upgrade de Visão (Tocha):** Colidir com `Tocha` -> Aumenta as dimensões do objeto `Ligth` para (600, 600), expandindo a área visível no escuro.

## Grupo: Movimentação (Teclas Customizadas)

* **Pulo:** Barra de Espaço.

* **Direita/Esquerda:** Teclas D e A (atualizam também o espelhamento do sprite).

* **Animações:** Se a plataforma NÃO está em movimento -> Animação "Idle". Se ESTÁ em movimento -> Animação "Walk".

## Grupo: Caverna (Sistema de Escuridão Dinâmica)

* **Gatilho de Entrada/Saída:** Bater no `Trigger` deixa a luz visível e alterna a variável `EnterCave`.

* **Transição (Fade-In / Fade-Out):** Utiliza repetições temporizadas para escurecer ou clarear a tela suavemente.

  * **Entrando:** Aumenta `BlackLayerOpacity` de 20 em 20 a cada 0.5 segundos até atingir 95.

  * **Saindo:** Subtrai 20 de `BlackLayerOpacity` a cada 0.5 segundos até atingir 0.

## Grupo: Funções

* **`PlayerReset`:** Teleporta o `amongus` para o último Checkpoint (`xi`, `yi`). Se o Checkpoint for dentro da caverna (`É OnCave`), redefine a opacidade preta para 95 para não bugar a luz; senão, zera a opacidade.

# Projeto: Modelo Construct 3 - Plataforma Padrão com Luz Dinâmica e Interpolação (Arquivo 28)

*Nota: Projeto padrão de nivelamento em sala de aula. Apresenta o uso avançado do comportamento "Interpolação" (Tween) para transições visuais suaves e a criação de comandos de Debug para testar a mecânica de luz.*

## Variáveis Globais e Setup

* `Moedas` = 0 / `LigthScale` = 4

* **Inicialização:** * Define `dir` do `inimigo` (escolher "esquerda" ou "direita").

  * Salva a posição de *spawn* do `Player` nas variáveis `InitX` e `InitY`.

  * Define a escala do objeto `Ligth` (luz/máscara de escuridão) baseada na variável `LigthScale`.

## Grupo: Inimigo (Patrulha e Combate)

* **Patrulha:** Movimenta simulando Plataforma Direita/Esquerda com base na variável `dir`. Ao colidir com `limitadorInimigo`, inverte a direção.

* **Combate (Pulo na Cabeça):**

  * `Player` colide com `inimigo` + Caindo + Acima do inimigo (`Y < inimigo.Y`) -> Rebote de Y em -500 e destrói o inimigo.

  * Senão (dano lateral) -> Teleporta o `Player` para `(InitX, InitY)`.

## Grupo: Objetos (Interações e Cenário)

* **Checkpoint:** Ao colidir, atualiza as variáveis de renascimento `InitX` e `InitY`. *(Nota de Debugging: O aluno inseriu esse evento duas vezes dentro do grupo Objetos).*

* **Armadilhas (`Espinhos`):** Ao colidir, teleporta o `Player` para `(InitX, InitY)`.

* **Plataforma Fantasma (`PlataformaQueDesaparece`):** Fica intangível com Opacidade < 30 e tangível com Opacidade > 50.

* **Coletáveis:** Colidir com `moedas` -> Destrói o objeto e soma 1 na global `Moedas`.

* **Parede Secreta Suave (`FakeWall`):**

  * **Uso de Interpolação (Tween):** Se o Player sobrepõe a `FakeWall`, ela aciona a propriedade de Interpolação para baixar a opacidade para 30 ao longo de 2 segundos (efeito linear, sem repetição).

  * Se NÃO está sobrepondo -> Define a opacidade de volta para 100 abruptamente.

## Grupo: HUD e Fixação

* A cada tick:

  * Atualiza o texto `CoinCount` ("Coins: " & `Moedas`).

  * Fixa a posição da `Ligth` sempre nas coordenadas do `Player`.

## Grupo: Debug (Ferramentas de Teste)

Mapeamento de teclas para o desenvolvedor testar a mecânica sem precisar jogar a fase.

* **Tecla P:** Subtrai 1 de `LigthScale` e atualiza a escala da `Ligth` (Deixa mais escuro).

* **Tecla O:** Adiciona 1 a `LigthScale` e atualiza a escala da `Ligth` (Deixa mais claro).

## Conflito de Lógica (Portais)

*O arquivo apresenta dois eventos distintos para a colisão com o Portal, gerando um conflito lógico que o Construct tentará rodar simultaneamente:*

1\. (Dentro do Grupo Objetos) -> Subtrai 0.5 da `LigthScale` (deixando o jogo mais escuro a cada fase concluída) e **reinicia o layout**.

2\. (Fora dos Grupos, no final do código) -> Vai para o layout armazenado na variável `Portal.NextLevel`.

# Projeto: Modelo Construct 3 - Plataforma com Wall Slide e Seleção de Fases (Arquivo 29)

*Nota: Projeto modular estruturado em folhas de eventos separadas (Includes). Introduz mecânicas refinadas como deslizamento na parede manipulando a gravidade do motor físico, um sistema de seleção de fases (Overworld) e testes de câmera via teclado.*

## Arquitetura e Navegação (Sistema de Portais)

* **Variável Global:** `PlayerLevel` = 0.

* **Módulos:** Utiliza a tag `<Incluir>` para importar as folhas `Player` e `Enemy`.

* **Interação de Portal (Overworld):** Diferente dos portais automáticos, este exige o input do jogador.

  * **Gatilho:** Pressionar Barra de Espaço + `PlayerFamily` (Família de objetos do jogador) sobrepondo `Portal`.

  * **Destinos:** * Se `Portal.LevelNumb` = 0 -> Sistema vai para "Overworld".

    * Se `Portal.LevelNumb` = 1 -> Sistema vai para "Fase 1".

    * Se `Portal.LevelNumb` = 2 -> Sistema vai para "Fase 2".

## Ferramentas de Debug (Câmera / Zoom)

Mapeamento rápido de teclado para testar o escopo visual da fase (Zoom in/Zoom out).

* **Tecla A:** Escala do layout = 1.0 (Padrão).

* **Tecla S:** Escala do layout = 2 (Zoom In / Aproximado).

* **Tecla D:** Escala do layout = 0.5 (Zoom Out / Visão Ampla).

## Grupo: Inimigo (IA Híbrida - Patrulha e Chase)

Máquina de estados que alterna entre patrulhar e perseguir usando o Campo de Visão (Line of Sight) e a variável booleana `player`.

* **Setup:** Sorteia a variável `dir` (1 ou 2) ao iniciar o layout.

* **Estado 1: Patrulha Cega (`player` é Falso)**

  * Movimenta para Esquerda (2) ou Direita (1).

  * Inverte a direção se colidir com `EnemyColisionDetector`.

* **Estado 2: Perseguição (`player` é Verdadeiro)**

  * **Gatilho:** Se tem Campo de Visão do Player -> Define `player` como Verdadeiro.

  * **Ação:** Compara a posição X. Se `Enemy.X > Player.X`, anda para a Esquerda. Senão, anda para a Direita.

  * **Trava de Segurança (Anti-Suicídio):** Se está perseguindo (`player` = Verdadeiro) E colide com o `EnemyColisionDetector` (usado nas bordas de plataformas) -> **Desabilita o comportamento Plataforma**. *(Nota: Isso "congela" a física do inimigo na beirada do abismo, impedindo que ele caia tentando alcançar o jogador embaixo).*

* **Reset de Perseguição:** Se perde o Campo de Visão -> Define `player` como Falso e reabilita o comportamento Plataforma.

## Grupo: WallSlide (Deslizamento em Paredes)

Manipula dinamicamente a gravidade do comportamento Plataforma para criar atrito com a parede.

* **Deslizando (Atrito ativado):**

  * **Condições:** `Player` caindo + NÃO está no chão + Pressionando a seta (Esquerda ou Direita) contra a parede correspondente.

  * **Ação:** Reduz a gravidade do comportamento Platform para **100** (queda suave).

* **Queda Livre (Atrito desativado):**

  * **Condições:** `Player` está no chão OU (NÃO está no chão + NÃO possui parede na direita/esquerda).

  * **Ação:** Restaura a gravidade normal do comportamento Platform para **1500**.

# Projeto: Modelo Construct 3 - Labirinto Procedural Avançado com IA de Perseguição (Arquivo 30)

*Nota: Evolução do gerador de labirintos, desenvolvida pelo professor. Inclui um sistema de iluminação dinâmica atrelada ao jogador, portas com chaves, e uma Inteligência Artificial híbrida (Patrulha Aleatória / Perseguição).*

## Variáveis Globais e Configuração

* `Height` = 29 / `Width` = 52 (Tamanho da grade).

* `EnemyMax` = 20 (Capacidade de inimigos no labirinto).

* `MaxTorch` = 0 (Sistema de tochas preparado para expansões futuras).

## Grupo: Start (Setup e Spawn Seguro)

* Limpa resquícios da fase anterior (destrói paredes, chaves e inimigos velhos).

* **Posicionamento:** Trava o `Player` no início (60, 60) e cola o objeto `Light` (Máscara de visão) nele.

* **Spawn de Itens:** Cria a `Key` (Chave) em uma coordenada aleatória da grade. Se cair em cima de uma `Wall`, destrói e tenta de novo.

* **Spawn de Inimigos:** * Enquanto `EnemyMax` ≠ 0, cria inimigos aleatoriamente pela grade.

  * Adiciona as `Wall` recém-criadas como obstáculo de visão (`CampoDeVisão`) para a IA.

  * Se o inimigo nascer dentro de uma parede, é destruído e o `EnemyMax` é devolvido para tentar novamente.

## Criação da Saída (Door)

* Filtra as paredes das bordas (marcadas como "Right" ou "Bottom" com a variável `JustCreated`).

* Sorteia uma dessas paredes de borda, a destrói e coloca a `Door` (Saída) no exato local.

* *Limpeza visual:* Apaga paredes adjacentes à porta recém-criada para garantir a passagem livre.

## Grupo: Interação e UI

* **UI:** A barra de vida (`BarraDeProgresso`) é constantemente atualizada para refletir a `Player.Vida`. O foco de luz (`Light`) acompanha o jogador a cada tick.

* **Coleta:** Tocar na `Key` a destrói, muda a variável do Player para Verdadeiro e altera o estado da porta (`isOpen` = Verdadeiro).

* **Fuga:** Tocar na `Door` com a chave na mão -> Reinicia o layout (gerando um labirinto totalmente novo).

* **Morte:** Se `Vida` <= 0 -> Reinicia o layout.

## Grupo: Maze (Geração Procedural)

* Lógica matemática utilizando laços de repetição (Loops X e Y) e o operador Módulo (`%2`) para criar os corredores principais e bordas do mapa, idêntico ao modelo ensinado em sala, mas encapsulado na função `Maze`.

## Grupo: EnemyIA (Máquina de Estados)

* **Estado 1: Perseguição (Caça)**

  * **Gatilho:** O Inimigo TEM `CampoDeVisão` do Player.

  * **Ação:** Opacidade sobe para 100%. A variável `Player` fica Verdadeira. Aciona o comportamento `MoveTo` direto para o jogador (Ignorando o 8Direction).

* **Estado 2: Patrulha no Escuro (Vagando)**

  * **Gatilho:** O Inimigo PERDE o `CampoDeVisão`.

  * **Ação:** Opacidade cai para 33% (vulto). Para o `MoveTo` e define a variável `Player` como Falso.

  * **Movimento Base:** Sorteia a variável `Move` (1 a 4) para simular os controles do comportamento `8Direction` (Cima, Baixo, Esquerda, Direita).

  * **Inversão/Recalculo:** Se bater em uma `Wall` ou se o `8Direction` parar de se mover, sorteia uma nova direção aleatória.

* **Combate:** Colidir com o jogador subtrai 10 de `Vida` do Player, destrói o inimigo e devolve 1 para o `EnemyMax` (permitindo que o inimigo "renasça" em outro lugar do labirinto).

# Projeto: Modelo Construct 3 - Sistema de Diálogo (Máquina de Escrever) (Arquivo 31)

*Nota: Protótipo de sistema de caixa de texto contínua. Excelente para ensinar lógica de progressão de diálogos em jogos de RPG ou Adventure sem precisar recorrer a Arrays complexos.*

## Variáveis Globais (Banco de Textos)

Armazenam as falas do NPC/Sistema para manter o código limpo.

* `T1` = "Ola meu amigo que nao sabe oq esta acontecendo"

* `T2` = "Hello my friend that dont know whats im doing"

* `T3` = "Hi boy, what are you doing"

* `T4` = "Bonjourn, i donty speak japonese"

* `TextCount` = 0 (Controla em qual linha do diálogo o jogador está).

## Sistema 1: Gatilho de Avanço (Input)

Impede que o jogador pule o texto enquanto ele ainda está sendo "digitado" na tela.

* **Evento:** `Teclado` - Ao pressionar Enter + `HUDText` NÃO ESTÁ digitando (`[X] É isTyping`).

  * **Ações:** Adiciona 1 à variável `TextCount` e define a booleana `isTyping` para Verdadeiro (travando um novo input).

## Sistema 2: Exibição e Efeito Máquina de Escrever

Verifica qual é a linha atual e aciona o comportamento Typewriter.

* **Gatilho:** Se `HUDText` `É isTyping`.

  * **Ação Base:** Torna o `HUDText` Visível.

  * **Sub-eventos (Filtro de Linha):**

    * Se `TextCount` = 1 -> Máquina de escrever `T1` (Duração: 2 segundos) -> Define `isTyping` para Falso (liberando o próximo Enter).

    * Se `TextCount` = 2 -> Máquina de escrever `T2` -> Define `isTyping` para Falso.

    * Se `TextCount` = 3 -> Máquina de escrever `T3` -> Define `isTyping` para Falso.

    * Se `TextCount` = 4 -> Máquina de escrever `T4` -> Define `isTyping` para Falso.

## Sistema 3: Reset do Diálogo (Loop)

* **Evento:** Se `TextCount` = 4.

  * **Ação:** Define `TextCount` para 0.

*(Nota de Debugging Didático: Da forma como o código foi estruturado, assim que o `TextCount` chega a 4, ele imediatamente zera. Para o jogador conseguir ler a frase 4 antes do balão sumir ou reiniciar, o ideal em sala de aula seria mudar esse reset para `TextCount = 5` ou atrelar o reset a um novo aperto da tecla Enter após a frase 4 terminar).*

# Projeto: Modelo Construct 3 - Trampolim com Pulo Acumulativo (Arquivo 32)

*Nota: Protótipo de mecânica de "Bounce Combo". O trampolim aumenta a força do pulo a cada quique consecutivo, resetando caso o jogador atinja o limite máximo de pulos ou toque no chão normal.*

## Variáveis de Instância do Objeto `Trampolim`

*(Inferidas pela lógica do código)*

* `JumpForce` (Força atual aplicada ao jogador).

* `InitialJumpForce` (Força base de um pulo comum).

* `JumpCount` (Contador de quiques consecutivos).

* `MaxJumps` (Limite máximo de pulos antes do reset).

## Sistema 1: O Quique (Combinação de Força)

* **Evento:** `Player` colide com `Trampolim`.

  * **Ação 1:** Define o vetor Y do comportamento Plataforma para o valor atual de `Trampolim.JumpForce`.

  * **Ação 2:** Adiciona 1 à variável `JumpCount` do trampolim.

  * **Ação 3:** Adiciona o valor de `Trampolim.InitialJumpForce` à `JumpForce`. *(Efeito: O próximo pulo será mais forte/alto que o atual).*

## Sistema 2: Limite Máximo de Quiques

* **Evento:** Se `JumpCount` for igual a `Trampolim.MaxJumps`.

  * **Ação:** Zera o `JumpCount` (Define para 0).

  * **Ação:** Reseta a `JumpForce` de volta para o valor de `InitialJumpForce`.

## Sistema 3: Quebra de Combo (Tocar no Chão)

* **Evento:** Se `Player` com comportamento Plataforma está no chão (fora do trampolim).

  * **Ação:** Reseta a `JumpForce` do trampolim para `InitialJumpForce`.

  * **Ação:** Zera o `JumpCount`.

# Projeto: Modelo Construct 3 - Space Invaders Básico (Arquivo 33)

*Nota: Protótipo de Arcade Clássico. Demonstra como manipular múltiplos objetos simultaneamente (a colmeia de inimigos) e como usar ângulos fixos para projéteis.*

## Variáveis Globais

* `EnemyDir` = "right" (Direção atual da colmeia).

* `CanDown` = falso.

## Sistema 1: Balística (Mecânica de Projéteis)

Ajuste imediato da direção dos tiros assim que são criados.

* **Tiro do Jogador:** Ao criar `PlayerBullet` -> Ângulo de movimento = 270 graus (Para Cima).

* **Tiro do Inimigo:** Ao criar `EnemyBullet` -> Ângulo de movimento = 90 graus (Para Baixo).

## Sistema 2: Controles e Cooldown do Jogador

Sistema de tiro com trava de tempo (Cooldown) usando o sistema de "Sinais" da engine.

* **Gatilho de Tiro:** Barra de espaço + `canshoot` verdadeiro.

  * **Ação:** Trava o tiro (`canshoot` = Falso).

  * **Ação:** Cria o `PlayerBullet` e o joga para o fundo da camada.

* **Cooldown (Espera):**

  * Se `canshoot` for Falso -> Aguarda pelo sinal "shoot" e depois define `canshoot` = Verdadeiro.

  * *Emissor do Sinal:* A cada 0.5 segundos -> O Sistema envia o sinal "shoot".

## Sistema 3: Movimento da Colmeia (Swarm Logic)

Move todos os inimigos juntos e reage como um bloco único.

* **Movimentação Contínua:** A cada tick.

  * Se `EnemyDir` = "right" -> Todos simulam 8Direction Direita.

  * Se `EnemyDir` = "left" -> Todos simulam 8Direction Esquerda.

* **Colisão com a Borda (`Edge`):** O segredo do Space Invaders.

  * **Gatilho:** Se *qualquer* `Enemy` colidir com `Edge`.

  * **Ação:** Seleciona TODOS os inimigos do layout.

  * **Se estava indo para a direita:** Muda `EnemyDir` para "left" e adiciona +5 no Y (desce um pouco).

  * **Se estava indo para a esquerda:** Muda `EnemyDir` para "right" e adiciona +5 no Y.

## Sistema 4: IA de Ataque dos Inimigos

* **Gatilho:** A cada `aleatorio(2.5)` segundos.

* **Ação:** Seleciona um `Enemy` aleatório da tela e faz ele atirar (gerar `EnemyBullet`).

## Sistema 5: Resolução de Conflitos (Combate)

* `PlayerBullet` bate no `Enemy` -> Destrói ambos.

* `EnemyBullet` bate no `Player` -> Destrói ambos.

* **Trava de Segurança:** Se `Enemy` colidir com a `EnemyLine` (linha de limite inferior) -> Força a descida contínua adicionando +5 no Y (Punição por deixar a colmeia chegar muito baixo).

# Projeto: Modelo Construct 3 - Jogo de Corrida Parallax (Top Gear Style) (Arquivo 34)

*Nota: Projeto de corrida estilo Arcade clássico. Utiliza a técnica de Parallax vertical para simular velocidade e um sistema de largada com semáforo atrelado a trilhas sonoras específicas.*

## Variáveis Globais e Setup

* `Corrida` = falso (Controla o estado de "Gameplay" ou "Cutscene/Largada").

* `Parallax` = 15 (Velocidade do cenário).

* **Ao Iniciar Layout:**

  * Toca o efeito `Sinaleira.mp3` (Semáforo).

  * Inicia a animação da `Sinaleira` e define `Parallax` como 15.

  * Aguarda 2 segundos e inicia a música `TopGear.mp3` em loop.

## Sistema 1: Máquina de Estados (Largada)

* **Gatilho:** Quando o quadro da animação da `Sinaleira` chega no 4 (Sinal Verde).

  * **Ações:** Destrói a sinaleira, altera a booleana `Corrida` para Verdadeiro e habilita o comportamento de 8-Direções do `Player`.

## Sistema 2: Movimentação Ilusória (Parallax)

Tudo se move para baixo para dar a ilusão de que o jogador está acelerando para frente.

* **A cada tick (Se `Corrida` = Verdadeiro):**

  * Move a `Pista` para baixo (`Pista.Y + Parallax`).

  * Move os `Inimigos` (carros adversários) para baixo (`Inimigo.Y + 5`). *(Nota: Como o inimigo desce a 5 e a pista desce a 15, dá a ilusão de que os inimigos estão acelerando, mas o jogador está mais rápido que eles).*

* **Loop da Pista:** Se `Pista.Y` >= 470 -> Sorteia um novo quadro de animação (2 a 7) para simular variação no asfalto/cenário.

## Sistema 3: Controles do Jogador (Steering)

Se `Corrida` = Verdadeiro, o jogador pode manobrar o carro.

* **Seta Direita:** Inclina o sprite para 15 graus e soma 5 no eixo X.

* **Seta Esquerda:** Inclina o sprite para 345 graus (-15 graus) e subtrai 5 do eixo X.

* **Soltando as Teclas:** Se NENHUMA das setas estiver pressionada -> Volta o ângulo para 0 graus (carro reto).

## Sistema 4: Geração de Tráfego (Spawners)

* **Condição:** Se `Corrida` = Verdadeiro, a cada `aleatorio(1, 5)` segundos.

* **Ação:** Posiciona o objeto `Spawn` em um X aleatório da pista (160 a 320), sorteia o visual do carro (`quadro da animação` de 0 a 13) e gera o `Inimigo`.

* **Otimização:** Se o `Inimigo` sair da tela (`[X] Está na tela`), ele é destruído para economizar memória.

## Sistema 5: Condições de Derrota (Batidas)

Sistema unificado de Game Over para colisão com os limites da pista ou com o tráfego.

* **Colisão com `Pista` (Bordas) ou `Inimigo`:**

  * Para todas as músicas e toca `Batida.mp3`.

  * Trava o jogo (`Corrida` = Falso) e zera a velocidade do cenário (`Parallax` = 0).

  * Altera a animação do Player (e do Inimigo, se for colisão com carro) para "Batida".

  * Aguarda 3 segundos e reinicia o layout.

# Projeto: Modelo Construct 3 - Jogo do Dinossauro (Dino Run) (Arquivo 35)

*Nota: Projeto estilo Infinite Runner minimalista. Focado em mecânicas de spawn aleatório e sobrevivência por tempo, simulando o famoso jogo do navegador Chrome.*

## Variáveis Globais

* `Pontos` = 0 (Armazena o progresso do jogador).

## Sistema 1: Geração de Obstáculos (Spawner)

Cria a variedade de perigos (cactos, pássaros, etc.) de forma imprevisível.

* **Frequência:** `A cada aleatorio(1, 2)` segundos.

* **Posicionamento:** Cria o objeto `Obstaculos` no X=852 (fora da tela à direita) e Y=410 (altura do chão).

* **Variação Visual:** Assim que o `Obstaculo` é criado, o sistema sorteia um `quadro da animação` entre 0 e 3. *(Nota: Isso permite que um único objeto represente diferentes tipos de obstáculos, como cactos pequenos, grandes ou grupos).*

## Sistema 2: Pontuação e HUD

* **Progressão:** `A cada 1.0 segundos` -> Adiciona 1 à variável `Pontos`.

* **Interface (HUD):** `A cada tick` -> Atualiza o objeto `PontosTexto` para exibir "Distância: " seguido do valor da variável.

## Sistema 3: Condição de Derrota (Game Over)

* **Gatilho:** `Player` colide com `Obstaculos`.

  * **Ação 1:** Reinicia o layout.

  * **Ação 2:** Redefine as variáveis globais para o padrão (zera a pontuação).

## Sistema 4: Otimização (Garbage Collection)

* **Evento:** `Obstaculos` está fora do layout (após passar pelo jogador e sair pela esquerda).

  * **Ação:** Destrói o objeto para evitar acúmulo de instâncias e lentidão no jogo.

# Projeto: Modelo Construct 3 - Labirinto Procedural (Versionamento 10 - Otimizado) (Arquivo 36)

*Nota: A versão mais completa e polida do gerador de labirinto procedural. Além da geração de grade e IA de perseguição, esta versão inclui um sistema robusto de animação direcional por estados.*

## Diferenciais da Versão 10

* **Animação Direcional:** Implementação de 4 direções + Idle baseada em variáveis, garantindo que o sprite do jogador sempre aponte para a direção do movimento.

* **Spawn de Saída Inteligente:** Lógica aprimorada para detectar paredes de borda e transformar uma delas na `Door` (Saída).

* **Garbage Collection de IA:** Sistema que destrói inimigos que nascem dentro de paredes e os "re-gera" em locais válidos.

## Grupo: PlayerAnim (Máquina de Estados Visual)

Este grupo separa a entrada do teclado da execução da animação, uma prática de organização avançada.

* **Captura de Direção:**

  * Teclas de seta (↑, ↓, ←, →) definem a variável de instância `Dir` do Player ("Up", "Down", "Left", "Right").

  * Se o comportamento 8-Direções NÃO está se movendo -> Define `Dir` como "Idle".

* **Execução da Animação:**

  * O sistema verifica o valor da variável `Dir` e aciona a animação correspondente (ex: Se `Dir` = "Left", toca animação "Left").

## Grupo: Maze & Start (Geração de Ambiente)

* **Geração de Paredes:** Utiliza loops para criar o perímetro e o preenchimento interno com base nas variáveis `Width` (52) e `Height` (29).

* **Posicionamento de Itens:** Sorteia locais para a `Key` e os `Inimigos`, garantindo que não se sobreponham às paredes através de um sistema de "Destruir e Recriar" com ajuste no contador `EnemyMax`.

* **Lógica da Porta:** Filtra paredes recém-criadas na borda, seleciona uma aleatória e a substitui pela `Door`. A porta só abre e permite o reinício do layout se o jogador possuir a variável `Key` = Verdadeiro.

## Grupo: EnemyIA (IA com Stealth e Agro)

* **Modo Hunt (Caça):** Se o Player entra no `CampoDeVisão`, o inimigo fica 100% opaco e usa o comportamento `MoveTo` para perseguição direta.

* **Modo Wander (Vagar):** Sem visão do player, a opacidade cai para 33% e o inimigo utiliza o comportamento `8Direction` simulando direções aleatórias (1 a 4).

* **Combate:** Colisão com inimigo causa -10 de vida. Se a vida zerar, o layout reinicia.

# Projeto: Modelo Construct 3 - Plataforma Multi-Sheet com Fluxo de Menu (Arquivo 37)

*Nota: Projeto focado na estrutura organizacional do jogo. Demonstra como interligar diferentes layouts (Menu, Fases, Fim) e como gerenciar variáveis globais para progressão de nível.*

## Arquitetura e Globais

* **Folhas de Eventos:** Utiliza a folha separada `Nuvens` (importada via `<Incluir>`) para gerenciar a estética do cenário de forma independente.

* **Variáveis de Controle:** `Vida` (100), `moedas` (0), `Chave` (booleana), `FaseAtual` (1).

## Sistema 1: Fluxo de Jogo (Navegação)

* **Menu Principal:** Clique no `BotaoJogar` -> Redefine variáveis e envia o jogador para o layout "1".

* **Condição de Vitória (Portal):** Se o jogador colidir com `AguaPortal` E possuir a `Chave` -> O sistema avança para o layout `" " & FaseAtual`.

* **Condição de Derrota:** Se `Vida` <= 0 OU colisão com `ChãoInvisivel` -> Ir para o layout "fim".

* **Tela de Fim:** Clique no `BotaoReiniciar` -> Retorna ao Menu.

## Sistema 2: Movimentação e Animações Complexas

O sistema de animação utiliza verificações de estado para evitar conflitos (ex: não tocar "Correndo" se estiver pulando).

* **Direita/Esquerda:** Simula o movimento, define o espelhamento e aciona a animação "Correndo" apenas se o player estiver em movimento e NÃO estiver pulando ou caindo.

* **Pulo:** Tecla W -> Aciona "PuloCompleto".

* **Idle (Parado):** Se o Player está no chão e NÃO está em movimento -> Aciona "Parado".

## Sistema 3: Câmera e HUD Manual (Every Tick)

Em vez de usar comportamentos automáticos, a lógica posiciona os elementos matematicamente:

* **Câmera:** Centraliza X e Y constantemente no `Player`.

* **HUD de Moedas:** Posiciona o `TextoMoedas` sempre a +200 pixels da centralização da câmera, criando um efeito de interface fixa.

## Sistema 4: IA e Combate

* **Patrulha Travada:** O inimigo grava sua `LocalizaçãoY` inicial para evitar que "flutue" ou caia de forma indesejada durante a patrulha entre os objetos `blocao`.

* **Resolução de Conflito (Dano):**

  * **Ataque:** Pulo por cima caindo -> Destrói inimigo e quica (-900).

  * **Dano:** Colisão lateral -> Ativa o comportamento `Piscar` por 1 segundo e subtrai 20 de vida.

## Sistema 5: Coletáveis e Chaves

* **Moedas:** Soma 1 ao contador.

* **Sistema de Progressão:** Colidir com a `Chave` incrementa a `FaseAtual` e desbloqueia a booleana necessária para usar o `AguaPortal`.

# Projeto: Modelo Construct 3 - Infinite Jumper (Estilo Doodle Jump) (Arquivo 38)

*Nota: Jogo de pulo infinito com geração procedural de plataformas. Destaca-se pela mecânica de "Câmera Unidirecional" e pelo sistema de Wrap-around (teleporte nas bordas da tela).*

## Variáveis Globais de Controle

* `ScrollMinimo` = 999 (Armazena a maior altura - menor valor de Y - alcançada).

* `ProxPlataforma` = 0 (Calcula a coordenada Y para o próximo spawn).

* `PosiçãoPassada` = 0 (Usada para validar o ganho de pontos por subida).

## Sistema 1: Câmera Unidirecional (The Point of No Return)

* **Lógica:** Se `Player.Y` < `ScrollMinimo` -> `ScrollMinimo` assume o valor de `Player.Y`.

* **Câmera:** A cada tick, o sistema centraliza a visão em `ScrollMinimo`. Isso garante que a câmera suba com o recorde de altura, mas nunca desça se o jogador cair.

## Sistema 2: Geração Procedural de Plataformas

* **Gatilho:** Se a variável `ProxPlataforma` for maior ou igual ao topo da tela atual.

* **Ação:** Cria uma `Plataforma` em X aleatório e define o Y da próxima (`ProxPlataforma`) com um distanciamento randômico entre 20 e 100 pixels para cima.

* **Otimização:** Destrói plataformas que ficarem para baixo da visão do jogador (`Y > InferiorDaTela`) para manter a performance.

## Sistema 3: Movimentação e Física "Auto-Jump"

* **Pulo Automático:** Se o `Player` tocar em uma plataforma (Plataforma está no chão) -> Simula Pulo. O jogador não precisa apertar nada para pular, apenas para guiar.

* **Controles Laterais:** Teclas A e D para mover no ar.

* **Wrap-around (Teleporte):**

  * Se `X < -10` -> Teleporta para `LarguraLayout + 9` (Lado direito).

  * Se `X > LarguraLayout + 10` -> Teleporta para `-9` (Lado esquerdo).

## Sistema 4: Pontuação por Ascensão

Um sistema de pontos inteligente que evita "farmar" pontos parado:

* A cada 1.5 segundos: Salva a posição Y atual em `PosiçãoPassada`.

* A cada 3.0 segundos: Compara se `PosiçãoPassada > Player.Y`. Como o Y diminui ao subir, isso prova que o jogador subiu de fato nos últimos segundos e concede 1 ponto.

## Sistema 5: Fluxo de Jogo e Animação

* **Animações:** Alterna entre "Pulando" e "Caindo" baseada no estado do comportamento Plataforma.

* **Game Over:** Se o Player sair da tela por baixo (`Y > InferiorDaTela`) -> Vai para o layout "Morte".

* **Navegação:** Botões de Menu, Reiniciar e Jogar gerenciam a troca de layouts e o reset das variáveis.

# Projeto: Modelo Construct 3 - Maze Roguelike: Torretas e Sobrevivência (Arquivo 39)

*Nota: Versão final e evoluída do gerador de labirinto procedural. O foco muda de exploração simples para combate tático, utilizando um sistema de torretas estáticas com detecção de proximidade e projéteis.*

## Variáveis Globais de Balanceamento

* `Gap` = 7 (Define a densidade das paredes; quanto maior, mais espaços abertos para o combate).

* `EnemyMax` = 10 (Limite de torretas por andar).

* `Life` = 10 (Pontos de vida do jogador).

## Sistema 1: Spawn de Inimigos e Área de Alcance (Range)

* **Geração de Torretas:** Ao criar um `Inimigo`, o sistema define o `Player` como alvo do comportamento Canhão.

* **Feedback de Perigo (`RangeMaker`):** * Para cada torreta, o sistema cria um `RangeMaker` (um círculo ou área visual) na mesma posição.

  * O jogador pode ligar/desligar a visibilidade dessas áreas usando as teclas **M** (Visível) e **N** (Invisível), permitindo um modo de jogo mais difícil ou mais orientado a estratégia.

* **Validação de Spawn:** Se a torreta nascer sobre uma parede, ela e seu RangeMaker são destruídos e o contador é resetado para tentar um novo local válido.

## Sistema 2: Mecânica de Combate (Torretas)

* **Ataque:** O objeto `Inimigo` utiliza o comportamento Canhão para disparar contra o `Player` quando ele entra no raio de ação.

* **Projéteis (`Bullet`):**

  * **Alcance Limitado:** A bala é destruída se percorrer uma distância maior que o `Alcance` definido na torreta. Isso evita disparos atravessando o mapa inteiro.

  * **Interação com Cenário:** Balas são destruídas ao colidir com `Wall`.

  * **Dano:** Colisão com `Player` subtrai 1 de `Life`.

## Sistema 3: Loop de Jogo Infinito (Roguelike Loop)

* **Condição de Vitória (Porta):** Se o jogador tiver a `Key` e tocar na `Door`, o layout reinicia, as variáveis de vida e inimigos são resetadas, e o Maze gera uma configuração totalmente nova. Isso cria o loop de "andares" infinitos.

* **Condição de Derrota:** Se `Life` chegar a 0, o progresso é resetado e o layout reinicia.

## Sistema 4: Geração Procedural (Maze Function)

* Mantém a lógica de criação de bordas e preenchimento aleatório por blocos (Tiles de 32x32).

* A variável `Gap` em 7 garante que o labirinto tenha corredores mais largos, essenciais para que o jogador tenha espaço para desviar dos projéteis das torretas.
