import '@testing-library/jest-dom';

// Mock the Web Audio API which isn't available in the jest environment
class AudioContextMock {
  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      fftSize: 2048,
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn(),
    };
  }
  
  createOscillator() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 },
      type: 'sine',
    };
  }
  
  createGain() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: { value: 0 },
    };
  }
  
  destination: any = {};
}

// Mock MediaDevices
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: AudioContextMock,
});

Object.defineProperty(window, 'MediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        getTracks: () => [{
          stop: jest.fn(),
        }],
      });
    }),
  },
});

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        getTracks: () => [{
          stop: jest.fn(),
        }],
      });
    }),
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Silence console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleError(...args);
};