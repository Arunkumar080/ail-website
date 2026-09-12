import { useEffect } from 'react';
import { synth } from './audio/synth.ts';
import { PerimeterNode } from './components/PerimeterNode.tsx';

export default function App() {
  // Tear down every oscillator and close the AudioContext when the app unmounts or the page is hidden for good.
  useEffect(() => {
    const onPageHide = () => synth.dispose();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      synth.dispose();
    };
  }, []);
  return <PerimeterNode />;
}
