#pragma once
constexpr int A0=14,A1=15,A2=16,A3=17,A4=18,A5=19;
constexpr int INPUT=0,OUTPUT=1,INPUT_PULLUP=2,HIGH=1,LOW=0;
void pinMode(int,int);void digitalWrite(int,int);int digitalRead(int);int analogRead(int);void analogWrite(int,int);void delay(unsigned long);
