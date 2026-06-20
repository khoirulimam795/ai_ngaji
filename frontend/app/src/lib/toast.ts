import toast from 'react-hot-toast';

// Toast Success
export const toastSuccess = (message: string) => {
  toast.success(message, {
    style: {
      background: '#1A1A2E',
      color: '#4fff00',
      border: '1px solid rgba(79,255,0,0.3)',
    },
  });
};

// Toast Error
export const toastError = (message: string) => {
  toast.error(message, {
    style: {
      background: '#1A1A2E',
      color: '#E74C3C',
      border: '1px solid rgba(231,76,60,0.3)',
    },
  });
};

// Toast Info
export const toastInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#1A1A2E',
      color: '#E8DCC4',
      border: '1px solid rgba(255,255,255,0.1)',
    },
  });
};

// Toast Loading (untuk proses yang lama)
export const toastLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#1A1A2E',
      color: '#E8DCC4',
      border: '1px solid rgba(255,255,255,0.1)',
    },
  });
};

// Toast Promise (untuk async operations)
export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  }, {
    style: {
      background: '#1A1A2E',
      color: '#E8DCC4',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    success: {
      iconTheme: {
        primary: '#4fff00',
        secondary: '#0D1B2A',
      },
    },
    error: {
      iconTheme: {
        primary: '#E74C3C',
        secondary: '#0D1B2A',
      },
    },
  });
};