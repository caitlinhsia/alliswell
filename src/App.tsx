import { useEffect } from 'react';
import Notebook from './pages/Notebook';
import UndoToast from './components/UndoToast';
import MergeDialog from './components/MergeDialog';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      <Notebook />
      <UndoToast />
      <MergeDialog />
    </>
  );
}

export default App;
