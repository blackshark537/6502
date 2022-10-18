import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MonacoEditorService } from 'src/app/Core';
import { first } from 'rxjs/operators';
import { MonacoEditor, MonacoEditorOptions } from 'ng-monaco-editor';
import { MemoryService } from 'src/app/Core';
import { AssemblerService } from 'src/app/Assembler';
import { ToastController } from '@ionic/angular';

declare var monaco: any;

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
})
export class CodeComponent implements OnInit, AfterViewInit {
  source: string = `
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
    ;JSR NEXT
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
.byte "8-Bits Computer.  "

.org RESB
.addr RESTART
`;

  title: string = 'CODE';
  code: string = '';
  isSource: boolean = true;
  options: MonacoEditorOptions = {
    theme: 'myCoolTheme',//'vs-dark',
    language: 'asm',
    value: this.source,
    automaticLayout: true,
  };

  public _editor: MonacoEditor;
  @ViewChild('editorContainer', { static: true }) _editorContainer: ElementRef;

  constructor(
    private toastCtrl: ToastController,
    private monacoEditorService: MonacoEditorService,
    private buffer: MemoryService,
    private assembler: AssemblerService
  ) { }

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    this.monacoEditorService.load();
    this.initMonaco();
  }

  private initMonaco(): void {
    if (!this.monacoEditorService.loaded) {
      this.monacoEditorService.loadingFinished.pipe(first()).subscribe(() => {
        this.initMonaco();
      });
      return;
    }

    monaco.languages.register({id: 'asm'});
    monaco.languages.setMonarchTokensProvider('asm', {
      tokenizer: {
        root: [
          [/\=/, 'assignment'],
          [/\;.*/, 'comment'],
          [/\".*/, 'string'],
          //[/\"[a-zA-Z0-9].*\"/, 'comment'],

          [/\$[0-9a-zA-Z]\w+/, 'values'],
          [/\#[0-9a-zA-Z]\w+/, 'values'],
          [/\#%[0-9]\w+/, 'values'],
          [/\%[0-9]\w+/, 'values'],
          [/\#/, 'values'],
          [/\$/, 'values'],
          [/\%/, 'values'],
          [/[0-9]\w+/, 'values'],

          [/[A-Za-z].*\:/, 'labels'],
          [/@[A-Za-z].*\:/, 'labels'],

          [/\.\w+/, 'command'],
          [/\./, 'command'],

          [/\w+/, 'instruction'],
        ]
      }
    });
    monaco.editor.defineTheme('myCoolTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'assignment', foreground: 'fefefe' },
        { token: 'values', foreground: 'ff9009' },
        { token: 'variables', foreground: '8edbff' },
        { token: 'instruction', foreground: '8edbff' },
        { token: 'command', foreground: 'eb445a', fontStyle: 'bold' },
        { token: 'comment', foreground: '2dd36f' },
        { token: 'string', foreground: 'ffca22' },
        { token: 'labels', foreground: 'fefefe' }
      ],
      colors: {
      }
    });
    
    this._editor = monaco.editor.create(
      this._editorContainer.nativeElement,
      this.options
    );
  }

  loadSource() {
    this._editor.setValue(this.source);
    this.isSource = true;
    this.title = "CODE";
  }

  loadHex() {
    this.source = this._editor.getValue();
    this._editor.setValue(this.code);
    this.isSource = false;
    this.title = "HEX"
  }

  assemble() {
    if (this.monacoEditorService.loaded) {
      this.source = this._editor.getValue();
      this.code = this.assembler.assembe(this.source);
      if(this.code) {
        this.buffer.clear();
        this.showToast('Assembled!');
        this.load();
      }
    }
  }

  load() {
    this.code.split('\n').forEach(line => {
      let addr = line.split(':')[0];
      const _code = line.split(':')[1];
      const address = parseInt(addr, 16);
      if (addr) {
        _code.split(' ').map((hex, i) => {
          if (hex != '') {
            const data = parseInt(hex, 16);
            this.buffer.write(address + ((i - 1) & 0xff), data);
          }
        });
      }
    });
  }

  async showToast(msg: string)
  {
    const toast = await this.toastCtrl.create({
      duration: 5000,
      message: msg,
      position: 'top',
      mode: 'md',
      buttons:[
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
