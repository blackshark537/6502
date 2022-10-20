;**************************************************************
;*                                                            *
;*      Welcome To 6502 8-Bits Computer Emulator:             *
;*                                                            *
;**************************************************************

; System Vector Locations
NMI     = $FFFA ; Non Maskable Interrupt Vector Address
RESB    = $FFFC ; Restart Vector Address
IRQ     = $FFFE ; Interrupt Request Vector Address

PORTB   = $6000 ; Via Port B address.
PORTA   = $6001 ; Via Port A address.
DDRB    = $6002 ; Via Port B Mode 0 is input 1 is Output.
DDRA    = $6003 ; Via Port A Mode 0 is input 1 is Output.

IFR     = $600d ; Via Interrupt Flag Register.
IER     = $600e ; Via Interrupt Enable Register.

PROG    = $8000 ; Program Rom Origin.

E        = #%10000000
RS       = #%00100000

COUNT   = $00

.org PROG
RESTART:
; CODE HERE
LDA #%11100000
STA DDRA
LDA #%11111111
STA DDRB

CLI ; ENEABLE INTERRUPT

JSR LCD_ON
JSR LCD_CLR
JSR LCD_HOME
LDX #$00
JMP @LOOP

@LOOP:
    LDA $200,X
    JSR PRINT
    JSR NEXT
    INX
    TXA
    CMP #16
    BNE @LOOP
    ;JMP RESTART
    


LCD_ON:
    LDA #%00001100
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    RTS

LCD_HOME:
    LDA #%00000010
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    RTS

LCD_CLR:
    LDA #%00000001
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    RTS

NEXT:
    LDA #%00000110
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    RTS

PRINT:
    STA PORTB
    LDA E
    ORA RS
    STA PORTA
    LDA #$00
    STA PORTA
    RTS

.org $200
.byte "HELLO WORLD"

.org RESB
.addr RESTART