import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  
  isModalOpen: boolean = localStorage.getItem('modal') === 'false'? false : true;
  isLicense: boolean = false;
  
  pageTitle: string = 'Welcome'
  version = environment.version;

  constructor(
    private alertController: AlertController
  ) {}

  async about()
  {
    const prompt = await this.alertController.create({
      mode: 'ios',
      animated: true,
      header: 'About?',
      subHeader: 'Author: Berlys Santos Cruz\t\n',
      message: `
        Version: Beta v0.1.0\n
      `,
      buttons:[
        {
          text: 'Okay',
          role: 'cancel'
        }
      ]
    });

    await prompt.present();
  }

  dontShowModal()
  {
    localStorage.setItem('modal', 'false');
  }
}
