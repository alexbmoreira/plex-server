import React from 'react';
import { observer } from 'mobx-react';
import { withState } from '../../../utils';
import _ from 'lodash';
import { FilterState } from './state';

const Filter = observer(({uiState}) => {
  const {filter} = uiState;

  return (
    <input
      type='search'
      className='w-full mb-4 p-2 bg-slate rounded outline-none'
      placeholder={'Search...'}
      defaultValue={_.get(filter, 'search') || ''}
      onChange={_.debounce(e => uiState.updateSearch(e.target.value), 300)}
    />
  );
});

export default withState(Filter, FilterState);
