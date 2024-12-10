import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { AppProvider } from './AppContext';
import { Toaster } from './components/ui/toaster';
import MainPage from './components/pages/mainPage';
import { NotionProvider } from './lib/notion/NotionContext';

function App() {
  return (
    <>
      <NotionProvider>
        <Router>
          <AppProvider>
            <Routes>
              <Route path="/" element={<MainPage />} />
            </Routes>
            <Toaster />
          </AppProvider>
        </Router>
      </NotionProvider>
    </>
  );
}

export default App;
