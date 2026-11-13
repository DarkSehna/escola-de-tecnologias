# Diretrizes do Projeto — Escola de Tecnologias

Este documento define regras mandatórias de desenvolvimento para os assistentes de IA que operam neste repositório.

---

## 🛑 Regra de Ouro: Sempre Testar em Localhost Primeiro!

1. **PARECER TÉCNICO E ALINHAMENTO PRÉVIO:**
   - Antes de iniciar qualquer codificação ou criação de ferramenta, forneça uma **opinião técnica detalhada e crítica construtiva** sobre a proposta, avisando se houver riscos de UX, complexidade desnecessária ou falhas de lógica pedagógica.
   - Aguarde o alinhamento e a confirmação do usuário antes de mexer no código.

2. **PROIBIDO COMMIT OU PUSH AUTOMÁTICO SEM APROVAÇÃO:**
   - **NUNCA** execute `git commit` ou `git push` automaticamente logo após codificar ou alterar arquivos.
   - O ambiente de produção (GitHub Pages na branch `main`) afeta diretamente os alunos e a visualização do colégio.

3. **Fluxo Obrigatório de Trabalho:**
   1. **Alinhar & Opinar:** Discutir a ideia técnica e pedagogicamente.
   2. **Implementar / Editar:** Fazer as alterações no código local.
   3. **Verificar Localmente:** Validar no servidor local (`python -m http.server 5500`) em `http://127.0.0.1:5500/`.
   4. **Apresentar ao Usuário para Testes:** Indicar os links locais para o usuário testar no navegador do PC ou celular.
   5. **Aguardar Validação:** Só fazer `git commit` e `git push` quando o usuário **pedir explicitamente**.

---

## 🐪 Convenção Pedagógica: Padrão `camelCase`

- Todo código didático, variáveis de instância, structs e fórmulas entregues aos alunos (GameMaker GML, Construct 3, scripts de suporte) devem seguir rigorosamente o padrão `camelCase` (ex: `maxHp`, `scoreValue`, `damage`, `spd`, `hitPoints`, `moveSpeed`).

---

## 🌐 Integridade do Portal e Ferramentas

1. **Paridade de Ferramentas:**  
   Sempre que uma nova ferramenta for adicionada ao Hub (`index.html`), registre o toggle correspondente no Painel do Professor (`portal-professor/index.html`). O número de cards no Hub deve ser idêntico ao número de toggles no Painel.
2. **Internacionalização (i18n):**  
   Ao criar ou alterar cards, títulos ou botões no Hub, atualize ambos os dicionários (`DICTIONARY.pt` e `DICTIONARY.en`) no `lang-toggle.js` sem deixar chaves faltantes.
3. **Prevenção de FOUC e Conflitos Mobile:**  
   Mantenha `<meta name="color-scheme" content="dark light">` e regras de contraste alto (`#ffffff` explícito no tema escuro) para evitar que o modo noturno forçado de navegadores móveis descolore títulos ou ícones.
