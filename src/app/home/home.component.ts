import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { ChatService } from '../services/chat.service';

@Component({
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    public loggedUserName;
    public isChat = false;
    public isVideoCall = false;
    public isAudioCall = false;
    public liveUserList = [];
    public callee: any;
    public callingInfo = { name: "", content: "", type: "" };
    public isVideoCallAccepted: boolean = false;
    public userType: string;
    public caller: any;

    constructor(private router: Router,
        private chatService: ChatService) {
        this.loggedUserName = sessionStorage.getItem("username");
        if (!this.loggedUserName) {
            this.router.navigate(['/Login']);
        }
        window.addEventListener('onload', () => { this.chatService.SetUserName(this.loggedUserName) });
        //document.getElementById("btn-logout").style.display="block";
    }

    ngOnInit() {
        this.GetUsers();

        this.chatService
            .OnVideoCallRequest()
            .subscribe(data => {
                this.callingInfo.name = data.fromname;
                this.callingInfo.content = "Calling....";
                this.callingInfo.type = "receiver";
                this.isVideoCall = true;
            });
        this.chatService
            .OnVideoCallAccepted()
            .subscribe(data => {
                var calee = this.liveUserList.find(a => a.username == this.callingInfo.name);
                this.userType = "dialer";
                this.caller = calee.id;
                this.isVideoCallAccepted = true;
                this.Close();
            });
        this.chatService
            .OnVideoCallRejected()
            .subscribe(data => {
                this.callingInfo.content = "Call Rejected ..";
                setTimeout(() => {
                    this.Close();
                }, 2000);
            });
    }

    GetUsers() {
        this.chatService
            .GetConnectedUsers()
            .subscribe(data => {
                var users = data.filter(a => a.username != this.loggedUserName);
                if (this.liveUserList != users)
                    this.liveUserList = users;
            });
    }
    Chat() {
        this.isChat = true;
    }

    VideoCall(callee) {
        var calee = this.liveUserList.find(a => a.username == callee.username);
        if (calee) {
            this.chatService.VideoCallRequest(this.loggedUserName, calee.id);
        }
        this.callee = callee;
        this.callingInfo.name = callee.username;
        this.callingInfo.content = "Dialing....";
        this.callingInfo.type = "dialer";
        this.isVideoCall = true;
    }

    AcceptVideoCall() {
        var calee = this.liveUserList.find(a => a.username == this.callingInfo.name);
        if (calee) {
            this.chatService.VideoCallAccepted(this.loggedUserName, calee.id);
            this.userType = "receiver";
            this.caller = calee.id;
            this.isVideoCallAccepted = true;
        }
        this.Close();
    }

    RejectVideoCall() {
        var calee = this.liveUserList.find(a => a.username == this.callingInfo.name);
        if (calee) {
            this.chatService.VideoCallRejected(this.loggedUserName, calee.id);
            this.isVideoCallAccepted = false;
        }
        this.Close();
    }
    AudioCall() {
        this.isAudioCall = true;
    }

    CallBack() {
        this.isChat = false;
        this.isVideoCall = false;
        this.isAudioCall = false;
    }

    Close() {
        this.isVideoCall = false;
    }
}
