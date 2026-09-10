#!/usr/bin/env python3


from time import perf_counter, sleep

from ev3dev2.motor import MoveTank, OUTPUT_B, OUTPUT_C, SpeedPercent
from ev3dev2.sensor import INPUT_1, INPUT_2, INPUT_3, INPUT_4
from ev3dev2.sensor.lego import ColorSensor, UltrasonicSensor, GyroSensor
# se eu for mudar aqueles negocios tbm tenho q mudar aq

def clamp_speed(value):
    return max(min(value, 100), -100)

# declara os bagui

#lembra de mudar isso se for mudar as conecxoes
class PIDLineFollower:
    def __init__( 
        self,
        lm=OUTPUT_C, 
        rm=OUTPUT_B,
        ls=INPUT_3,
        rs=INPUT_2,
        us=INPUT_4,
        gs=INPUT_1,
        base=100,
        kp=3.0,
        ki=0.0,
        kd=1.0,
    ):
        # Inicializa tudo
        self.tank = MoveTank(lm, rm)
        self.ls = ColorSensor(ls)
        self.rs = ColorSensor(rs)
        self.us = UltrasonicSensor(us)
        self.gyro = GyroSensor(gs)
        self.gyro.calibrate()  
       
        self.base_speed = base
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.last_error = 0.0
        self.integral = 0.0
        self.last_time = perf_counter()
# nome das conecxoes lm = motor esquerdo rm = motor direito ls = sensor esquerdo rs = sensor direito
# alg pfv me lembra de calibrar o pid kp ki kd 
    def stop(self):
        self.tank.off()

    def turn_degrees(self, degrees, speed=40):
        try:
            initial_angle = self.gyro.angle
            target_angle = initial_angle + degrees
            direction = 1 if degrees > 0 else -1
            self.tank.on(SpeedPercent(-speed * direction), SpeedPercent(speed * direction))
            while True:
                current_angle = self.gyro.angle
                if abs(current_angle - target_angle) <= 2:
                    break
                sleep(0.01)
            self.tank.off()
        except (OSError, AttributeError):
          
            self.tank.on_for_degrees(SpeedPercent(40), SpeedPercent(-40), abs(degrees) * 2)

    def desviar_obstaculo(self):
        self.stop()
        sleep(0.01)
        
      
        self.turn_degrees(90)
        
   
        self.tank.on_for_degrees(SpeedPercent(40), SpeedPercent(40), 500)
        
      
        self.turn_degrees(-90)
        
     
        self.tank.on_for_degrees(SpeedPercent(40), SpeedPercent(40), 800)
        
   
        self.turn_degrees(-90)
        
    
        self.tank.on(SpeedPercent(30), SpeedPercent(30))
        start_time = perf_counter()
        while perf_counter() - start_time < 5:  
            left_avg = sum(self.ls.rgb) / 3
            right_avg = sum(self.rs.rgb) / 3
            if left_avg <= 40 and right_avg <= 40:  
                break
            sleep(0.01)
        self.stop()
        
        self.turn_degrees(90) 

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
                    if self.us.distance_centimeters < 10:
                        self.desviar_obstaculo()
                        self.last_time = perf_counter()
                        self.last_error = 0.0
                        self.integral = 0.0
                        continue
                except (OSError, AttributeError):
                    pass 
                try:
                    rgb_l = self.ls.rgb
                    rgb_r = self.rs.rgb
                except (OSError, AttributeError):
                    continue

                # Logica do Verdola
                verde_esq = rgb_l[1] > rgb_l[0] * 1.2 and rgb_l[1] > rgb_l[2]
                verde_dir = rgb_r[1] > rgb_r[0] * 1.2 and rgb_r[1] > rgb_r[2]

                if verde_esq and verde_dir:
                    self.turn_degrees(180) 
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue
                elif verde_esq:
                    self.turn_degrees(-90) 
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue
                elif verde_dir:
                    self.turn_degrees(90)
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue

       
                #
                
                verde_esq = rgb_l[1] > rgb_l[0] * 1.2 and rgb_l[1] > rgb_l[2]
                verde_dir = rgb_r[1] > rgb_r[0] * 1.2 and rgb_r[1] > rgb_r[2]

                if verde_esq and verde_dir:
                    self.tank.on_for_degrees(SpeedPercent(40), SpeedPercent(-40), 600) # Meia volta
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue
                elif verde_esq:
                    self.tank.on_for_degrees(SpeedPercent(-40), SpeedPercent(40), 300) # 90 graus para esquerda
                    self.last_time = perf_counter()
                    self.last_error = 0.0
                    self.integral = 0.0
                    continue
                elif verde_dir:
                    self.tank.on_for_degrees(SpeedPercent(40), SpeedPercent(-40), 300) # 90 graus para direita
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
                sleep(0.001)  
            
           
             
        finally:
            self.stop()

follower = PIDLineFollower()
 # no caso se quiser por um tempo
    #try:
  #      follower.follow_line(runtime=30)  # Segue o negocio por 30 seg só trocar ali
follower.follow_line()
# obs lembrar de mudar em cima os ngc
