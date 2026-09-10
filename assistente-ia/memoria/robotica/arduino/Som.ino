int pinoSom = 7;   // entrada digital do sensor
int led = 8;       // saída para o LED
int pinoSomAnalog = A1;

void setup() 
{
  pinMode(pinoSom, INPUT);
  pinMode(led, OUTPUT);
  Serial.begin(9600);
  Serial.println("Iniciando sensor de som...");
}

void loop() 
{
  int som = digitalRead(pinoSom); // lê o pino D0 (0 = silêncio, 1 = som detectado)
  int valor = analogRead(pinoSomAnalog); 
  screver();
  verificarSom();
  delay(100); // pequeno atraso pra estabilidade
}




void escrever()
{
  Serial.print("Leitura do sensor: ");
  Serial.println(som);  // imprime o valor (0 ou 1) e pula linha
  Serial.println(valor);
}

void verificarSom()
{
  if (som == HIGH) 
  {
    digitalWrite(led, HIGH); // acende o LED
    Serial.println("Som detectado!");
    delay(300); // LED fica aceso um tempinho
    digitalWrite(led, LOW);
  } 
  else 
  {
    digitalWrite(led, LOW);
  }
}