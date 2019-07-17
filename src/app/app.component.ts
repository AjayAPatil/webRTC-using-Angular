import { Component } from '@angular/core';
import { ChatService } from './services/chat.service';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chatApp';
  public uname = '';
  public isUserLogged = false;
  constructor(private chatService: ChatService) {
  }

  Login() {
    if (this.uname != '') {
      this.chatService.SetUserName(this.uname)
      .subscribe(data=>{
        if(data.username){
          this.isUserLogged=true;
        }
      })
    }
  }
}
