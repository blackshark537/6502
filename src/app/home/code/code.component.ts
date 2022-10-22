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
  source: string = `;**************************************************************
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
  JSR LCD_ON
  JSR LCD_ENTRY
  LDX #$00
  JMP @LOOP
  
  @LOOP:
      LDA $8900,X
      JSR PRINT
      JSR DELAY
      INX
      TXA
      CMP #32
      BNE @LOOP
      BRK
  ;PGM END

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
      RTS
  
  LCD_ON:
      LDA #%00001100
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
  
  .org $8900
  .byte "Welcome To 6502 8-Bits Computer."
  
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
    if(this.isSource) return;
    this._editor.setValue(this.source);
    this.isSource = true;
    this.title = "CODE";
  }

  loadHex() {
    if(!this.isSource) return;
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
        this.assembler.showToast('Assembled!');
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

}
