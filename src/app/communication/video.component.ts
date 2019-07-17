import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { async } from 'q';
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
    public peerConnection: any;
    public localStream: any;
    public remoteStream: any;
    public offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };

    constructor(private chatService: ChatService) {
        this.GetLocalStream();
    }

    SetConnection() {
        //on both side
        this.peerConnection = new RTCPeerConnection();
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

        this.peerConnection.setConfiguration(iceServerConfig);

        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });
        //this.peerConnection.addStream(this.localStream);
        this.peerConnection.onicecandidate = e => {
            this.OnIceCandidate(this.peerConnection, e);
        };
        this.peerConnection.onnegotiationneeded = async () => {
            try {
                // this.peerConnection.createOffer()
                // .then((event) =>{
                //     this.peerConnection.setLocalDescription(new RTCSessionDescription(event))
                //     .then(this.chatService.SendCallRequest(this.peerConnection.localDescription, 'desc'))
                // })

                // this.peerConnection.createOffer()
                //     .then(this.peerConnection.setLocalDescription(this)
                //         .then(this.chatService.SendCallRequest(this.peerConnection.localDescription, 'desc')))

                // await this.peerConnection.setLocalDescription(await this.peerConnection.createOffer());
                // this.chatService.SendCallRequest(this.peerConnection.localDescription, 'desc');
            } catch (err) {
                console.error(err);
            }
        };
        this.peerConnection.ontrack = (event) => {
            console.log("on track");
            // don't set srcObject again if it is already set.
            for (var stream of event.streams) {
                console.log("Remote streams: " + stream.id);
            }
            this.GotRemoteStream(event.streams[0]);
        };
        this.peerConnection.oniceconnectionstatechange = e => {
            this.OnIceStateChange(this.peerConnection, e);
        };
    }
    ngOnInit() {
        this.chatService
            .ReceiveCallRequest()
            .subscribe(data => {
                this.OnCallRequestReceived(data.data);
            });
    }
    OnCallRequestReceived(data) {
        console.log("call received");
        console.log(data);
        if (data.desc) {
            var descrip = new RTCSessionDescription(data.desc);
            if (descrip.type == "offer") {
                this.SetConnection();
                this.OnCallOffer(descrip);
            } else if (descrip.type == "answer") {
                this.OnCallAnswer(descrip);
            } else {
                console.log("Unsupported SDP type!!");
            }
        } else if (data.candidate) {
            var candidate = new RTCIceCandidate(data.candidate);
            this.peerConnection.addIceCandidate(candidate).catch(err => console.log(err));
        }
    }

    Call() {
        this.SetConnection();
        /**Step 1: caller creates offer */
        this.peerConnection.onnegotiationneeded = async () => {
            try {
                this.peerConnection.createOffer(this.offerOptions)
                    .then(
                        this.OnCreateOfferSuccess.bind(this),
                        this.OnCreateSessionDescriptionError.bind(this));
            } catch (err) {
                console.error(err);
            }
        };
        // //caller creates offer
        // this.peerConnection.createOffer(this.offerOptions)
        //     .then(
        //         this.OnCreateOfferSuccess.bind(this),
        //         this.OnCreateSessionDescriptionError.bind(this));
    }

    OnCreateOfferSuccess(event) {
        /**Step 2: caller sets localDescription */
        this.peerConnection.setLocalDescription(new RTCSessionDescription(event)).then(
            () => {
                /**Step 3: caller sends the description to the callee */
                this.chatService.SendCallRequest(this.peerConnection.localDescription, 'desc');
                this.ShowSuccess('created offer /nlocal description set /n=>Success');
            },
            this.OnSetSessionDescriptionError.bind(this)
        );
    }

    OnCallOffer(descrip) {
        /**Step 4: callee receives the offer sets remote description */
        this.peerConnection.setRemoteDescription(descrip).then(
            () => {
                this.OnSetRemoteSuccess(this.peerConnection);
            },
            this.OnSetSessionDescriptionError.bind(this)
        );
    }

    OnSetRemoteSuccess(val) {
        console.log("remote success");
        /**Step 5: callee creates answer */
        this.peerConnection.createAnswer().then(
            this.OnCreateAnswerSuccess.bind(this),
            this.OnCreateSessionDescriptionError.bind(this)
        );
    }

    OnCreateAnswerSuccess(event) {
        /**Step 6: callee sets local description */
        console.log('event');
        console.log(event);
        this.peerConnection.setLocalDescription(new RTCSessionDescription(event)).then(
            () => {
                /**Step 7: callee send the description to caller */
                this.chatService.SendCallRequest(this.peerConnection.localDescription, 'desc');
                this.ShowSuccess("create answer /n=>success");
            },
            this.OnSetSessionDescriptionError.bind(this)
        );
    }

    OnCallAnswer(descrip) {
        /**Step 8: caller receives the answer and sets remote description */
        this.peerConnection.setRemoteDescription(descrip)
            .then(() => console.log(this), console.log(this)).catch(err => console.log(err));
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
        console.log("local stream id => " + stream.id);

        //this.SetConnection();
    }

    OnIceCandidate(conn, event) {
        if (event.candidate) {
            // Send the candidate to the remote peer
            console.log("Send the candidate to the remote peer");
            var candi = new RTCIceCandidate(event.candidate);
            this.chatService.SendCallRequest(candi, 'candidate');
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

    GotRemoteStream(stream) {
        console.log("got remote stream");
        var lv = document.getElementById('remote-video') as HTMLVideoElement;
        lv.srcObject = stream;
        // for (var stream of event.streams) {
        //     if (!lv.srcObject)
        //         lv.srcObject = stream;
        //     console.log("Remote streams: " + stream.id);
        // }
    }

    OnCreateSessionDescriptionError(event) {
        console.log("OnCreateSessionDescriptionError");
        // this.peerConnection.setRemoteDescription(event).then(
        //     () => {
        //         this.OnSetRemoteSuccess(this.peerConnection);
        //     },
        //     this.OnSetSessionDescriptionError.bind(this)
        // );
    }

    ShowSuccess(message) {
        console.log(message);
    }
    OnSetSessionDescriptionError(val) {
        console.log("error " + val);
    }

}
