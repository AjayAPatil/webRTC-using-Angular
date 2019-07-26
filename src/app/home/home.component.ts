import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { SocketIOService } from '../services/socket.io.service';

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
        private socketIOService: SocketIOService) {
        this.loggedUserName = sessionStorage.getItem("username");
        if (!this.loggedUserName) {
            this.router.navigate(['/Login']);
        } else {
            this.AddUser();
        }
    }

    ngOnInit() {
        this.GetLiveUsers();
        this.OnVideoCallRequest();
        this.OnVideoCallAccepted();
        this.GetBusyUsers();
        this.OnVideoCallRejected();
    }

    AddUser() {
        this.socketIOService.SetUserName(this.loggedUserName)
            .subscribe(data => {
                if (data.username) {
                    //user added
                }
            })
    }
    GetLiveUsers() {
        this.socketIOService
            .GetConnectedUsers()
            .subscribe(data => {
                var users = data.filter(a => a.username != this.loggedUserName);
                var count = 0;
                for (var i in users) {
                    if (this.liveUserList.indexOf(data[i]) === -1) {
                        count++;
                    }
                }
                if (count != this.liveUserList.length) {
                    this.liveUserList = users;
                    this.socketIOService.connectedusers = users;
                    this.GetBusyUsers();
                }
            });
    }
    OnVideoCallRequest() {
        this.socketIOService
            .OnVideoCallRequest()
            .subscribe(data => {
                this.callingInfo.name = data.fromname;
                this.callingInfo.content = "Calling....";
                this.callingInfo.type = "receiver";
                this.isVideoCall = true;
            });
    }
    OnVideoCallAccepted() {
        this.socketIOService
            .OnVideoCallAccepted()
            .subscribe(data => {
                var calee = this.liveUserList.find(a => a.username == this.callingInfo.name);
                this.userType = "dialer";
                this.caller = calee.id;
                this.isVideoCallAccepted = true;
                this.socketIOService.BusyNow();
                this.Close();
            });
    }
    GetBusyUsers() {
        this.socketIOService
            .GetBusyUsers()
            .subscribe(data => {
                this.liveUserList.forEach(a => { a.busy = false; });
                data.forEach(a => {
                    var usr = this.liveUserList.find(b => b.username == a.username);
                    if (usr) {
                        usr.busy = true;
                    }
                });
            })
    }
    OnVideoCallRejected() {
        this.socketIOService
            .OnVideoCallRejected()
            .subscribe(data => {
                this.callingInfo.content = "Call Rejected ..";
                setTimeout(() => {
                    this.Close();
                }, 1000);
            });
    }
    Chat() {
        this.isChat = true;
    }

    VideoCall(callee) {
        var calee = this.liveUserList.find(a => a.username == callee.username);
        if (calee) {
            this.socketIOService.VideoCallRequest(this.loggedUserName, calee.id);
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
            this.socketIOService.VideoCallAccepted(this.loggedUserName, calee.id);
            this.userType = "receiver";
            this.caller = calee.id;
            this.isVideoCallAccepted = true;
            this.socketIOService.BusyNow();
        }
        this.Close();
    }

    RejectVideoCall() {
        var calee = this.liveUserList.find(a => a.username == this.callingInfo.name);
        if (calee) {
            this.socketIOService.VideoCallRejected(this.loggedUserName, calee.id);
            this.isVideoCallAccepted = false;
        }
        this.Close();
    }
    AudioCall() {
        this.isAudioCall = true;
    }

    CallBack(event) {
        this.isChat = false;
        this.isVideoCall = false;
        this.isAudioCall = false;
        this.isVideoCallAccepted = false;
    }

    Close() {
        this.isVideoCall = false;
    }
    Logout() {
        this.socketIOService.RemoveUser();
        sessionStorage.clear();
        location.reload();
    }
}
