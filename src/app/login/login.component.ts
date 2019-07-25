import { Component } from '@angular/core';
import * as moment from 'moment';
import { SocketIOService } from '../services/socket.io.service';
import { Router } from '@angular/router';

@Component({
    templateUrl: './login.component.html'
})
export class LoginComponent {
    public uname = '';
    public isUserLogged = false;

    constructor(private socketIOService: SocketIOService,
        private router: Router) {
    }

    Login() {
        if (this.uname != '') {
            sessionStorage.setItem('username', this.uname);
            this.isUserLogged = true;
            this.router.navigate(['/']);
        }
    }
}
