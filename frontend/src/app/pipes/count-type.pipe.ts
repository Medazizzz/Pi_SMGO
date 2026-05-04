import { Pipe, PipeTransform } from '@angular/core';
import { Abonnement } from '../models/abonnement.model';

@Pipe({
  name: 'countType',
  standalone: true
})
export class CountTypePipe implements PipeTransform {
  transform(abonnements: Abonnement[], type: string): number {
    return abonnements.filter(a => a.type === type).length;
  }
}
