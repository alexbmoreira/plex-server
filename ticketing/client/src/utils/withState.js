import React from 'react';
import {observer} from 'mobx-react';
import {observable} from 'mobx';
import Loading from '../components/Loading'

const withState = (Component, State, options={}) => {
  return observer(class extends React.Component {
    uiState = observable();
    isLoading = observable.box(true);

    async componentWillMount() {
      this.uiState = new State();

      if (this.uiState.receiveProps) {
        this.uiState.receiveProps(this.props);
      }
      if (this.uiState.load) {
        await Promise.resolve(this.uiState.load());
      }
      this.isLoading.set(false);
    }

    render() {
      if (this.isLoading.get() && !options.noLoading) return <Loading/>;

      return <Component {...this.props} uiState={this.uiState}/>;
    }
  });
};

export default withState;
