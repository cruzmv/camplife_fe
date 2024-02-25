import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageViewerComponent } from '../components/image-viewer/image-viewer.component';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  imageUrls: string[] = [
    'https://cdn3.park4night.com/lieu/302501_302600/302517_gd.jpg',
    'https://cdn3.park4night.com/lieu/478701_478800/478734_gd.jpg',
    'https://cdn3.park4night.com/lieu/478701_478800/478735_gd.jpg'
  ];
  constructor(private modalService: NgbModal) {}

  openImageViewer() {
    const modalRef = this.modalService.open(ImageViewerComponent, { centered: true });
    modalRef.componentInstance.images = this.imageUrls;
  }


}
