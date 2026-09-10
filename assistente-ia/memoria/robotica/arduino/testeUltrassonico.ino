// Função para medir a distância usando um sensor ultrassônico
long readUltrasonicDistance(int triggerPin, int echoPin) {
  pinMode(triggerPin, OUTPUT);
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);

  pinMode(echoPin, INPUT);
  return pulseIn(echoPin, HIGH);
}

void setup() {
  Serial.begin(9600); // Inicializa o monitor serial

  // Configura os pinos como saída
  pinMode(4, OUTPUT); // LED 1
  pinMode(3, OUTPUT); // LED 2
  pinMode(2, OUTPUT); // LED 3
  pinMode(5, OUTPUT); // Buzzer
}

void loop() {
  // Faz a leitura apenas uma vez por loop
  long duration = readUltrasonicDistance(6, 7);
  float distance = duration * 0.01723;

  // Mostra a distância no Monitor Serial
  Serial.print("Distância: ");
  Serial.print(distance);
  Serial.println(" cm");

  // Primeiro Led
  if (distance < 30) 
  {
    digitalWrite(4, HIGH); 
  } 
  else 
  {
    digitalWrite(4, LOW);
  }
  
  // Segundo Led
  if (distance < 20) 
  {
    digitalWrite(3, HIGH); 
  } 
  else 
  {
    digitalWrite(3, LOW);
  }
  
  // Terceiro Led
  if (distance < 10) 
  {
    digitalWrite(2, HIGH);
  } 
  else 
  {
    digitalWrite(2, LOW);
  }
  
  // Buzzer
  if (distance < 5) 
  {
    tone(5, 523, 1000); // Toca som C5
  } else {
    noTone(5);
  }
  
  delay(200);
}
