#include <BitBang_LiquidCrystal_I2C.h>

// Criamos três "tentativas" usando os únicos 3 endereços padrão de fábrica.
// Mantenha os pinos 18 e 19, ou troque para os que você está usando na montagem.
LiquidCrystal_I2C lcdA(0x27, 16, 2, 18, 19); 
LiquidCrystal_I2C lcdB(0x3F, 16, 2, 18, 19);
LiquidCrystal_I2C lcdC(0x20, 16, 2, 18, 19);

void setup() {
  
  // TENTATIVA 1: Bate na porta do 0x27
  // Se a placa for 0x27, ela acorda e escreve. Se não for, o Arduino fala com o vazio e segue.
  lcdA.begin();
  lcdA.backlight();
  lcdA.setCursor(0, 0);
  lcdA.print("ENDERECO: 0x27");

  // TENTATIVA 2: Bate na porta do 0x3F
  lcdB.begin();
  lcdB.backlight();
  lcdB.setCursor(0, 0);
  lcdB.print("ENDERECO: 0x3F");

  // TENTATIVA 3: Bate na porta do 0x20
  lcdC.begin();
  lcdC.backlight();
  lcdC.setCursor(0, 0);
  lcdC.print("ENDERECO: 0x20");
}

void loop() {
  // Fica vazio. A tela vai ficar travada exibindo qual é o endereço correto dela!
}