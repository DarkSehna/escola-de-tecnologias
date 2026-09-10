#!/usr/bin/env python3
from ev3dev2.sensor import INPUT_1, INPUT_2, INPUT_3
from ev3dev2.sensor.lego import ColorSensor, GyroSensor
from ev3dev2.button import Button
from time import sleep

def calibrate():
    btn = Button()
    ls = ColorSensor(INPUT_3)
    rs = ColorSensor(INPUT_2)
    gyro = GyroSensor(INPUT_1)
    
    print("--- MODO CALIBRACAO ---")
    print("bota os sensores no BRANCO ")
    btn.wait_for_bump()
    w_l = ls.reflected_light_intensity
    w_r = rs.reflected_light_intensity
    
    print("bota os sensores no PRETO ")
    btn.wait_for_bump()
    b_l = ls.reflected_light_intensity
    b_r = rs.reflected_light_intensity
    
    print("bota os sensores no VERDE ")
    btn.wait_for_bump()
    g_l = ls.reflected_light_intensity
    g_r = rs.reflected_light_intensity
    g_l_rgb = ls.rgb
    g_r_rgb = rs.rgb
    
    print("calibra o vermelho")
    btn.wait_for_bump()
    r_l = ls.reflected_light_intensity
    r_r = rs.reflected_light_intensity
    r_l_rgb = ls.rgb
    r_r_rgb = rs.rgb
    
    def suggest_threshold(rgb):
        g = rgb[1]
        best_other = max(rgb[0], rgb[2])
        threshold = max(0, g - 10)
        margin = max(5, g - best_other - 5)
        return threshold, margin

    left_threshold, left_margin = suggest_threshold(g_l_rgb)
    right_threshold, right_margin = suggest_threshold(g_r_rgb)

    print("\n--- RESULTADOS ---")
    print(f"LEFT: Preto={b_l}, Branco={w_l}, Verde={g_l} (RGB={g_l_rgb}), Vermelho={r_l} (RGB={r_l_rgb})")
    print(f"RIGHT: Preto={b_r}, Branco={w_r}, Verde={g_r} (RGB={g_r_rgb}), Vermelho={r_r} (RGB={r_r_rgb})")
    print(f"\nSUGESTAO VERDE ESQ: threshold={left_threshold}, margin={left_margin}")
    print(f"SUGESTAO VERDE DIR: threshold={right_threshold}, margin={right_margin}")
    
   
    mid_l = (w_l + b_l) / 2
    mid_r = (w_r + b_r) / 2
    print(f" esquerda={mid_l:.1f}, direita={mid_r:.1f}")
    
    print("\ndiquinha de pro: se o pid ficar lento, tente usar apenas a leitura de intensidade para tudo")
    
    print("\nCalibrating gyroscope...")
    gyro.calibrate()
    sleep(1)
    print("giroscopio calibrado, valor inicial:", gyro.angle)
    
    while not btn.any():
        sleep(0.1)
calibrate()
