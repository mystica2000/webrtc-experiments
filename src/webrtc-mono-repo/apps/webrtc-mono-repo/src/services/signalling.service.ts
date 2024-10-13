import { Injectable, signal } from '@angular/core';
import { io, Socket } from "socket.io-client";

@Injectable({
  providedIn: 'root'
})
export class SignallingService {

  public socket: Socket;
  public localStreamSignal = signal<MediaStream>(new MediaStream());
  public remoteStreamSignal = signal<MediaStream>(new MediaStream());

  public xSignal = signal<number>(0);
  public ysignal = signal<number>(0);

  peerConnection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;

  sender: any;

  constructor() {
    this.socket = io("http://localhost:3000", {
      path: '/signal',
      transports: ["websocket"]
    });
    this.peerConnection = new RTCPeerConnection();
    this.setSocketMessages();
  }

  async initForVideoCall() {

    if (this.peerConnection.connectionState == "closed") {
      this.peerConnection = new RTCPeerConnection();
      this.setSocketMessages();
    }

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    this.localStreamSignal.set(localStream);

    localStream.getTracks().forEach((track) => {
      this.sender = this.peerConnection.addTrack(track, localStream);
    })

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStreamSignal.set(event.streams[0]);
      })
    }

    this.peerConnection.onnegotiationneeded = () => {
      console.log("negotiatipn needed!")
    }

  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emit('offer', { msg: JSON.stringify(offer) });
  }

  private async setSocketMessages() {

    this.socket.on("start", (ev) => {
      this.initForTrackMousePointer();
    })

    this.socket.on('offer', async (ev) => {
      await this.peerConnection.setRemoteDescription(JSON.parse(ev.msg));
      let answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', { msg: JSON.stringify(answer) });
    })

    this.socket.on('answer', (e) => {
      console.log("got answer!!")
      if (!this.peerConnection.currentRemoteDescription) {
        this.peerConnection.setRemoteDescription(JSON.parse(e.msg));
      }
    })

    this.socket.on('iceCandidate', (e) => {
      if (e.msg) {
        this.peerConnection.addIceCandidate(e.msg);
      }
    })

    this.socket.on("end", (e) => {
      console.log("close");
      if (this.peerConnection.connectionState != "closed") {
        if (this.sender) {
          this.peerConnection?.removeTrack(this.sender);
        }
        this.dataChannel?.close();
        this.xSignal.set(0);
        this.ysignal.set(0);
        this.peerConnection.close();
        this.localStreamSignal.set(new MediaStream());
        this.remoteStreamSignal.set(new MediaStream());
      }
    })

    this.peerConnection.onicecandidate = (e) => {
      this.socket.emit("iceCandidate", { msg: e.candidate });
    }



  }

  public closeAll() {
    this.socket.emit("end");
    if (this.peerConnection.connectionState != "closed") {
      if (this.sender) {
        this.peerConnection?.removeTrack(this.sender);
      }
      this.peerConnection.close();
      this.localStreamSignal.set(new MediaStream());
      this.remoteStreamSignal.set(new MediaStream());
      this.dataChannel?.close();
      this.xSignal.set(0);
      this.ysignal.set(0);
    }
  }

  private initForTrackMousePointer() {

    if (this.peerConnection.connectionState == "closed") {
      this.peerConnection = new RTCPeerConnection();
      this.setSocketMessages();
    }

    this.dataChannel = this.peerConnection.createDataChannel("trackptr");

    this.dataChannel.onopen = (ev) => {
      console.log("CHANNEL OPEN");

      document.addEventListener('mousemove', event => {
        console.log(this.dataChannel);
        if (this.dataChannel && this.dataChannel.readyState == "open") {
          this.dataChannel.send(JSON.stringify({ x: event.clientX, y: event.clientY }));
        }
      });
    }

    this.dataChannel.onclose = (ev) => {
      console.log('CANNEL CLOSE');
    }

    this.dataChannel.onmessage = (ev) => {
      const { x, y } = JSON.parse(ev.data);
      this.xSignal.set(x);
      this.ysignal.set(y);
      console.log("XSDASDASDASDASDASDAS");
    }

    this.peerConnection.onicecandidate = (e) => {
      this.socket.emit("iceCandidate", { msg: e.candidate });
    }

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
    }

  }

  public async startTrackPtr() {
    await this.initForTrackMousePointer();
    this.socket.emit("start");
    await this.createOffer();
  }


}
