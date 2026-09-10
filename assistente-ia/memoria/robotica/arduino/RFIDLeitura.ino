#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9

MFRC522 leitorRFID(SS_PIN, RST_PIN); 

void setup() {
  Serial.begin(9600);
  SPI.begin();           
  leitorRFID.PCD_Init(); 
  
  Serial.println("--- SISTEMA DE LEITURA ATIVADO ---");
  Serial.println("Aproxime a tag ou o cartao do leitor...");
}

void loop() {
  // 1. Verifica se tem algum cartão encostando na antena
  if ( ! leitorRFID.PICC_IsNewCardPresent()) {
    return; // Se não tiver, ele recomeça o loop silenciosamente
  }
  
  // 2. Se encostou, ele tenta puxar o número de série (UID)
  if ( ! leitorRFID.PICC_ReadCardSerial()) {
    return; // Se der erro na leitura rápida, recomeça
  }

  // 3. Se passou pelos dois IFs acima... É SUCESSO!
  Serial.print(">>> CARTAO DETECTADO! UID: ");
  
  // Esse For pega os pedaços de memória e transforma em Hexadecimal
  for (byte i = 0; i < leitorRFID.uid.size; i++) {
     Serial.print(leitorRFID.uid.uidByte[i] < 0x10 ? " 0" : " ");
     Serial.print(leitorRFID.uid.uidByte[i], HEX);
  }
  
  Serial.println(); // Pula uma linha para ficar bonito no monitor
  
  // Uma pausa de 1 segundo para não ler o mesmo cartão 50 vezes no mesmo encostão
  delay(1000); 
}