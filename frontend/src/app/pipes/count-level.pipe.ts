import { Pipe, PipeTransform } from '@angular/core';
import { Fidelity } from '../models/fidelity.model';

@Pipe({
  name: 'countLevel',
  standalone: true
})
export class CountLevelPipe implements PipeTransform {
  transform(fidelities: Fidelity[], level: string): number {
    return fidelities.filter(f => f.level === level).length;
  }
}
