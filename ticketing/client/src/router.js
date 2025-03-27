import { createBrowserRouter } from 'react-router-dom';
import { Root } from './pages/root';
import { Home } from './pages/home';
import { SeatSelector } from './pages/seat_selector';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Root/>,
    children: [
      {
        path: '/select-seats/:guid',
        element: <SeatSelector/>
      },
      {
        path: '/',
        element: <Home/>
      }
    ]
  },
]);

export default router;
