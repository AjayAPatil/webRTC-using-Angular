import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

export class ChatService {
    private url = 'http://localhost:3000';
    private socket;
    private connected = false;

    constructor() {
        this.socket = io(this.url);
    }

    SetUserName(username) {
        this.socket.emit('add user', username);
        return Observable.create((observer) => {
            this.socket.on('logged-user', (data) => {
                this.connected = true;
                observer.next(data);
            });
        });
    }

    public SendMessage(message) {
        this.socket.emit('new-message', message);
    }

    public GetMessages() {
        return Observable.create((observer) => {
            this.socket.on('new-message', (message) => {
                observer.next(message);
            });
        });
    }
    public GetConnectedUsers() {
        return Observable.create((observer) => {
            this.socket.on('client-list', (data) => {
                console.log(data + ' joined');
                observer.next(data);
            });
        });
    }
    /**
     * 
     * @param candidate for video call
     * need to send remote user id
     */
    public SendCallRequest(candidate){
        this.socket.emit('call-request', {
            //to: remoteuserid,
            candidate: candidate
          });
    }
    public ReceiveCallRequest(){
        return Observable.create((observer) => {
            this.socket.on('call-request', (data) => {
                console.log('requested');
                console.log(data);
                observer.next(data);
            });
        });
    }
}