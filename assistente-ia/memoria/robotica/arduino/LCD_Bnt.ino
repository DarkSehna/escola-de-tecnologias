#include <BitBang_LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2, 18, 19);
int pinoBotao = 2;

void setup() 
{
  lcd.begin();
  lcd.backlight();
  
  // Ativa o resistor interno do Arduino
  pinMode(pinoBotao, INPUT_PULLUP);
  
  lcd.setCursor(0, 0);
  lcd.print("Status da Maquina");
}

void loop() 
{
  lcd.setCursor(0, 1); 
  
  // Se o botão for pressionado, a energia cai para GND (LOW)
  if (digitalRead(pinoBotao) == LOW) 
  {
    lcd.print(">> LIGADO <<"); 
  } 
  else 
  {
    lcd.print(">> DESLIGADO <<"); 
  }
  
  delay(50); 
}


/*
resenha = 7
IF (resenha < 10 && resenha > 5)
{
  A resenha é absoluta;
}

IF (resenha < 10)
{
  IF (resenha > 5)
  {
    A resenha é absoluta;
  }
}


 == -> comparando (um é igual ao outro?)
 =  -> afirmando (um é o outro)


>  -> Maior (um é maior que o outro)
<  -> Menor(um é menor que o outro)

>= -> Maior ou igual (um é maior OU igual ao outro)
<= -> Menor ou igual (um é menor OU igual ao outro)
=/ -> Diferente (um é diferente do outro)

&& -> E (um E o outro)
|| -> OU (um OU o outro)


int -> inteiro      int numero = 0;
float -> numeros flutuantes (numero com virgula) float numero = 0.1;
bool -> booleano (verdadeiro ou falso) bool resenha = true;
string -> letra "" string resenha = "A resenha é absoluta!!"




*/