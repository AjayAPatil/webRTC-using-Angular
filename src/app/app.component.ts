import { Component } from '@angular/core';
import { ChatService } from './services/chat.service';
import * as moment from 'moment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chatApp';
  constructor(private chatService: ChatService,
    private router: Router) {
      this.router.navigate(['/']);
  }
  Logout(){
      sessionStorage.clear();
      document.getElementById("btn-logout").style.display="none";
      this.router.navigate(['/Login']);
  }
}
