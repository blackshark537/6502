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