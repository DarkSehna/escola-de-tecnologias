/*#include <DHT.h>

// === Configurações do DHT11 ===
#define DHTPIN 3       // pino digital conectado ao DATA do DHT11
#define DHTTYPE DHT22  // tipo de sensor

DHT dht(DHTPIN, DHTTYPE);

// === LEDs ===
#define LED_VERDE 8
#define LED_VERMELHO 9

// Limite de temperatura (°C)
float LIMITE_TEMP = 25.0;

void setup() {
  Serial.begin(9600);
  dht.begin();

  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);

  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_VERMELHO, LOW);

  Serial.println("Iniciando leitura do DHT11...");
}

void loop() {
  // O DHT11 é um pouco lento, precisa de 1-2 segundos entre leituras
  delay(200);

  float t = dht.readTemperature(true);  // temperatura em Celsius

  // Se falhar a leitura
  if (isnan(t)) {
    Serial.println("Falha ao ler o DHT11! Verifique as conexões.");
    return;
  }

  Serial.print("Temperatura: ");
  Serial.print(t, 1);
  Serial.println(" °C");

  // Verifica a condição e acende o LED correto
  if (t < LIMITE_TEMP) {
    digitalWrite(LED_VERMELHO, HIGH);
    digitalWrite(LED_VERDE, LOW);
  } else {
    digitalWrite(LED_VERMELHO, LOW);
    digitalWrite(LED_VERDE, HIGH);
  }
}
*/