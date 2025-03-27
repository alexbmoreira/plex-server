import { makeObservable, observable } from 'mobx';
import _ from 'lodash';

class SeatViewModel {
  selected = false;
  number = 0;
  row = '';

  constructor(row, number) {
    this.row = row;
    this.number = number;

    makeObservable(this, {
      selected: observable
    });
  }

  toggleSelection() {
    this.selected = !this.selected;
  }
}

export default SeatViewModel;
