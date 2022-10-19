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
LDY #$0B
LDX #$00
    
@MSG:
    LDA $8F00,X
    JSR PRINT
    INX
    TXA
    CMP #20
    BNE @MSG
    JSR LCD_CLR
    JSR LCD_HOME
    JMP LOOP

LOOP:
    NOP
    JMP LOOP

LCD_ON:
    LDA #%00001110
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

CURSOR_R:
    LDA #%00000110
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    RTS
  
CURSOR_L:
    LDA #%00000100
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
    ;JSR CURSOR_R
    RTS


IRQ_HANDLER:
    ; read key
    LDA #%00000000 ;portb as input
    STA DDRB
    LDX PORTB
    LDA #%11111111 ; portb as output
    STA DDRB

    ; IF KEYCODE == #$08
@DELETE:
    TXA
    CMP #$08
    BNE @HOME
    JSR CURSOR_L
    RTI

@HOME:
    TXA
    CMP #$C0
    BNE @CONTINUE
    JSR LCD_HOME
    JSR LCD_CLR
    RTI

@CONTINUE:
    TXA
    JSR PRINT
    RTI

.org $8F00
.byte "Type Something.     "

.org NMI
.addr IRQ_HANDLER
.addr RESTART
.addr IRQ_HANDLER