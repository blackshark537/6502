;**************************************************************
;*                                                            *
;*        AUTHOR  : Berlys Santos Cruz                        *
;*                                                            *
;*        32 Kilobytes of ROM Max                             *
;*        COMMANDS COMVENTIONS:                               *
;*        .byte save some bytes at compile time.              *
;*        .word save two bytes at compile time.               *
;*        .org  set address at compile time.                  *
;*        .addr get a label address.                          *
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

.org PROG
RESTART:
    
    ; SET PORTA AS OUTPUT
    LDA #%11111111
    STA DDRA

    ; CLEAR PORTA
    LDA #$00
    STA PORTA

    ; CREATE A VARIABLE
    COUNT = $01

; INCREMENT PORTA IN AN INFINITE LOOP
LOOP:
    LDA COUNT
    STA PORTA
    INC COUNT
    JMP LOOP

.org RESB
.addr RESTART 