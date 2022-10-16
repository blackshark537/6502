import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MonacoEditorService } from 'src/app/Core';
import { first } from 'rxjs/operators';
import { MonacoEditor, MonacoEditorOptions } from 'ng-monaco-editor';
import { BufferService } from 'src/app/Core';
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
;*        32 Kilobytes of ROM Max                             *
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
    ; CODE HERE

.org RESB
.addr RESTART 
`;

  title: string = 'CODE';
  code: string = '';
  isSource: boolean = true;
  options: MonacoEditorOptions = {
    theme: 'vs-dark',
    language: 'yaml',
    automaticLayout: true,
  };

  public _editor: MonacoEditor;
  @ViewChild('editorContainer', { static: true }) _editorContainer: ElementRef;

  constructor(
    private toastCtrl: ToastController,
    private monacoEditorService: MonacoEditorService,
    private buffer: BufferService,
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

    this._editor = monaco.editor.create(
      this._editorContainer.nativeElement,
      this.options
    );
    this._editor.setValue(this.source);
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
