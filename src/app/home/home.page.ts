import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  pageTitle: string = 'Welcome'
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
}
