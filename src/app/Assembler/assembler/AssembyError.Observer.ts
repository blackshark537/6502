import { BehaviorSubject } from "rxjs";

export class ErrorObserver{

    error = new BehaviorSubject<string>(null);
    private static instance: ErrorObserver;

    private constructor(){}

    static getInstance(): ErrorObserver
    {
        if(!this.instance) this.instance = new ErrorObserver();
        return this.instance;
    }
}