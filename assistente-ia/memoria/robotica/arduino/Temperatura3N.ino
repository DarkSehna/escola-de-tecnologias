#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define LED_VERDE 8
#define LED_VERMELHO 9

float LIMITE = 25.0;

void setup() {
  Serial.begin(9600);
  dht.begin();
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);
  Serial.println("=== Estacao de Temperatura ===");
}

void loop() {
  delay(1500);
  float t = dht.readTemperature();

  if (isnan(t)) {
    Serial.println("Erro ao ler o sensor!");
    return;
  }

  Serial.print("Temperatura: ");
  Serial.print(t);
  Serial.print(" °C   ");

  if (t >= LIMITE) {
    digitalWrite(LED_VERMELHO, HIGH);
    digitalWrite(LED_VERDE, LOW);
    Serial.println("-> ACIMA do limite!");
  } else {
    digitalWrite(LED_VERMELHO, LOW);
    digitalWrite(LED_VERDE, HIGH);
    Serial.println("-> ABAIXO do limite.");
  }
}
