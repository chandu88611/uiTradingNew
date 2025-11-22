import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';

function PublicLayout() {

    return (
        <div>
          <Header/>
          {/* <div className='pt-14'> */}

     <Outlet />  
          {/* </div> */}
          <Footer/>
        </div>
    );
}

export default PublicLayout;