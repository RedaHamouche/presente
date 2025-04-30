import { useEffect } from 'react';
import { useStatus } from '../context/StatusContext';

export const useMockNearbyDetection = () => {
  const { isOpen, setHasMatch } = useStatus();

  useEffect(() => {
    if (!isOpen) {
      setHasMatch(false);
      return;
    }

    // Simuler la détection d'un utilisateur à proximité
    const detectionInterval = setInterval(() => {
      // Pour le prototype, on simule un match aléatoire toutes les 5 secondes
      const hasNearbyUser = Math.random() > 0.5;
      setHasMatch(hasNearbyUser);
    }, 5000);

    return () => clearInterval(detectionInterval);
  }, [isOpen, setHasMatch]);
}; 