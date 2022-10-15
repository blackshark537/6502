import { Injectable } from "@angular/core";
import { AlertController, ToastController } from "@ionic/angular";
import { Assembler } from "./assembler";
import { ErrorObserver } from "./assembler/AssembyError.Observer";

@Injectable({
    providedIn: 'root'
})
export class AssemblerService {

    constructor(
        private alertCtrl: AlertController,
        private toastCtrl: ToastController
    ) {
        ErrorObserver.getInstance().error
        .subscribe(error=> this.showError(error))
    }

    assembe(source: string): string
    {
        return Assembler.toHexString(source);
    }

    inspect(source: string)
    {
        Assembler.inspect(source);
    }

    async showError(error: string)
    {
        if(!error) return;

        const toast = await this.toastCtrl.create({
            message: error,
            duration: 10000,
            position: 'top',
            mode: 'md',
            buttons: [
                {
                    icon: 'close',
                    role: 'cancel'
                }
            ]
        });

        await toast.present();
    }
}