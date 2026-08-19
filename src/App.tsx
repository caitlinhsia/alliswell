import { Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Study from './pages/Study';
import Journal from './pages/Journal';
import StickyNotes from './pages/StickyNotes';

function App() {
  return (
    <div className="h-screen flex flex-col md:flex-row paper-texture overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/study" element={<Study />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/notes" element={<StickyNotes />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
