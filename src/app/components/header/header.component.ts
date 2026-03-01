import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() percentage = 0;
  @Input() checkedCount = 0;
  @Input() totalCount = 0;
  @Output() resetClicked = new EventEmitter<void>();
  @Output() saveClicked = new EventEmitter<void>();
}
