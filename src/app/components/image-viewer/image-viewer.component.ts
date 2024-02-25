import { Component, HostListener, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss'
})
export class ImageViewerComponent {
  @Input() images?: string[];
  open: boolean = false;
  selectedImageIndex: number = 0;

  constructor(public activeModal: NgbActiveModal) {}

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement: HTMLElement) {
    if (this.open) {
      if (!this.isInsideModal(targetElement)) {
        this.open = false;
        this.activeModal.dismiss();
      }
    } else {
      this.open = true;
    }
  }
      
  private isInsideModal(targetElement: HTMLElement): boolean | null {
    // Check if the click target is inside the modal content
    const modalContent = document.querySelector('.image-viewer');
    return modalContent && modalContent.contains(targetElement);
  }

  image_backward(){
    this.selectedImageIndex --;
    if (this.selectedImageIndex < 0)
    this.selectedImageIndex = 0;
  }

  image_foward(){
    this.selectedImageIndex ++;
    if (this.selectedImageIndex >= (this.images?.length as number))
       this.selectedImageIndex = (this.images?.length as number)-1;
  }

  // showImage(index: number) {
  //   this.selectedImageIndex = index;
  // }
}
