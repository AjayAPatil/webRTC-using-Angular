import { Component, OnInit, Input } from '@angular/core';
import { ChatService } from '../services/chat.service';
import * as moment from 'moment';

@Component({
  selector: 'message',
  templateUrl: './message.component.html'
})
export class MessageComponent implements OnInit {
  title = 'chatApp';
  message: string;
  messages: string[] = [];
  users = [];


  constructor(private chatService: ChatService) {
  }

  SendMessage() {
    this.chatService.BroadCastMessage(this.message);
    this.message = '';
  }

  ngOnInit() {
    this.chatService
      .GetMessages()
      .subscribe(data => {
        var message = data.message;
        var username = data.username;
        const currentTime = moment().format('hh:mm:ss a');
        const messageWithTimestamp = `${currentTime}: ${message}`;
        this.messages.push(messageWithTimestamp);
      });
      this.GetUserList();
  }
  GetUserList(){
    this.chatService
      .GetConnectedUsers()
      .subscribe(data => {
        this.users=data;
      });
  }
}
