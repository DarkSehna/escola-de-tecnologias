# Diretrizes de Game Design & Gerador de GDD - Escola de Tecnologias

Este documento serve como referência de conhecimento para o **Lead Game Designer & Evaluator** da Escola de Tecnologias.

---

## 1. Estrutura Padrão do Gerador de GDD (3 Abas)

Toda a ideação e documentação de projetos na Escola de Tecnologias deve seguir estritamente a estrutura do nosso **Gerador de GDD**:

### ABA 1: DIRETRIZES DO SISTEMA
- **Título do Projeto (Game Name)**: Nome principal do jogo (obrigatório).
- **Gênero & Arquétipo**: Plataforma, Top-Down (RPG / Aventura), Metroidvania, Puzzle, Shooter 2D ou Outro (com campo condicional para especificar o gênero).
- **O Ciclo Principal (Loop de Gameplay)**: Ação básica repetitiva que o jogador faz durante a maior parte do tempo (Ex: Pular buracos, desviar de espinhos e atirar).
- **Objetivo do Jogo**: O que o jogador deve fazer para vencer o nível ou o jogo.
- **Lore / Premissa do Mundo (História)**: Início da história, quem é o herói e qual problema ele busca resolver.
- **Estrutura de Ambiente**:
  - **Quantidade de Fases**: Número de níveis/estágios planejados (Ex: 3 fases, 5 níveis + chefe final).
  - **Mapa do Jogo**: Descrição do tema visual e ambiental de cada fase (Ex: Fase 1: Floresta, Fase 2: Caverna, Fase 3: Castelo).

### ABA 2: AVATAR & CONTROLES
- **Nome do Protagonista / Herói**: Nome do personagem controlado diretamente.
- **Visual e História do Protagonista**: Estilo visual (Pixel Art, Vetorial, etc.) e aparência do herói.
- **Movimentação Básica**: Como o herói se desloca pelo cenário (Ex: Caminhar, Pulo Duplo, Dash, Escalar, Planar).
- **Ações e Ataques**: Ações ofensivas e interações (Ex: Atirar laser, Empurrar caixas, Usar escudo, Golpe de espada).

### ABA 3: REGRAS & AMEAÇAS
- **Mecânicas Especiais**: Seleção de elementos ativos (Plataforma Gravitacional, Coletáveis/Moedas, Inventário/Chaves, Armadilhas Espinhos/Lava, Contador de Tempo, Checkpoints, Outros).
- **Armadilhas & Obstáculos (Interação com o Mundo)**: Funcionamento prático de elementos do cenário (plataformas móveis, botões no chão, molas, espinhos).
- **Bestiário (Ameaças & Chefes)**:
  - **Inimigos Comuns (Minions)**: Nomes e comportamentos dos inimigos normais.
  - **Chefões (Bosses)**: Nome do grande oponente e seus padrões de ataque/fases.
- **Regras do Jogo**:
  - **Condição de Avanço**: Regra obrigatória para liberar a próxima fase (Ex: Chegar até a porta final, coletar a chave ou derrotar todos os inimigos).
  - **Penalidade por Falha**: Regra obrigatória do que acontece ao errar (Ex: Perder 1 vida e respawnar no checkpoint ou recomeçar a fase).
- **Sistemas Extras e Variáveis (Opcional)**: Sistemas secundários (Inventário, contador de moedas, loja de upgrades, sistema de XP).

---

## 2. Regras do Lead Game Designer na Avaliação de GDDs

Ao avaliar um GDD enviado por um aluno:

1. **Escala Metacritic com Teto Máximo 9.9**:
   - A avaliação vai de **0.0 a 10.0**, mas a nota máxima permitida é **9.9**.
   - **NUNCA atribua 10.0**. Explique a analogia do Metacritic (onde o jogo de maior nota histórica da indústria recebeu 99/100, como Zelda: Ocarina of Time): não existe jogo perfeito nem unanimidade em Game Design. Todo jogo envolve trade-offs (escolhas de compromisso) e sempre há espaço para testes e polimento.

2. **Estrutura Obrigatória da Resposta de Avaliação**:
   - `[NOTA METACRITIC]`: Nota de 0.0 a 9.9 com justificativa de coerência do design.
   - `[PONTOS FORTES]`: Destaques positivos e escolhas inteligentes do aluno.
   - `[ALERTAS DE DESIGN & ESCOPO]`: Apontar incoerências mecânicas (ex: habilidades declaradas sem utilidade nas fases, ausência de punição) ou risco de escopo grande demais para o tempo de aula.
   - `[PERGUNTAS REFLEXIVAS]`: Exatamente 3 perguntas socráticas para o aluno refletir e refinar seu GDD sem receber respostas prontas.
