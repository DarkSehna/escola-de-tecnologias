#!/usr/bin/env python3


from time import perf_counter, sleep

from ev3dev2.motor import MoveTank, OUTPUT_B, OUTPUT_C, SpeedPercent
from ev3dev2.sensor import INPUT_3, INPUT_2
from ev3dev2.sensor.lego import ColorSensor

# Valores de calibragem RGB para o verde.
# Rode calibrar.py, pegue o RGB do verde e ajuste esses valores.
GREEN_THRESHOLD = 60  # valor mínimo do canal G
GREEN_MARGIN = 25     # quanto G deve ser maior que R e B

# Velocidades de movimento para OBR.
BASE_SPEED = 45       # velocidade de cruzeiro do seguidor de linha
TURN_SPEED = 40       # velocidade usada para fazer curvas em verde

# Parâmetros PID básicos. Ajuste se necessário.
KP = 3.0
KI = 0.0
KD = 0.0

def clamp_speed(value):
    return max(min(value, 100), -100)

# declara

#lembra de mudar
class PIDLineFollower:
    def __init__( 
        self,
        lm=OUTPUT_C, 
        rm=OUTPUT_B, 
        ls=INPUT_3,
        rs=INPUT_2,
        base=BASE_SPEED,
        kp=KP,
        ki=KI,
        kd=KD,
    ):
        #inicializa os bagui
        self.tank = MoveTank(lm, rm)
        self.ls = ColorSensor(ls)
        self.rs = ColorSensor(rs)
        self.base_speed = base
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.last_error = 0.0
        self.integral = 0.0
        self.last_time = None
# nome das coencxoes lm = motor esquerdo rm = motor direito ls = sensor esquerdo rs = sensor direito
# alg pfv me lembra de calibrar os bagui pid kp ki kd 
    def stop(self):
        self.tank.off()

    def follow_line(self, runtime=None):
        self.last_time = perf_counter()
        self.last_error = 0.0
        self.integral = 0.0
        start_time = perf_counter()
        # seguidor de linha pid 

        try:
            while True:
                if runtime is not None and perf_counter() - start_time >= runtime:
                    break
                
     
                try:
                    rgb_l = self.ls.rgb
                    rgb_r = self.rs.rgb
                except (OSError, AttributeError):
                    continue
                
                # Lógica do verde usando RGB direto
                # Use o canal verde: rgb_x[1] é o valor de verde.
                # Ajuste GREEN_THRESHOLD e GREEN_MARGIN com base no calibrar.py.
                # Exemplo: se o verde for RGB=(30, 70, 40), sugerimos:
                # threshold = 70 - 10 = 60
                # margin = 70 - max(30, 40) - 5 = 25

                
                verde_esq = (
                    rgb_l[1] > GREEN_THRESHOLD
                    and rgb_l[1] > rgb_l[0] + GREEN_MARGIN
                    and rgb_l[1] > rgb_l[2] + GREEN_MARGIN
                )
                verde_dir = (
                    rgb_r[1] > GREEN_THRESHOLD
                    and rgb_r[1] > rgb_r[0] + GREEN_MARGIN
                    and rgb_r[1] > rgb_r[2] + GREEN_MARGIN
                )

                if verde_esq and verde_dir:
                    self.tank.on_for_degrees(SpeedPercent(TURN_SPEED), SpeedPercent(-TURN_SPEED), 600)  # Meia volta
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue
                elif verde_esq:
                    self.tank.on_for_degrees(SpeedPercent(-TURN_SPEED), SpeedPercent(TURN_SPEED), 300)  # 90 graus para esquerda
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue
                elif verde_dir:
                    self.tank.on_for_degrees(SpeedPercent(TURN_SPEED), SpeedPercent(-TURN_SPEED), 300)  # 90 graus para direita
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue

                lm = (rgb_l[0] + rgb_l[1] + rgb_l[2]) / 3
                rm = (rgb_r[0] + rgb_r[1] + rgb_r[2]) / 3
                
                
                error = lm - rm
                now = perf_counter()
                
                dt = now - self.last_time if (now - self.last_time) > 0.001 else 0.01

                derivative = (error - self.last_error) / dt
                self.integral += error * dt
                self.integral = max(min(self.integral, 100), -100)  
                correction = self.kp * error + self.ki * self.integral + self.kd * derivative

                leftspeed = clamp_speed(self.base_speed + correction)
                rightspeed = clamp_speed(self.base_speed - correction)

                self.tank.on(SpeedPercent(leftspeed), SpeedPercent(rightspeed))

                self.last_error = error
                self.last_time = now
         
        finally:
            self.stop()

follower = PIDLineFollower()
follower.follow_line()
# obs lembrar de mudar em cima os bagulho
