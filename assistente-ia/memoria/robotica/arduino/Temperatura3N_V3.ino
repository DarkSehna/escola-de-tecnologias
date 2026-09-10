/*#include <DHT.h>

// === Configurações do DHT11 ===
#define DHTPIN 2       // pino digital conectado ao DATA do DHT11
#define DHTTYPE DHT11  // tipo de sensor

DHT dht(DHTPIN, DHTTYPE);

// === LEDs ===
#define LED_VERDE 8
#define LED_VERMELHO 9

// Limite de temperatura (°C)
float LIMITE_TEMP = 25.0;
float limite = 25.0;


void setup() {
  Serial.begin(9600);
  dht.begin();

  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);

  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_VERMELHO, LOW);

  Serial.println("Iniciando leitura do DHT11...");

  Serial.println("Digite novo limite em °C e pressione ENTER (ex: 26.5)");
}

void loop() {
  // O DHT11 é um pouco lento, precisa de 1-2 segundos entre leituras
  delay(2000);

  if (Serial.available()) {
    limite = Serial.parseFloat();
    if (limite > -40 && limite < 80) {
      Serial.print("Novo limite: ");
      Serial.println(limite, 1);
    }
    while (Serial.available()) Serial.read(); // limpa buffer
  }

  float t = dht.readTemperature(); // temperatura em Celsius

  // Se falhar a leitura
  if (isnan(t)) 
  {
    Serial.println("Falha ao ler o DHT11! Verifique as conexões.");
    return;
  }

  Serial.print("Temperatura: ");
  Serial.print(t, 1);
  Serial.println(" °C");

    // janelinha de 0,5 °C
  const float T_HIGH = 25.0;
  const float T_LOW  = 24.5;
  static bool quente = false;

  if (!quente && t >= T_HIGH) quente = true;
  else if (quente && t <= T_LOW) quente = false;

  digitalWrite(LED_VERMELHO, quente ? HIGH : LOW);
  digitalWrite(LED_VERDE,    quente ? LOW  : HIGH);
}
*/