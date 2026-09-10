import tkinter as tk

# --- 1. AS NOSSAS FUNÇÕES COM PARÂMETROS (A alma da aula) ---
def somar(a, b):
    return a + b

def subtrair(a, b):
    return a - b

def multiplicar(a, b):
    return a * b

def dividir(a, b):
    if b == 0:
        return "Erro: Divisão por zero!"
    return a / b


# --- 2. A FUNÇÃO "GERENTE" (Que liga a tela às contas) ---
def gerenciar_calculadora(operacao):
    # 1º Passo: Pegar o que está escrito na tela e virar número
    n1 = float(caixa_num1.get())
    n2 = float(caixa_num2.get())
    
    # 2º Passo: Descobrir qual botão chamou o gerente e passar os PARÂMETROS
    if operacao == "+":
        resultado = somar(n1, n2)
    elif operacao == "-":
        resultado = subtrair(n1, n2)
    elif operacao == "*":
        resultado = multiplicar(n1, n2)
    elif operacao == "/":
        resultado = dividir(n1, n2)
        
    # 3º Passo: Mostrar na tela
    texto_resultado.config(text=f"Resultado: {resultado}")


# --- 3. A INTERFACE GRÁFICA ---
janela = tk.Tk()
janela.title("Calculadora do 6º Ano")
janela.geometry("300x400")

tk.Label(janela, text="Número 1:").pack(pady=5)
caixa_num1 = tk.Entry(janela)
caixa_num1.pack(pady=5)

tk.Label(janela, text="Número 2:").pack(pady=5)
caixa_num2 = tk.Entry(janela)
caixa_num2.pack(pady=5)

# --- 4. OS BOTÕES COM O "LAMBDA" (O Guarda-costas) ---
# O lambda segura a execução até o clique acontecer
tk.Button(janela, text="➕ Somar", command=lambda: gerenciar_calculadora("+")).pack(pady=5)
tk.Button(janela, text="➖ Subtrair", command=lambda: gerenciar_calculadora("-")).pack(pady=5)
tk.Button(janela, text="✖️ Multiplicar", command=lambda: gerenciar_calculadora("*")).pack(pady=5)
tk.Button(janela, text="➗ Dividir", command=lambda: gerenciar_calculadora("/")).pack(pady=5)

texto_resultado = tk.Label(janela, text="Resultado: ---", font=("Arial", 12, "bold"))
texto_resultado.pack(pady=20)

janela.mainloop()