;**************************************************************
;*                                                            *
;*      Welcome To 6502 8-Bits Computer Emulator:             *
;*                                                            *
;**************************************************************
;
; System Vector Locations
NMI     = $FFFA ; non maskable interrupt address
RESB    = $FFFC ; restart address
IRQ     = $FFFE ; interrupt address

PORTB   = $6000 ; via port B address
PORTA   = $6001 ; via port A address
DDRB    = $6002 ; via port B In/Out Mode address
DDRA    = $6003 ; via port A In/Out Mode address

IFR     = $600d ; via Interrupt Flag Register
IER     = $600e ; via Interrupt Enable Register

PROG    = $8000 ; program origin

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