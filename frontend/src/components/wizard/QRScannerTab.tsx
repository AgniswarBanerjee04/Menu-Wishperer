import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  QrCode,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Upload,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  Camera,
  FileText,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { menusApi } from '../../api/menus';
import type { MenuSession, VenueType, DiningMode } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { playScanChime, triggerScanHaptic } from '../../utils/audioChime';

interface QRScannerTabProps {
  restaurantName?: string;
  venueType?: VenueType;
  diningMode?: DiningMode;
  onMenuExtracted: (session: MenuSession) => void;
  onSwitchTab: (tab: 'upload' | 'text' | 'qr') => void;
}

const SAMPLE_QR_URLS = [
  { label: 'Pind Balluchi (DotPe)', url: 'https://pindballuchi.dotpe.in/store/1/delivery' },
  { label: 'Royal Dawat (PDF Menu)', url: 'https://royaldawat.menu/digital-menu.pdf' },
  { label: 'Bukhara Dine-in (Thrive)', url: 'https://bukhara.thrivenow.in/menu' },
];

export const QRScannerTab: React.FC<QRScannerTabProps> = ({
  restaurantName,
  venueType,
  diningMode,
  onMenuExtracted,
  onSwitchTab,
}) => {
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  // Manual / Detected URL state
  const [scannedUrl, setScannedUrl] = useState('');
  const [manualUrlInput, setManualUrlInput] = useState('');

  // Ingestion loading & stages
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStage, setIngestStage] = useState<'connecting' | 'extracting'>('connecting');
  const [successScanned, setSuccessScanned] = useState(false);

  // Error & Fallback Modal
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fallbackModalOpen, setFallbackModalOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const elementId = 'html5-qr-reader-viewport';

  // Discover available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      })
      .catch(() => {
        // Camera permissions might be requested later
      });

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // Ignore stop errors on unmount
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setTorchEnabled(false);
  };

  const startScanner = async () => {
    setCameraError(null);
    setErrorMsg(null);

    try {
      await stopScanner();

      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      const cameraIdOrConfig =
        cameras.length > 0
          ? cameras[activeCameraIndex]?.id || { facingMode: 'environment' }
          : { facingMode: 'environment' };

      await scanner.start(
        cameraIdOrConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQRDetected(decodedText);
        },
        () => {
          // Frame scan error / no QR in frame - ignore
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setIsScanning(false);
      setCameraError(
        err.message || 'Camera permission denied or camera not available. You can upload a QR image or enter URL below.'
      );
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextState = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }] as any,
      });
      setTorchEnabled(nextState);
    } catch {
      // Torch not supported by hardware/browser
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIdx);
    if (isScanning) {
      await stopScanner();
      setTimeout(() => {
        startScanner();
      }, 200);
    }
  };

  // Called when a QR code is detected (via camera or standee photo)
  const handleQRDetected = async (rawUrl: string) => {
    if (!rawUrl || isIngesting) return;

    // Provide immediate sensory feedback
    playScanChime();
    triggerScanHaptic();
    setSuccessScanned(true);
    setScannedUrl(rawUrl);

    // Stop scanner camera feed cleanly
    stopScanner();

    // Process ingestion
    processUrlIngestion(rawUrl);
  };

  // Scan QR from an uploaded photo of a table standee
  const handleStandeeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setCameraError(null);

    try {
      const html5Qr = new Html5Qrcode('qr-temp-file-decoder', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const decodedText = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      handleQRDetected(decodedText);
    } catch (err: any) {
      setErrorMsg(
        'Could not detect a clear QR code in this photo. Please ensure the QR standee is sharp and legible.'
      );
    } finally {
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = '';
      }
    }
  };

  // Process URL Ingestion through Backend Pipeline
  const processUrlIngestion = async (urlToIngest: string) => {
    setIsIngesting(true);
    setIngestStage('connecting');
    setErrorMsg(null);

    // Transition to stage 2 after a brief delay for realistic progress feedback
    const timer = setTimeout(() => {
      setIngestStage('extracting');
    }, 1500);

    try {
      const session = await menusApi.extractFromQR(urlToIngest.trim(), restaurantName, venueType, diningMode);
      clearTimeout(timer);
      onMenuExtracted(session);
    } catch (err: any) {
      clearTimeout(timer);
      setFailedUrl(urlToIngest);
      setFallbackModalOpen(true);
    } finally {
      setIsIngesting(false);
      setSuccessScanned(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrlInput.trim()) return;
    setScannedUrl(manualUrlInput.trim());
    processUrlIngestion(manualUrlInput.trim());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden container for image decoding */}
      <div id="qr-temp-file-decoder" className="hidden" />

      {/* Main Viewfinder Card */}
      <Card variant="default" className="relative overflow-hidden p-4 sm:p-6">
        
        {/* Viewfinder Frame */}
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-stone-900 border-2 border-[#C5A880]/60 shadow-2xl flex flex-col items-center justify-center">
          
          {/* Native Video Feed Container */}
          <div
            id={elementId}
            className="w-full h-full object-cover"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Luxury Antique Gold Corner Guides */}
          <div className="absolute inset-4 pointer-events-none z-10">
            {/* Top-Left */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-xl" />
            {/* Top-Right */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] rounded-tr-xl" />
            {/* Bottom-Left */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] rounded-bl-xl" />
            {/* Bottom-Right */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] rounded-br-xl" />
          </div>

          {/* Pulsating Scan Laser Beam (Active when scanning) */}
          {isScanning && <div className="qr-scanner-beam" />}

          {/* Overlay when Camera is NOT active */}
          {!isScanning && !isIngesting && (
            <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-15">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-400/30 text-gold-400 flex items-center justify-center shadow-md mb-3">
                <QrCode className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-white tracking-wide">
                Live Table QR Scanner
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-[240px]">
                Point camera at the table QR standee or card to auto-import the full digital menu.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={startScanner}
                className="mt-4 font-bold shadow-md shadow-gold-500/20"
                icon={<Camera className="w-4 h-4" />}
              >
                Launch Camera Feed
              </Button>
            </div>
          )}

          {/* Instant Scan Success Flash */}
          {successScanned && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <p className="text-sm font-bold text-white">QR Code Captured!</p>
              <p className="text-xs text-emerald-200 mt-1 truncate max-w-[250px]">{scannedUrl}</p>
            </div>
          )}

          {/* Loading Overlay: Connecting & Extracting */}
          {isIngesting && (
            <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center shadow-lg mb-3">
                <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
              </div>

              <h4 className="font-serif-display text-sm font-bold text-white">
                {ingestStage === 'connecting'
                  ? 'Connecting to digital table menu...'
                  : 'Extracting dishes & pricing...'}
              </h4>

              <p className="text-[11px] text-stone-400 mt-1 max-w-[260px]">
                {ingestStage === 'connecting'
                  ? 'Resolving portal catalog and downloading menu data...'
                  : 'Normalizing item categories, dietary tags, and ₹ prices via AI...'}
              </p>

              {/* Shimmering Gold Progress Track */}
              <div className="w-48 h-1.5 rounded-full bg-stone-800 overflow-hidden relative mt-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent animate-shimmer-gold bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {/* In-Viewfinder Floating Controls (Flashlight / Switch Camera / Close) */}
          {isScanning && (
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-25">
              <button
                type="button"
                onClick={toggleTorch}
                aria-label="Toggle Flashlight"
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-colors ${
                  torchEnabled
                    ? 'bg-gold-500 text-stone-950 border-gold-300'
                    : 'bg-stone-900/80 text-stone-200 border-stone-700 hover:bg-stone-800'
                }`}
              >
                {torchEnabled ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
              </button>

              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  aria-label="Switch Camera"
                  className="p-2.5 rounded-xl bg-stone-900/80 text-stone-200 border border-stone-700 hover:bg-stone-800 backdrop-blur-md transition-colors"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={stopScanner}
                className="px-3 py-2 rounded-xl bg-stone-900/80 text-stone-300 border border-stone-700 hover:bg-stone-800 backdrop-blur-md text-xs font-semibold"
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>

        {/* Camera Permission / Hardware Error Notice */}
        {cameraError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 max-w-sm mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-burgundy-50 dark:bg-burgundy-950/40 border border-burgundy-200 text-burgundy-800 dark:text-rose-300 text-xs flex items-start gap-2 max-w-sm mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Alternative: Drop photo of QR standee */}
        <div className="mt-5 max-w-sm mx-auto text-center pt-4 border-t border-[#E8E2D8] dark:border-[#3D352E]">
          <input
            ref={qrFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleStandeeImageUpload}
          />
          <button
            type="button"
            onClick={() => qrFileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gold-700 dark:text-gold-400 hover:text-gold-800 dark:hover:text-gold-300 hover:underline"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Or upload a saved photo of a table QR standee</span>
          </button>
        </div>
      </Card>

      {/* Direct URL Paste Section (Supports DotPe, Thrive, Petpooja, Zomato, Direct PDFs) */}
      <Card variant="default" className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="qr-url-input"
            className="text-xs font-bold uppercase tracking-wider text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-1.5"
          >
            <LinkIcon className="w-3.5 h-3.5 text-gold-500" />
            Direct Digital Menu URL
          </label>
          <span className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
            DotPe • Thrive • Petpooja • PDF Links
          </span>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            id="qr-url-input"
            type="url"
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="https://restaurant.dotpe.in/menu or PDF menu link..."
            className="flex-1 rounded-xl border border-[#E8E2D8] dark:border-[#3D352E] bg-white dark:bg-[#171513] px-3.5 py-2 text-xs text-[#1A1715] dark:text-[#F5F2EB] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!manualUrlInput.trim() || isIngesting}
            isLoading={isIngesting}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Ingest
          </Button>
        </form>

        {/* Quick Sample Table QR Links */}
        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[#635A52] dark:text-[#A89F95]">Quick samples:</span>
          {SAMPLE_QR_URLS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setManualUrlInput(sample.url);
                processUrlIngestion(sample.url);
              }}
              className="px-2 py-0.5 rounded-lg border border-gold-400/40 text-gold-800 dark:text-gold-300 hover:bg-gold-500/10 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Fallback Handling Modal (When Link is paywalled/locked/app-only) */}
      {fallbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#1B1917] border border-[#C5A880]/50 p-6 shadow-2xl space-y-4">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setFallbackModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <AlertCircle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#1A1715] dark:text-[#F5F2EB]">
                Digital Menu Notice
              </h3>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1.5 leading-relaxed">
                We opened the link, but couldn’t auto-read the items. The restaurant portal may require an app login, session token, or dynamic single-page rendering.
              </p>
            </div>

            {/* Direct Shortcuts */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => {
                  setFallbackModalOpen(false);
                  onSwitchTab('upload');
                }}
                icon={<Camera className="w-4 h-4" />}
              >
                📸 Snap a Screenshot or Photo of Menu
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => {
                  setFallbackModalOpen(false);
                  onSwitchTab('text');
                }}
                icon={<FileText className="w-4 h-4" />}
              >
                📝 Paste Menu Text Directly
              </Button>

              {failedUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gold-700 dark:text-gold-400"
                  onClick={() => window.open(failedUrl, '_blank', 'noopener,noreferrer')}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Open Link in New Window
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
