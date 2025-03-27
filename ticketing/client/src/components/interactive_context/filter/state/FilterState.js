import { makeObservable, observable, action } from 'mobx';
// import _ from 'lodash';

class FilterState {
  filter = {};
  search = '';

  constructor() {
    makeObservable(this, {
      filter: observable,
      search: observable,
      updateSearch: action
    });
  }

  receiveProps({filter, filterUpdated}) {
    this.filter = filter;
    this.filterUpdated = filterUpdated;
  }

  async updateSearch(search) {
    await this.filterUpdated({
      search: search
    });
  }
}

export default FilterState;
