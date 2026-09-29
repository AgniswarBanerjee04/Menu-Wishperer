import React, { useState, useRef } from 'react';
import { Camera, FileText, QrCode, Upload, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { menusApi } from '../../api/menus';
import type { MenuSession, VenueType, DiningMode } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { QRScannerTab } from './QRScannerTab';

interface Step1MenuInputProps {
  venueType?: VenueType;
  diningMode?: DiningMode;
  onMenuExtracted: (session: MenuSession) => void;
}

const SAMPLE_RESTAURANT_TEXT = `Golden Dragon & Royal Dawat
ITEMS | VEG | CHICKEN | MIXED
Brown Garlic Noodles | 140 | 160 | -
Hakka Noodles | 120 | 150 | 180
Egg Fried Rice Rs. 145/-
Murgh Malai Tikka 420/-
Paneer Butter Masala 340/-
Dal Makhani (Half 180 / Full 280)
Butter Garlic Naan 85/-`;

const SAMPLE_CAFE_TEXT = `Artisanal Roast & Baker Café
ITEMS | HOT | ICED | OAT MILK
Artisanal Pour-Over Coffee | 220 | 240 | -
Flat White | 210 | 230 | 260
Spanish Iced Latte | 240 | 260 | 290
Cortado 190/-
Sourdough Avocado & Poached Egg Toast 320/-
Truffle Mushroom Melt Panini 340/-
Almond Butter & Pain Au Chocolat 180/-
Smoked Chicken & Pesto Croissant 360/-
Acai Berry Granola Bowl 310/-`;

export const Step1MenuInput: React.FC<Step1MenuInputProps> = ({
  venueType = 'restaurant',
  diningMode = 'personal',
  onMenuExtracted,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'qr' | 'text'>('upload');
  const [restaurantName, setRestaurantName] = useState('');
  const [menuText, setMenuText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Selected image exceeds the 5 MB maximum size limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Please drop a JPEG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Selected image exceeds the 5 MB maximum size limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleExtract = async () => {
    setError(null);
    setIsExtracting(true);

    try {
      let session: MenuSession;
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Please choose or photograph a menu image first.');
          setIsExtracting(false);
          return;
        }
        session = await menusApi.extractFromImage(
          selectedFile,
          restaurantName.trim() || undefined,
          venueType,
          diningMode
        );
      } else {
        if (!menuText.trim()) {
          setError('Please paste menu text into the box.');
          setIsExtracting(false);
          return;
        }
        session = await menusApi.extractFromText(
          menuText.trim(),
          restaurantName.trim() || undefined,
          venueType,
          diningMode
        );
      }

      onMenuExtracted(session);
    } catch (err: any) {
      setError(err.message || 'Failed to extract menu. Please make sure the menu is legible or paste text directly.');
    } finally {
      setIsExtracting(false);
    }
  };

  const loadSampleMenu = () => {
    setActiveTab('text');
    if (venueType === 'cafe') {
      setRestaurantName('Artisanal Roast & Baker Café');
      setMenuText(SAMPLE_CAFE_TEXT);
    } else {
      setRestaurantName('Golden Dragon & Royal Dawat');
      setMenuText(SAMPLE_RESTAURANT_TEXT);
    }
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-600">
      {/* Intro Heading */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-700 dark:text-gold-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 fill-current text-gold-500" /> Step 3: Capture Menu
        </div>
        <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1715] dark:text-[#F5F2EB] tracking-tight">
          Capture or Paste Your Menu
        </h2>
        <p className="text-sm text-[#635A52] dark:text-[#A89F95] mt-1">
          {venueType === 'cafe'
            ? 'Snap a photo of the café counter, chalkboard, paper menu, or scan the table QR code.'
            : 'Take a photo of any restaurant menu, upload a file, or paste dishes with tabular pricing.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-burgundy-50 dark:bg-burgundy-950/40 border border-burgundy-200 dark:border-burgundy-900 text-burgundy-700 dark:text-rose-300 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Restaurant Name Field */}
      <Card variant="default">
        <Input
          id="menu-restaurant-name"
          label="Restaurant Name (optional)"
          placeholder="e.g., Dum Pukht, Golden Dragon, Bukhara, Peter Cat"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
        />
      </Card>

      {/* Luxury Pill-Slider Input Mode Tabs (3 Modes) */}
      <div className="flex flex-col sm:flex-row rounded-2xl bg-stone-200/70 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-[#25221F] text-[#1A1715] dark:text-[#F5F2EB] shadow-sm border border-stone-200/80 dark:border-stone-700/60'
              : 'text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4 text-gold-500 shrink-0" />
          <span>Photograph / Upload</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'qr'
              ? 'bg-white dark:bg-[#25221F] text-[#1A1715] dark:text-[#F5F2EB] shadow-sm border border-stone-200/80 dark:border-stone-700/60'
              : 'text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4 text-gold-500 shrink-0" />
          <span>Scan Table QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'text'
              ? 'bg-white dark:bg-[#25221F] text-[#1A1715] dark:text-[#F5F2EB] shadow-sm border border-stone-200/80 dark:border-stone-700/60'
              : 'text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-gold-500 shrink-0" />
          <span>Paste Menu Text</span>
        </button>
      </div>

      {/* Tab 1: Image Upload / Camera */}
      {activeTab === 'upload' && (
        <Card variant="default" className="text-center relative overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative max-h-80 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 flex items-center justify-center shadow-inner">
                <img
                  src={previewUrl}
                  alt="Menu Preview"
                  className="max-h-80 w-auto object-contain"
                />

                {/* Shimmering Gold Scanning Beam Overlay */}
                {isExtracting && (
                  <>
                    <div className="scanner-laser" />
                    <div className="absolute inset-0 bg-gradient-to-b from-gold-400/10 via-transparent to-gold-400/10 pointer-events-none" />
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExtracting}
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Camera className="w-4 h-4" />}
                >
                  Change Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isExtracting}
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-gold-400 rounded-2xl p-8 cursor-pointer transition-all hover:bg-gold-500/5 flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gold-400/10 border border-gold-400/30 text-gold-600 dark:text-gold-300 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-[#1A1715] dark:text-[#F5F2EB] text-sm">
                  Snap a photo or drop menu image here
                </p>
                <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1">
                  Supports multi-column and tabular Indian restaurant menus (JPEG, PNG, WEBP up to 5 MB)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 pointer-events-none"
                icon={<Upload className="w-4 h-4" />}
              >
                Browse Photos
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Live QR Scanner */}
      {activeTab === 'qr' && (
        <QRScannerTab
          restaurantName={restaurantName}
          venueType={venueType}
          diningMode={diningMode}
          onMenuExtracted={onMenuExtracted}
          onSwitchTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Tab 3: Paste Menu Text */}
      {activeTab === 'text' && (
        <Card variant="default">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1A1715] dark:text-[#F5F2EB]">
                Menu Text (Hindi / English / Tabular)
              </label>
              <button
                type="button"
                onClick={loadSampleMenu}
                className="text-xs font-semibold text-gold-700 dark:text-gold-400 hover:underline flex items-center gap-1 transition-colors self-start"
              >
                {venueType === 'cafe' ? '⚡ Load Artisanal Café Sample' : '⚡ Load Royal Tabular Sample'}
              </button>
            </div>
            <textarea
              rows={8}
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder={
                venueType === 'cafe'
                  ? 'Paste café coffees, roasts, viennoiserie, toasts, sandwiches, and prices here...'
                  : 'Paste dishes, multi-column variants (e.g. VEG: 140 | CHICKEN: 160, Half/Full), and prices here...'
              }
              className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#171513] p-3.5 text-xs font-mono text-[#1A1715] dark:text-[#F5F2EB] placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400"
            />
          </div>
        </Card>
      )}

      {/* Shimmering Gold Skeleton Scanner Overlay during extraction */}
      {isExtracting && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1917] border border-gold-400/40 shadow-luxe-light dark:shadow-luxe-dark text-center animate-fade-slide-up space-y-3">
          <div className="flex items-center justify-center gap-2.5 text-gold-700 dark:text-gold-300 font-bold text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
            <span>AI Concierge Digitizing Menu with Precision...</span>
          </div>
          <p className="text-xs text-[#635A52] dark:text-[#A89F95] max-w-md mx-auto">
            {venueType === 'cafe'
              ? 'Analyzing specialty roasts, barista variants, baked pastries, and single portions.'
              : 'Applying structural layout scan, column header disambiguation, and price normalization.'}
          </p>
          {/* Classy Gold Shimmer Bar */}
          <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent animate-shimmer-gold bg-[length:200%_100%]" />
          </div>
        </div>
      )}

      {/* Bottom Action Bar (for upload & text tabs) */}
      {activeTab !== 'qr' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={loadSampleMenu}
            className="text-xs font-medium text-[#635A52] dark:text-[#A89F95] hover:text-gold-600 dark:hover:text-gold-400 underline underline-offset-4 transition-colors"
          >
            {venueType === 'cafe'
              ? 'No menu on hand? Try the Artisanal Roast & Baker Café sample'
              : 'No menu on hand? Try the Golden Dragon & Royal Dawat sample'}
          </button>

          <Button
            size="lg"
            variant="primary"
            className="w-full sm:w-auto shadow-md"
            isLoading={isExtracting}
            onClick={handleExtract}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {isExtracting ? 'Scanning Menu with AI...' : 'Extract Dishes (₹)'}
          </Button>
        </div>
      )}
    </div>
  );
};
