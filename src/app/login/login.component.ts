import { Component } from '@angular/core';
import * as moment from 'moment';
import { ChatService } from '../services/chat.service';
import { Router } from '@angular/router';

@Component({
    templateUrl: './login.component.html'
})
export class LoginComponent {
    public uname = '';
    public isUserLogged = false;

    constructor(private chatService: ChatService,
        private router: Router) {
    }

    Login() {
        if (this.uname != '') {
            this.chatService.SetUserName(this.uname)
                .subscribe(data => {
                    if (data.username) {
                        this.isUserLogged = true;
                        this.router.navigate(['/']);
                        sessionStorage.setItem('username', data.username);
                    }
                })
        }
    }
}
