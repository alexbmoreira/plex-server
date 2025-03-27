import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Filter, InteractiveContext } from '../../components';

const Poster = observer(({movie}) => {
  return (
    <div key={movie.guid} className='cursor-pointer w-full rounded bg-slate hover:bg-amethyst active:bg-amethyst-active'>
      <Link to={`/select-seats/${movie.guid}`}>
        <img src={movie.image} alt={movie.title} className='w-full rounded-t'/>
        <div className='p-4 truncate rounded-b'>
          {movie.title}
        </div>
      </Link>
    </div>
  );
});

const MovieList = observer(({models}) => {
  return (
    <div className='grid gap-6 grid-cols-4'>
      {models.map((movie) => <Poster key={movie.guid} movie={movie}/>)}
    </div>
  );
});

const Home = observer(({uiState}) => {
  return (
    <div className='py-16 px-64'>
      <div className='font-serif text-3xl mb-4 text-center'>{'Select a Movie'}</div>
      <InteractiveContext
        endpoint='/api/movies'
      >
        <Filter/>
        <MovieList/>
      </InteractiveContext>
    </div>
  );
});

export default Home;
