import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SignallingService } from '../services/signalling.service';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  signallingService = inject(SignallingService);
  videoMode = false;

  constructor() { }

  ngOnInit() {
  }

  async startCamera() {
    this.videoMode = true;

    setTimeout(async () => {
      await this.signallingService.initForVideoCall();
    }, 1000);
  }

  async makeOffer() {
    // create a sdp message and send it to peer;
    await this.signallingService.createOffer();
  }

  async closeVideoCall() {
    this.signallingService.closeAll();
  }

  trackMousePointer() {
    this.videoMode = false;

    setTimeout(async () => {
      this.signallingService.startTrackPtr();

    }, 1000);
  }

  closeTrackPointer() {
    this.signallingService.closeAll();
  }

}
