import { Component, OnInit } from '@angular/core';
import { Observable, empty } from 'rxjs';
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
    templateUrl: './video.component.html',
    styleUrls: ['./communication.css']
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
    public selectors = [];

    constructor(private chatService: ChatService) {
        this.GetLocalStream();
    }

    SetConnection() {
        //on both side
        this.peerConnection = new RTCPeerConnection();
        var iceServerConfig = {
            iceServers: [{
                urls: ["stun:bturn1.xirsys1221.com"]
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
        // navigator.mediaDevices.enumerateDevices()
        //     .then(this.GotDevices.bind(this))
        //     .catch(this.HandleDeviceError.bind(this));
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(this.GotLocalStream.bind(this))
            .then(this.GotDevices.bind(this))
            .catch(this.HandleDeviceError.bind(this));
    }
    //got local stream
    GotLocalStream(stream) {
        var lv = document.getElementById('local-video') as HTMLVideoElement;
        lv.srcObject = stream;
        lv.controls = false;
        lv.muted = true;
        lv.volume = 0;
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

        // var remotevid=document.createElement("video") as HTMLVideoElement;
        // remotevid.srcObject=stream;
        // remotevid.autoplay = true;
        // remotevid.id=stream.id;
        // var lv = document.querySelector('#div-remote-video');
        // lv.appendChild(remotevid);

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
    GotDevices(deviceInfos) {
        // Handles being called several times to update labels. Preserve values.
        // const values = this.selectors.map(select => select.value);
        // selectors.forEach(select => {
        //   while (select.firstChild) {
        //     select.removeChild(select.firstChild);
        //   }
        // });
        var flagMic = false;
        var flagSpeaker = false;
        var flagWebCam = false;
        for (let i = 0; i !== deviceInfos.length; ++i) {
            const deviceInfo = deviceInfos[i];
            console.log(i + 1, deviceInfo.label);
            if (deviceInfo.kind == 'audioinput') {
                flagMic = true;
            }
            if (deviceInfo.kind == 'audiooutput') {
                flagSpeaker = true;
            }
            if (deviceInfo.kind == 'videoinput') {
                flagWebCam = true;
            }
            //   const option = document.createElement('option');
            //   option.value = deviceInfo.deviceId;
            //   if (deviceInfo.kind === 'audioinput') {
            //     option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            //     audioInputSelect.appendChild(option);
            //   } else if (deviceInfo.kind === 'audiooutput') {
            //     option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            //     audioOutputSelect.appendChild(option);
            //   } else if (deviceInfo.kind === 'videoinput') {
            //     option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            //     videoSelect.appendChild(option);
            //   } else {
            //     console.log('Some other kind of source/device: ', deviceInfo);
            //   }
        }
        var msg = '';
        if (!flagMic) {
            msg += 'microphone ';
        }
        if (!flagSpeaker) {
            msg += 'speaker ';
        }
        if (!flagWebCam) {
            msg += 'webcam ';
        }
        if (msg != '') {
            alert(msg + "not found!");
        }
        // selectors.forEach((select, selectorIndex) => {
        //   if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
        //     select.value = values[selectorIndex];
        //   }
        // });
    }
    HandleDeviceError(error) {
        if (error.name == "NotFoundError" || error.name == "DevicesNotFoundError") {
            alert("webcam or mic not connected to your system");
        }
        else if (error.name == "NotReadableError" || error.name == "TrackStartError") {
            alert("webcam or mic already in use by another application");
        } else if (error.name == "OverconstrainedError" || error.name == "ConstraintNotSatisfiedError") {
            alert("webcam or mic not supported!");
        } else if (error.name == "NotAllowedError" || error.name == "PermissionDeniedError") {
            alert("Access denied for accessing webcam or mic!");
        } else if (error.name == "MediaStreamError" || error.name == "TypeError") {
            //empty constraints object
            //alert("Unable to get media!");
            console.log("empty constraints object");
        } else if (error.name == "PermissionDismissedError") {
            alert("Permission is dismissed for access webcam or mic");
        }
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }
}
