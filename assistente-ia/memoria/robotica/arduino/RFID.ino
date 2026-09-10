#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9

MFRC522 leitorRFID(SS_PIN, RST_PIN); 

void setup() {
  Serial.begin(9600);
  
  // Esse while segura o Arduino até você abrir a tela do Monitor Serial, 
  // para garantir que você não perca a mensagem.
  while (!Serial); 
  
  SPI.begin();           
  leitorRFID.PCD_Init(); 
  
  Serial.println("--- INICIANDO TESTE DE FOGO DO FIRMWARE ---");
  
  // A linha mágica que faz o diagnóstico da placa:
  leitorRFID.PCD_DumpVersionToSerial();
  
  Serial.println("-------------------------------------------");
}

void loop() 
{
  // A linha mágica que faz o diagnóstico da placa:
  leitorRFID.PCD_DumpVersionToSerial();
  delay(1000);
}

/*
SDA - 10
SCK - 13
MOSI - 11
MISO -  12
IRQ - SOLTO
GND - GND
RST - 9
3.3V - 3.3V
*/