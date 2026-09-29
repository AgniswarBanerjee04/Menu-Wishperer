import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QRScannerTab } from '../components/wizard/QRScannerTab';
import { Step1MenuInput } from '../components/wizard/Step1MenuInput';
import { menusApi } from '../api/menus';
import type { MenuSession } from '../types';

// Mock html5-qrcode
vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: class {
      static getCameras = vi.fn().mockResolvedValue([
        { id: 'cam1', label: 'Back Camera' },
      ]);
      start = vi.fn().mockResolvedValue(undefined);
      stop = vi.fn().mockResolvedValue(undefined);
      clear = vi.fn().mockResolvedValue(undefined);
      scanFile = vi.fn().mockResolvedValue('https://testrestaurant.dotpe.in/menu');
      applyVideoConstraints = vi.fn().mockResolvedValue(undefined);
      isScanning = false;
    },
    Html5QrcodeSupportedFormats: {
      QR_CODE: 0,
    },
  };
});

// Mock audioChime
vi.mock('../utils/audioChime', () => ({
  playScanChime: vi.fn(),
  triggerScanHaptic: vi.fn(),
}));

// Mock menusApi
vi.mock('../api/menus', () => ({
  menusApi: {
    extractFromQR: vi.fn(),
    extractFromImage: vi.fn(),
    extractFromText: vi.fn(),
  },
}));

describe('QRScannerTab Component', () => {
  const mockOnMenuExtracted = vi.fn();
  const mockOnSwitchTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scanner viewport, camera launcher, standee drop trigger, and manual URL input', async () => {
    render(
      <QRScannerTab
        restaurantName="Bukhara"
        onMenuExtracted={mockOnMenuExtracted}
        onSwitchTab={mockOnSwitchTab}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Live Table QR Scanner')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /launch camera feed/i })).toBeInTheDocument();
    expect(screen.getByText(/or upload a saved photo of a table qr standee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/direct digital menu url/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/dotpe\.in\/menu or pdf/i)).toBeInTheDocument();
  });

  it('allows manual URL ingestion and calls menusApi.extractFromQR', async () => {
    const mockSession: MenuSession = {
      id: 'session-qr-123',
      restaurant_name: 'Pind Balluchi',
      raw_input_type: 'qr',
      dishes: [
        {
          id: 'dish-1',
          name: 'Dal Makhani',
          price: 280,
          category: 'Main Course',
          dietary: 'veg',
          description: 'Slow-cooked black lentils',
        },
      ],
      created_at: new Date().toISOString(),
    };

    vi.mocked(menusApi.extractFromQR).mockResolvedValueOnce(mockSession);

    render(
      <QRScannerTab
        restaurantName="Pind Balluchi"
        onMenuExtracted={mockOnMenuExtracted}
        onSwitchTab={mockOnSwitchTab}
      />
    );

    const input = screen.getByLabelText(/direct digital menu url/i);
    fireEvent.change(input, { target: { value: 'https://pindballuchi.dotpe.in/store/1' } });

    const submitBtn = screen.getByRole('button', { name: /ingest/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(menusApi.extractFromQR).toHaveBeenCalledWith(
        'https://pindballuchi.dotpe.in/store/1',
        'Pind Balluchi'
      );
      expect(mockOnMenuExtracted).toHaveBeenCalledWith(mockSession);
    });
  });

  it('displays graceful fallback modal when QR URL ingestion fails', async () => {
    vi.mocked(menusApi.extractFromQR).mockRejectedValueOnce(new Error('Network error or blocked app'));

    render(
      <QRScannerTab
        restaurantName="Locked Cafe"
        onMenuExtracted={mockOnMenuExtracted}
        onSwitchTab={mockOnSwitchTab}
      />
    );

    const input = screen.getByLabelText(/direct digital menu url/i);
    fireEvent.change(input, { target: { value: 'https://lockedportal.example.com/app' } });

    const submitBtn = screen.getByRole('button', { name: /ingest/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Digital Menu Notice')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/we opened the link, but couldn’t auto-read the items/i)
    ).toBeInTheDocument();

    // Test shortcut to switch to photo upload
    const snapBtn = screen.getByRole('button', { name: /snap a screenshot or photo/i });
    fireEvent.click(snapBtn);
    expect(mockOnSwitchTab).toHaveBeenCalledWith('upload');
  });

  it('quick sample links populate and trigger processUrlIngestion', async () => {
    const mockSession: MenuSession = {
      id: 'session-sample-1',
      restaurant_name: 'DotPe Sample',
      raw_input_type: 'qr',
      dishes: [],
      created_at: new Date().toISOString(),
    };
    vi.mocked(menusApi.extractFromQR).mockResolvedValueOnce(mockSession);

    render(
      <QRScannerTab
        onMenuExtracted={mockOnMenuExtracted}
        onSwitchTab={mockOnSwitchTab}
      />
    );

    const quickSampleBtn = screen.getByRole('button', { name: /pind balluchi \(dotpe\)/i });
    fireEvent.click(quickSampleBtn);

    await waitFor(() => {
      expect(menusApi.extractFromQR).toHaveBeenCalledWith(
        'https://pindballuchi.dotpe.in/store/1/delivery',
        undefined
      );
    });
  });
});

describe('Step1MenuInput 3-Way Segmented Control', () => {
  it('renders all three modes: Photograph / Upload, Scan Table QR, and Paste Menu Text', () => {
    const handleExtracted = vi.fn();
    render(<Step1MenuInput onMenuExtracted={handleExtracted} />);

    expect(screen.getByRole('button', { name: /photograph \/ upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan table qr/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste menu text/i })).toBeInTheDocument();

    // Default tab is upload
    expect(screen.getByText(/snap a photo or drop menu image here/i)).toBeInTheDocument();

    // Switch to Scan Table QR
    fireEvent.click(screen.getByRole('button', { name: /scan table qr/i }));
    expect(screen.getByText('Live Table QR Scanner')).toBeInTheDocument();

    // Switch to Paste Menu Text
    fireEvent.click(screen.getByRole('button', { name: /paste menu text/i }));
    expect(screen.getByPlaceholderText(/paste dishes, multi-column variants/i)).toBeInTheDocument();
  });
});
