// Register service worker for PWA functionality
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
};

// Check if app is installed as PWA
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Prompt user to install PWA (for browsers that support it)
export const requestPWAInstall = () => {
  if ((window as any).deferredPrompt) {
    (window as any).deferredPrompt.prompt();
    (window as any).deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      (window as any).deferredPrompt = null;
    });
  }
};

// Listen for beforeinstallprompt event
export const setupPWAPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
    console.log('PWA install prompt is ready');
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    (window as any).deferredPrompt = null;
  });
};
