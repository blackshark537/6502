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

.org PROG
RESTART:
; CODE HERE
LDA #%11100000
STA DDRA
LDA #%11111111
STA DDRB

CLI ; ENEABLE INTERRUPT

JSR LCD_ON
JSR LCD_ENTRY
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

DELAY:
    LDY #00
@REPEAT:
    INY
    NOP
    TYA
    CMP #03
    BNE @REPEAT
    RTS

LCD_ENTRY:
    LDA #%00000111
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
    RTS

LCD_ON:
    LDA #%00001110
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
    RTS

LCD_HOME:
    LDA #%00000010
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
    RTS

LCD_CLR:
    LDA #%00000001
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
    RTS

CURSOR_R:
    LDA #%00000110
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
    RTS
  
CURSOR_L:
    LDA #%00000100
    STA PORTB
    LDA E
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
    RTS

PRINT:
    STA PORTB
    LDA E
    ORA RS
    STA PORTA
    LDA #$00
    STA PORTA
    JSR DELAY
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
    LDA #$20
    JSR PRINT
    JSR CURSOR_R
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
.byte "Connect a Keyboard    "

.org NMI
.addr IRQ_HANDLER
.addr RESTART
.addr IRQ_HANDLER