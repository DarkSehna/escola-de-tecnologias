#include <BitBang_LiquidCrystal_I2C.h>

// Pinos 18 (A4) e 19 (A5)
LiquidCrystal_I2C lcd(0x27, 16, 2, 18, 19); 

// Variáveis Globais (O "Cérebro" do Relógio)
int minutos = 0;
int segundos = 0;

void setup() 
{
  lcd.begin();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Cronometro I2C");
}

// ---------------------------------------------------
// FUNÇÃO 1: APENAS MATEMÁTICA (Sem tocar na tela)
// ---------------------------------------------------
void calcularTempo() 
{
  segundos = segundos + 1; // Incrementa a base

  // O "Estouro da Casa Decimal" (Base 60)
  if (segundos == 60) {
    segundos = 0;            // Zera a casa atual
    minutos = minutos + 1;   // Sobe 1 para a próxima casa
  }
}

// ---------------------------------------------------
// FUNÇÃO 2: APENAS INTERFACE (Sem fazer contas de tempo)
// ---------------------------------------------------
void exibirTempo() 
{
  lcd.setCursor(5, 1); // Posiciona mais ou menos no meio da linha de baixo

  // A sua lógica relacional: menor ou igual a 9
  if (minutos <= 9) 
  {
    lcd.print("0");
  }
  lcd.print(minutos);

  // O separador
  lcd.print(":");

  // A mesma regra para a casa dos segundos
  if (segundos <= 9) 
  {
    lcd.print("0");
  }
  lcd.print(segundos);
}

// ---------------------------------------------------
// O LOOP PRINCIPAL (Organizado e Limpo)
// ---------------------------------------------------
void loop() 
{
  // A execução do tempo usando as nossas funções customizadas
  delay(1000); // Espera 1 segundo real (a engrenagem do relógio)
  
  calcularTempo();
  exibirTempo();
}