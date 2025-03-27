import React from 'react';

const Loading = () => {
  return (
    <div className='flex justify-center items-center gap-2 mt-16'>
      <div className='w-4 h-4 rounded-full bg-amethyst animate-bounce'></div>
      <div className='w-4 h-4 rounded-full bg-amethyst animate-bounce [animation-delay:-.3s]'></div>
      <div className='w-4 h-4 rounded-full bg-amethyst animate-bounce [animation-delay:-.5s]'></div>
    </div>
  )
};

export default Loading;
