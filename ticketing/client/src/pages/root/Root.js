import React from 'react';
import { Outlet } from 'react-router-dom';

const Root = () => {
  return (
    <div className='text-powder bg-gunmetal flex flex-col min-h-screen'>
      {/* <Header/> */}
      <div className='flex-grow'>
        <Outlet/>
      </div>
      {/* <Footer/> */}
    </div>
  );
};

export default Root;
