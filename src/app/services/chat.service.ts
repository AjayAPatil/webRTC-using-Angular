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
                observer.next(data);
            });
        });
    }
    /**
     * 
     * @param candidate or @param description for video call
     * need to send remote user id
     */
    public SendCallRequest(val,type){
        var data;
        if(type == 'desc'){
            data={
                //to: uid,
                desc: val
            }
        }else{
            data = {
                //to: uid,
                candidate: val
            }
        }
        this.socket.emit('call-request', data);
    }
    public ReceiveCallRequest(){
        return Observable.create((observer) => {
            this.socket.on('call-request', (data) => {
                observer.next(data);
            });
        });
    }
}