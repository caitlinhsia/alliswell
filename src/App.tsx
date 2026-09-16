import { useEffect } from 'react';
import Notebook from './pages/Notebook';
import UndoToast from './components/UndoToast';
import MergeDialog from './components/MergeDialog';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';

function App() {
  const init = useAuthStore((s) => s.init);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    init();
  }, [init]);

  // the palette lives in CSS variables, so the theme is one attribute
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      <Notebook />
      <UndoToast />
      <MergeDialog />
    </>
  );
}

export default App;
