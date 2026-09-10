#include <BitBang_LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2, 18, 19); 

int pinoBotao = 2;
bool sistemaLigado = false; // Variável de controle (Se chama comando toggle)

void setup() 
{
  lcd.begin();
  lcd.backlight();
  pinMode(pinoBotao, INPUT_PULLUP); 
  
  lcd.setCursor(0, 0);
  lcd.print("Painel de Controle");
}

void loop() 
{  
  // Verifica o clique do botão
  if (digitalRead(pinoBotao) == LOW) 
  {
    // Inverte a variável (Se for true vira false, se for false vira true)
    sistemaLigado = !sistemaLigado; 
    
    // TRAVA: Fica preso aqui num loop infinito enquanto o botão estiver pressionado
    while (digitalRead(pinoBotao) == LOW) 
    {
       delay(10); 
    }
    
    // Pequeno respiro após o aluno soltar o botão
    delay(50); 
  }

  // A tela reage apenas à variável, e não mais diretamente ao botão
  lcd.setCursor(0, 1); 
  
  if (sistemaLigado == true) 
  {
    lcd.print(">> LIGADO <<"); 
  } 
  else 
  {
    lcd.print(">> DESLIGADO <<"); 
  }
}