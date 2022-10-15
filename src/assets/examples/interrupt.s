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

PORTB   = $6000 ; port B address
PORTA   = $6001 ; port A address
DDRB    = $6002 ; port B In/Out Mode address
DDRA    = $6003 ; port A In/Out Mode address

IFR     = $600d ; Interrupt Flag Register
IER     = $600e ; Interrupt Enable Register
PROG    = $8000 ; program origin

.org PROG
restart:
    ; eneable interrupts
    lda #$f0
    sta IER
    sta IFR
    cli
    
    ; setting variables
    COUNT = $00

    ; set ports A and B as outputs
    lda #%11111111
    sta DDRB
    sta DDRA

    lda #$01
    sta COUNT
    lda #$50
    jmp loop

; function to execute when an interrupts occur
irq_handler:
    pha

    lda COUNT
    sta PORTB
    inc COUNT

    pla
    rti

; function shift to the left
shift_l:
    rol
    rts

; infinity loop
loop:
    jsr shift_l
    sta PORTA
    jmp loop 

; setting interrrupt address of function handler
.org IRQ
.addr irq_handler 

; setting non maskable interrupt address of function handler
.org NMI
.addr irq_handler

.org RESB
.addr restart