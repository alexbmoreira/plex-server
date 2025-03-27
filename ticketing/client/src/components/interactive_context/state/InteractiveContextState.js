import { makeObservable, observable, action } from 'mobx';
import Url from 'domurl';
import { fetchData } from '../../../api/api.service';
import _ from 'lodash';

class InteractiveContextState {
  isLoading = false;
  models = [];
  filter = {};
  endpoint = '';

  constructor() {
    makeObservable(this, {
      isLoading: observable,
      models: observable,
      filter: observable,
      endpoint: observable,
      load: action,
      filterUpdated: action,
      refresh: action,
      fetchModels: action
    });
  }

  receiveProps({endpoint}) {
    this.endpoint = endpoint;
  }

  async load() {
    await this.refresh();
  }

  async filterUpdated(filter) {
    await this.refresh({
      filter
    });
  }

  async refresh(args = {}) {
    this.isLoading = true;

    const {filter} = args
    _.merge(this.filter, filter);

    await this.fetchModels();

    this.isLoading = false;
  }

  async fetchModels() {
    const models = await fetchData(this.constructUrl());
    this.models = models;
  }

  constructUrl() {
    const url = new Url(this.endpoint, true)

    url.query['filter[search]'] = this.filter.search

    return url.toString();
  }
}

export default InteractiveContextState;
