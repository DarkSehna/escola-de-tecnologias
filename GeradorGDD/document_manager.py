import json
import os

def save_document(data: dict, md_path: str):
    """
    Salva o GDD no formato híbrido Markdown contendo os dados do projeto
    estruturados invisivelmente no topo em um bloco de comentário HTML.
    """
    md_content = generate_markdown(data)
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

def load_document(file_path: str) -> dict:
    """
    Carrega os dados de um arquivo. Suporta tanto o novo formato híbrido (.md)
    quanto o formato legível (.json) da versão anterior para compatibilidade.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Arquivo {file_path} não encontrado.")
        
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    
    # 1. Compatibilidade com arquivos .json antigos
    if ext == '.json':
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    # 2. Novo formato híbrido (.md ou .txt)
    elif ext in ['.md', '.txt']:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        start_marker = "<!-- GDD_PROJECT_DATA:\n"
        end_marker = "\n-->"
        
        start_idx = content.find(start_marker)
        if start_idx == -1:
            # Fallback para busca sem quebra de linha rígida
            start_marker = "<!-- GDD_PROJECT_DATA:"
            start_idx = content.find(start_marker)
            
        if start_idx == -1:
            raise ValueError("Este arquivo Markdown não contém metadados ocultos de projeto para o Gerador de GDD.")
            
        json_start = start_idx + len(start_marker)
        end_idx = content.find(end_marker, json_start)
        
        if end_idx == -1:
            raise ValueError("Estrutura de metadados corrompida (comentário HTML não fechado).")
            
        json_str = content[json_start:end_idx].strip()
        return json.loads(json_str)
        
    else:
        raise ValueError("Formato de arquivo não suportado. Escolha um arquivo .md ou .json.")

def generate_markdown(data: dict) -> str:
    """
    Compila os dados em um relatório Markdown bem estruturado e insere os dados
    estruturados no topo como comentário oculto (Frontmatter híbrido).
    """
    game_name = data.get("game_name", "Jogo Sem Nome").strip()
    genre = data.get("genre", "Não especificado")
    objective = data.get("objective", "").strip()
    story = data.get("story", "").strip()
    world_setting = data.get("world_setting", "").strip()
    
    hero_name = data.get("hero_name", "Herói").strip()
    hero_desc = data.get("hero_desc", "").strip()
    hero_skills = data.get("hero_skills", "").strip()
    
    controls = data.get("controls", [])
    
    world_mechanics_selected = data.get("world_mechanics_selected", [])
    world_mechanics_desc = data.get("world_mechanics_desc", "").strip()
    
    minions_desc = data.get("minions_desc", "").strip()
    bosses_desc = data.get("bosses_desc", "").strip()
    
    victory_cond = data.get("victory_cond", "").strip()
    defeat_cond = data.get("defeat_cond", "").strip()

    # Formatação das mecânicas selecionadas
    mechanics_list_str = ""
    if world_mechanics_selected:
        mechanics_list_str = "\n".join([f"- [x] {mech}" for mech in world_mechanics_selected])
    else:
        mechanics_list_str = "*Nenhuma mecânica específica selecionada.*"

    # Formatação dos controles em tabela Markdown
    controls_table = ""
    if controls:
        controls_table = "| Ação do Jogador | Tecla / Comando |\n| :--- | :--- |\n"
        for ctrl in controls:
            act = ctrl.get("action", "").strip()
            key = ctrl.get("key", "").strip()
            if act or key:
                controls_table += f"| {act} | `{key}` |\n"
    else:
        controls_table = "*Nenhum controle mapeado ainda.*"

    # Gera a string dos dados em JSON estruturado para salvar ocultamente no topo
    json_data = json.dumps(data, ensure_ascii=False, indent=4)
    frontmatter = f"<!-- GDD_PROJECT_DATA:\n{json_data}\n-->\n"

    md = frontmatter + f"""# 📝 Game Design Document (GDD) - {game_name}

> Este documento de design de jogo (GDD) serve como guia para a criação, arte e programação do seu jogo em qualquer plataforma ou engine de desenvolvimento.

---

## 🌍 1. Visão Geral e Mundo do Jogo

* **Gênero:** {genre}
* **Objetivo Geral do Jogo:**
  {objective if objective else "*Sem objetivo definido.*"}

### 📖 História e Premissa
{story if story else "*Sem história definida.*"}

### 🗺️ O Mundo do Jogo (Cenário)
{world_setting if world_setting else "*Sem descrição do mundo.*"}

---

## 👤 2. Protagonista e Controles

* **Nome do Protagonista:** {hero_name}
* **Descrição/Personalidade:**
  {hero_desc if hero_desc else "*Sem descrição do protagonista.*"}

* **Mecânicas e Habilidades do Personagem:**
  {hero_skills if hero_skills else "*Sem habilidades definidas.*"}

### 🎮 Mapeamento de Controles
{controls_table}

---

## ⚙️ 3. Mecânicas do Mundo e Inimigos

### 🧱 Elementos Ativos no Mundo
{mechanics_list_str}

### 🛠️ Detalhes das Mecânicas do Mundo
{world_mechanics_desc if world_mechanics_desc else "*Sem descrição de funcionamento das mecânicas do mundo.*"}

### 👾 Inimigos Comuns (Minions)
{minions_desc if minions_desc else "*Sem descrição de inimigos comuns.*"}

### 👑 Chefes (Bosses) e Padrões de Ataque
{bosses_desc if bosses_desc else "*Sem chefes descritos.*"}

---

## 🏆 4. Regras do Jogo (Fluxo)

### 🥇 Condição de Vitória (Como Ganhar?)
{victory_cond if victory_cond else "*Sem condição de vitória definida.*"}

### 💀 Condição de Derrota (O que causa Game Over?)
{defeat_cond if defeat_cond else "*Sem condição de derrota definida.*"}

---
*GDD gerado automaticamente pelo **Gerador de GDD**.*
"""
    return md
