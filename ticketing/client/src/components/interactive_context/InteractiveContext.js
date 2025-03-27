import React from 'react';
import { observer } from 'mobx-react';
import { InteractiveContextState } from './state';
import { withState } from '../../utils';

const InteractiveContext = observer(({uiState, children}) => {
  return (
    <div>
      {React.Children.map(children, child =>
        child && React.cloneElement(child, {
          models: uiState.models,
          isLoading: uiState.isLoading,
          filter: uiState.filter,
          filterUpdated: filter => uiState.filterUpdated(filter)
        })
      )}
    </div>
  );
});

export default withState(InteractiveContext, InteractiveContextState);
