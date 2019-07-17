import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatService } from '../services/chat.service';
/**
Step 1: caller creates offer

Step 2: caller sets localDescription

Step 3: caller sends the description to the callee

//------------------------------------------------------//

Step 4: callee receives the offer sets remote description

Step 5: callee creates answer

Step 6: callee sets local description

Step 7: callee send the description to caller

//------------------------------------------------------//

Step 8: caller receives the answer and sets remote description
 */
@Component({
    selector: 'video-call',
    templateUrl: './video.component.html'
})
export class VideoComponent implements OnInit {
    public title = 'webrtc';
    public localPeerConn: any;
    public remotePeerConn: any;
    public localStream: any;
    public remoteStream: any;
    public
    offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };

    constructor(private chatService: ChatService) {
        this.GetLocalStream();
    }
    
    SetConnection() {
        this.localPeerConn = new RTCPeerConnection();
        var iceServerConfig = {
            iceServers: [{
                urls: ["stun:bturn1.xirsys.com"]
            }, {
                username: "9hiaOVYRRn31s_Lv2sGS-iGgtEKg5_3SVWfeEZyO-4GWtKxUv0sCxQVNGkxlk-zBAAAAAF0sGiFhamF5cGF0aWw=",
                credential: "04f626c0-a6c8-11e9-8ad1-26d3ed601a80",
                urls: [
                    "turn:bturn1.xirsys.com:80?transport=udp",
                    "turn:bturn1.xirsys.com:3478?transport=udp",
                    "turn:bturn1.xirsys.com:80?transport=tcp",
                    "turn:bturn1.xirsys.com:3478?transport=tcp",
                    "turns:bturn1.xirsys.com:443?transport=tcp",
                    "turns:bturn1.xirsys.com:5349?transport=tcp"
                ]
            }]
        };

        this.localPeerConn.setConfiguration(iceServerConfig);

        this.localPeerConn.onicecandidate = e => {
            this.OnIceCandidate(this.localPeerConn, e);
        };
        this.localPeerConn.oniceconnectionstatechange = e => {
            this.OnIceStateChange(this.localPeerConn, e);
        };
        this.localStream.getTracks().forEach(track => {
            this.localPeerConn.addTrack(track, this.localStream);
        });
    }
    ngOnInit() {
        this.chatService
            .ReceiveCallRequest()
            .subscribe(data => {
                console.log(data);
                var candidate = data.data.candidate;
                this.OnCallRequestReceived(candidate);
            });
    }
    OnCallRequestReceived(candidate) {
        console.log("call received");
        if (candidate) {
            if(candidate.type == "offer"){
                this.localPeerConn.setRemoteDescription(candidate).then(
                    () => {
                        this.OnSetRemoteSuccess(this.localPeerConn);
                    },
                    this.OnSetSessionDescriptionError.bind(this)
                );
            }else if(candidate.type == "answer"){
                //this.localPeerConn.setRemoteDescription(candidate).catch(err => console.log(err));
            }else{
                console.log("Unsupported SDP type!!");
            }
        }
    }
    //get local stream
    GetLocalStream() {
        navigator.mediaDevices.getUserMedia({
            video: true,//{ width: 1280, height: 720 },
            audio: true
        })
            .then(this.GotLocalStream.bind(this))
            .catch(function (e) {
                console.log(e);
                alert('getUserMedia() error: ' + e.name);
            });
    }
    //got local stream
    GotLocalStream(stream) {
        var lv = document.getElementById('vid') as HTMLVideoElement;
        lv.srcObject = stream;
        this.localStream = stream;
        
        this.SetConnection();
    }

    Call() {
        //caller creates offer
        this.localPeerConn.createOffer(this.offerOptions)
            .then(
                this.OnCreateOfferSuccess.bind(this),
                this.OnCreateSessionDescriptionError.bind(this));
    }

    OnIceCandidate(conn, event) {
        if (event.candidate) {
            // Send the candidate to the remote peer
            console.log("Send the candidate to the remote peer");
            this.chatService.SendCallRequest(this.localPeerConn.localDescription);
        } else {
            // All ICE candidates have been sent
            console.log("All ICE candidates have been sent");
        }
    }

    OnIceStateChange(peerConn, event) {
        if (peerConn) {
            console.log('ICE state change event: ', event);
        }
    }

    GotRemoteStream(event) {
        console.log("got remote stream");
        var lv = document.getElementById('remote-video') as HTMLVideoElement;
        lv.srcObject = event.streams[0];
        for (var stream of event.streams) {
            console.log("Remote streams: " + stream.id);
        }
    }

    OnCreateOfferSuccess(event) {
        //caller set local description
        this.localPeerConn.setLocalDescription(event).then(
            () => {
                this.OnSetLocalSuccess(this.localPeerConn);
            },
            this.OnSetSessionDescriptionError.bind(this)
        );
    }

    OnSetLocalSuccess(val) {
        console.log("local success");
    }
    OnSetRemoteSuccess(val) {
        console.log("remote success");
        this.localPeerConn.createAnswer().then(
            this.OnCreateAnswerSuccess.bind(this),
            this.OnCreateSessionDescriptionError.bind(this)
        );
    }
    OnSetSessionDescriptionError(val) {
        console.log("error");
    }
    OnCreateAnswerSuccess(event) {
        //callee set local description
        console.log('event');
        console.log(event);
        this.localPeerConn.setLocalDescription(event).then(
            () => {
                this.OnSetLocalSuccess(this.localPeerConn);
            },
            this.OnSetSessionDescriptionError.bind(this)
        );
    }

    OnCreateSessionDescriptionError(event) {
        this.localPeerConn.setRemoteDescription(event).then(
            () => {
                this.OnSetRemoteSuccess(this.localPeerConn);
            },
            this.OnSetSessionDescriptionError.bind(this)
        );
    }
}
