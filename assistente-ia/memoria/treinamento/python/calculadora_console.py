"""
Calculadora em Python

1 - Comandos Básicos:
print("") -> Comando para mostrar na tela o que estiver entre as aspas.
input("") -> Comando para receber um valor do usuário. O texto entre as aspas é a pergunta que aparece na tela.
float()   -> Transforma o texto que o usuário digitou em um número (com ou sem vírgula) para podermos fazer contas. Sem isso, o Python acha que "5" + "5" é "55".

2 - Onde estão as chaves { }?
No Arduino, usávamos { e } para mostrar o que estava dentro de um bloco. 
No Python, usamos o espaço (TAB ou recuo). Tudo que estiver "empurrado" para a direita pertence ao comando de cima!

3 - Criando Nossos Próprios Comandos:
def -> Usado para "definir" uma nova função. Em vez de escrever o mesmo código várias vezes, criamos um bloco modular com 'def' e 
usamos (chamamos) ele quando precisarmos. Isso deixa o código organizado e evita trabalho repetitivo!

4 - Recriando o void loop() do Arduino:
Para a nossa calculadora não fechar assim que fizer a primeira conta, precisamos prendê-la em um ciclo infinito.
Usamos o `while True:` (Enquanto for verdade, repita).
"""

num1 = 0
num2 = 0
opcao = ""
resultado = 0

def somar(num1, num2):
    resultado = num1 + num2
    return resultado

def subtrair(num1, num2):
    resultado = num1 - num2
    return resultado

def multiplicar(num1, num2):
    resultado = num1 * num2
    return resultado

def dividir(num1, num2):
    resultado = num1 / num2
    return resultado

def calculadora(num1, num2, opcao):
    if opcao == "+":
        return somar(num1, num2)
    elif opcao == "-":
        return subtrair(num1, num2)
    elif opcao == "*":
        return multiplicar(num1, num2)
    elif opcao == "/":
        return dividir(num1, num2)
    else:
        print("Operação inválida!")
        return None



while True:
    print("Bem-vindo à calculadora!")
    num1 = float(input("Digite o primeiro número: "))
    num2 = float(input("Digite o segundo número: "))
    opcao = input("Digite a operação (+, -, *, /): ")
    
    resultado = calculadora(num1, num2, opcao)
    print("O resultado é: ", resultado)
