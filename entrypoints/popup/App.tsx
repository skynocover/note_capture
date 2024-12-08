import { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { AppProvider } from './AppContext';
import { Toaster } from './components/ui/toaster';
import MainPage from './components/pages/mainPage';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <AppProvider>
          <Routes>
            <Route path="/" element={<MainPage />} />
          </Routes>
          <Toaster />
        </AppProvider>
      </Router>
    </>
  );
}

export default App;
