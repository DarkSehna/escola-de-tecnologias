// ==========================================
// CONFIGURAÇÕES INICIAIS
// ==========================================
int pinoBotao = 2; // O botão mágico ligado direto no GND
int pinoPot = A0;  // O dial do nosso cofre

// A senha secreta do cofre (A combinação vencedora)
int senha1 = 3;
int senha2 = 7;
int senha3 = 9;

// Onde vamos guardar os "chutes" do jogador
int tentativa1 = 0;
int tentativa2 = 0;
int tentativa3 = 0;

// A nossa Máquina de Estados (1 = primeira catraca, 2 = segunda, 3 = terceira)
int estadoCofre = 1; 


// ==========================================
// A NOSSA FUNÇÃO (O equivalente ao 'def' do Python)
// ==========================================
void salvarTentativa(int valorLido, int estadoAtual) {
  
  // O switch/case agindo como o trilho do trem para guardar a variável certa
  switch (estadoAtual) {
    case 1:
      tentativa1 = valorLido;
      Serial.print(">>> Catraca 1 TRAVADA no numero: ");
      Serial.println(tentativa1);
      break;
    case 2:
      tentativa2 = valorLido;
      Serial.print(">>> Catraca 2 TRAVADA no numero: ");
      Serial.println(tentativa2);
      break;
    case 3:
      tentativa3 = valorLido;
      Serial.print(">>> Catraca 3 TRAVADA no numero: ");
      Serial.println(tentativa3);
      break;
  }
}

// ==========================================
// SETUP E LOOP
// ==========================================
void setup() {
  Serial.begin(9600);
  
  // O truque de mestre: liga o resistor interno do Arduino!
  pinMode(pinoBotao, INPUT_PULLUP); 
  
  Serial.println("--- SISTEMA DE SEGURANCA ATIVADO ---");
  Serial.println("Gire o potenciometro para escolher e aperte o botao para confirmar.");
  Serial.println("------------------------------------");
}

void loop() 
{
  // 1. Lê a "sujeira" de 0 a 1023 e converte num visor limpo de 0 a 9
  int numeroDoCofre = map(analogRead(pinoPot), 0, 1023, 0, 9);
  
  // Imprime o número atual para o aluno ver o visor girando
  Serial.print("Visor: ");
  Serial.println(numeroDoCofre);
  
  // 2. Se o botão for apertado (Lembre-se: no PULLUP, apertado é LOW)
  if (digitalRead(pinoBotao) == LOW) 
  {
    
    // Chama a nossa função passando os parâmetros do momento
    salvarTentativa(numeroDoCofre, estadoCofre);
    
    // Avança o estado do jogo
    estadoCofre++; 
    
    // 3. O GRANDE IF: Se já passamos da terceira catraca, confere a senha!
    if (estadoCofre > 3) 
    {
      Serial.println(" ");
      Serial.println("--- VERIFICANDO SENHA ---");
      delay(1000); // Um suspense dramático de 1 segundo
      
      if (tentativa1 == senha1 && tentativa2 == senha2 && tentativa3 == senha3) 
      {
        Serial.println("[ ACESSO LIBERADO! Cofre Aberto. ]");
      } 
      else 
      {
        Serial.println("[ ACESSO NEGADO! Senha Incorreta. ]");
      }
      
      // Zera a máquina de estados para recomeçar a brincadeira
      estadoCofre = 1; 
      Serial.println("------------------------------------");
      Serial.println("Cofre resetado. Tente novamente.");
    }
    
    // O delay de "debounce" para o dedo não registrar 5 cliques num milissegundo
    delay(400); 
  }
  
  // Um pequeno delay no loop geral só para a tela não rolar na velocidade da luz
  delay(150); 
}