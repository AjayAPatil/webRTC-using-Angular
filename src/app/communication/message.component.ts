import { Component, OnInit, Input } from '@angular/core';
import { SocketIOService } from '../services/socket.io.service';
import * as moment from 'moment';

@Component({
  selector: 'message',
  templateUrl: './message.component.html'
})
export class MessageComponent implements OnInit {
  message: string;
  messages: string[] = [];
  users = [];

  constructor(private socketIOService: SocketIOService) {
  }

  SendMessage() {
    this.socketIOService.BroadCastMessage(this.message);
    this.message = '';
  }

  ngOnInit() {
    this.socketIOService
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
    this.socketIOService
      .GetConnectedUsers()
      .subscribe(data => {
        this.users=data;
      });
  }
}
