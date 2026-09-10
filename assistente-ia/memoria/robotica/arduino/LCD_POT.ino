#include <BitBang_LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2, 18, 19); 
int pinoPot = A0;

void setup() {
  lcd.begin(); //Inicia o LCD
  lcd.backlight(); //Liga as luzes do LCD
  -
  lcd.setCursor(0, 0); //Define a primeira linha do LCD (0,0), a segunda linha seria (0,1)
  lcd.print("Forca do Sinal:");
}

void loop() {
  // Lê o potenciômetro e converte a escala de 0-1023 para 0-100%
  int valor = map(analogRead(pinoPot), 0, 1023, 0, 100);
  
  lcd.setCursor(0, 1);  //Define a segunda linha do LCD
  lcd.print(valor); //Escreve o valor lido do potenciômetro no LCD

  // Imprime espaços para "apagar" os números fantasmas antigos
  lcd.print("%   "); 
  
  delay(100); 
}

/*
int -> numeros inteiros
float -> numeros com vírgula
string -> letras "jdfckljsdbgkjrsdhb"
bool -> liga/desliga

int batatinha = 0;
string batatinha2 = "0";
float batatinha3 = 0.0;

*/