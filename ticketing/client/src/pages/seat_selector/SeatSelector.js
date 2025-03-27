import React from 'react';
import { observer } from 'mobx-react';
import { withState } from '../../utils';
import { SeatSelectorState } from './state';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import dayjs from 'dayjs';

const Seat = observer(({seat}) => {
  return (
    <div className='relative' onClick={() => seat.toggleSelection()}>
      <div className='absolute inset-x-0 top-3 w-full flex justify-center text-gunmetal text-sm'>{seat.number}</div>
      <i className={`material-icons hover:text-amethyst active:text-amethyst-active ${seat.selected ? 'text-amethyst-hover' : ''}`}>{'chair'}</i>
    </div>
  );
})

const Seats = observer(({uiState}) => {
  const {seats} = uiState;

  if (_.isEmpty(seats)) return null;

  return (
    <div className='text-powder text-6xl cursor-pointer text-2xl select-none space-y-2'>
      <div className='flex w-full justify-center space-x-1 relative'>
        <div className='absolute left-4 inset-y-0 flex items-center opacity-50 text-xl'>{'B'}</div>
        {_.map(_.filter(seats, {row: 'B'}), seat => <Seat key={seat.number} seat={seat}/>)}
      </div>
      <div className='flex w-full justify-center space-x-1 relative'>
        <div className='absolute left-4 inset-y-0 flex items-center opacity-50 text-xl'>{'A'}</div>
        {_.map(_.filter(seats, {row: 'A'}), seat => <Seat key={seat.number} seat={seat}/>)}
      </div>
    </div>
  );
});

const SeatPicker = observer(({uiState}) => {
  return (
    <div className='w-1/2 mx-auto'>
      <div className='font-serif text-3xl my-4 text-center'>{'Select Seats'}</div>
      <Seats uiState={uiState}/>
      <div className='mt-12 bg-slate rounded flex justify-center items-center p-4'>{'SCREEN'}</div>
    </div>
  );
});

const Showtime = observer(({uiState}) => {
  const {time} = uiState;

  return (
    <div className='w-1/2 mx-auto'>
      <div className='font-serif text-3xl my-4 text-center'>{'Select Showtime'}</div>
      <div className='flex justify-center'>
        <input
          value={time.format('HH:mm')}
          min={dayjs().format('HH:mm')}
          onChange={e => uiState.updateTime(e.target.value)}
          className='mb-4 p-2 bg-slate rounded outline-none'
          type='time'
        />
      </div>
    </div>
  );
});

const SeatSelector = observer(({uiState}) => {
  const {movie} = uiState;

  return (
    <div className='py-16 px-64'>
      <div className='mb-4 select-none cursor-pointer'>
        <Link to='/'>
          <span className='flex items-center'><i className='material-icons text-3xl'>{'chevron_left'}</i>{'Select Movie'}</span>
        </Link>
      </div>
      <div className='flex h-96 rounded'>
        <img src={movie.image} alt={movie.title} className='rounded'/>
        <div className='ml-16 p-1'>
          <div className='text-6xl mb-8'>{movie.title}</div>
          <div className='text-2xl'>{movie.summary}</div>
        </div>
      </div>
      <div className='h-px bg-slate my-8'/>
      <SeatPicker uiState={uiState}/>
      <div className='h-px bg-slate my-8'/>
      <Showtime uiState={uiState}/>
      <div className='h-px bg-slate my-8'/>
      <div className='flex justify-end mr-32 mt-16'>
        <button onClick={() => uiState.selectSeats()} className='select-none cursor-pointer rounded inline-flex px-4 py-2 bg-amethyst hover:bg-amethyst-hover active:bg-amethyst-active text-xl'>
          <div className='flex justify-between items-center'><span>{'Print Tickets'}</span><i className='material-icons text-3xl'>{'chevron_right'}</i></div>
        </button>
      </div>
    </div>
  );
});

export default withState(SeatSelector, SeatSelectorState);
