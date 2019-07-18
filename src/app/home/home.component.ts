import { Component } from '@angular/core';
import * as moment from 'moment';
import { Router } from '@angular/router';

@Component({
    templateUrl: './home.component.html'
})
export class HomeComponent {
    public isChat = false;
    public isVideoCall = false;
    public isAudioCall = false;

    constructor(private router: Router) {
        var loggedUser = sessionStorage.getItem('username');
        if (!loggedUser) {
            this.router.navigate(['/Login']);
        }
        //document.getElementById("btn-logout").style.display="block";
    }

    Chat() {
        this.isChat = true;
    }
    VideoCall() {
        this.isVideoCall = true;
    }
    AudioCall() {
        this.isAudioCall = true;
    }
    CallBack() {
        this.isChat = false;
        this.isVideoCall = false;
        this.isAudioCall = false;
    }
}
