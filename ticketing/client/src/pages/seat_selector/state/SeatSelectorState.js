import { makeObservable, observable, action, computed } from 'mobx';
import { matchPath } from 'react-router';
import { fetchData, postData } from '../../../api/api.service'
import { SeatViewModel } from '../../../store';
import _ from 'lodash';
import dayjs from 'dayjs';


class SeatSelectorState {
  movie = {};
  seats = [];
  time = '';
  errors = {};

  constructor() {
    makeObservable(this, {
      movie: observable,
      seats: observable,
      time: observable,
      errors: observable,
      load: action,
      selectSeats: action,
      updateTime: action,
      selectedSeats: computed
    });
  }

  async load() {
    this.guid = matchPath({ path: "/select-seats/:guid" }, window.location.pathname).params.guid;
    const movie = await fetchData(`/api/movies/${this.guid}`)
    this.movie = movie;
    this.seats = [
      new SeatViewModel('A', 1),
      new SeatViewModel('A', 2),
      new SeatViewModel('A', 3),
      new SeatViewModel('A', 4),
      new SeatViewModel('B', 1),
      new SeatViewModel('B', 2),
      new SeatViewModel('B', 3),
      new SeatViewModel('B', 4),
      new SeatViewModel('B', 5),
      new SeatViewModel('B', 6),
    ];
    
    this.time = dayjs().hour(20).minute(30).second(0)
  }

  updateTime(time) {
    this.time = dayjs().hour(time.split(':')[0]).minute(time.split(':')[1]);
  }

  async selectSeats() {
    if (_.isEmpty(this.selectedSeats)) {
      this.errors.seats = 'Please make a selection';
      return;
    }

    this.errors = {};
    const {model} = await postData(
      `/api/movies/${this.guid}/play`,
      {
        seats: this.selectedSeats,
        time: this.time
      }
    )

    if (model) {
      window.location = '/';
    }
  }

  get selectedSeats() {
    return _.filter(this.seats, 'selected');
  }
}

export default SeatSelectorState;
