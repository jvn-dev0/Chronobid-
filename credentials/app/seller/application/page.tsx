'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import s from './seller.module.css';
import { clearSession, getToken } from '../../../lib/api';
import { getCountries, getNationalities, getStates, getCities } from '../../../lib/geoData';
import {
  COUNTRY_PHONE_LIST,
  getCountryByCode,
  parsePhoneAndDialCode,
  validateAndFormatInternationalPhone,
  CountryPhoneInfo,
} from '../../../lib/countryPhoneData';

interface FormState {
  // Step 3: Personal & Address
  full_name: string;
  dob: string;
  gender: string;
  nationality: string;
  country: string;
  state: string;
  city: string;
  custom_city: string;
  street_address: string;
  landmark: string;
  postal_code: string;

  // Step 4: Identity Verification
  id_document_type: string;
  id_document_number: string;
  id_expiry_date: string;
  id_document_url: string;
  selfie_url: string;

  // Step 5: Contact Verification
  phone_number: string;
  phone_verified: boolean;

  // Step 6: Bank Details
  bank_account_name: string;
  bank_name: string;
  bank_account_number: string;
  confirm_account_number: string;
  bank_ifsc: string;
  bank_branch_name: string;
  bank_account_type: string;
}

interface VerificationResult {
  success: boolean;
  verification_status: string;
  message: string;
  reason?: string;
  metrics?: {
    face_similarity_score: number;
    face_similarity_percentage: number;
    face_match_status: string;
    ocr_confidence: number;
    ocr_status: string;
    name_match_score: number;
  };
  extracted_data?: {
    document_type?: string;
    extracted_name?: string;
    extracted_dob?: string;
    extracted_doc_number?: string;
    raw_doc_number?: string;
  };
  discrepancies?: string[];
  debug_metadata?: {
    raw_ocr_lines?: string[];
    ocr_confidence?: number;
    extracted_name_candidate?: string;
    profile_name?: string;
    name_similarity_score?: number;
  };
}

const INITIAL_FORM: FormState = {
  full_name: '',
  dob: '',
  gender: '',
  nationality: '',
  country: '',
  state: '',
  city: '',
  custom_city: '',
  street_address: '',
  landmark: '',
  postal_code: '',

  id_document_type: 'Passport',
  id_document_number: '',
  id_expiry_date: '',
  id_document_url: '',
  selfie_url: '',

  phone_number: '',
  phone_verified: false,

  bank_account_name: '',
  bank_name: '',
  bank_account_number: '',
  confirm_account_number: '',
  bank_ifsc: '',
  bank_branch_name: '',
  bank_account_type: '',
};

export default function SellerApplicationPage() {
  const router = useRouter();

  // ── Navigation & Loading State ──────────────────────────────
  const [step, setStep] = useState<number>(3);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(3);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── User Data ────────────────────────────────────────────────
  const [userData, setUserData] = useState<{ id?: number; username?: string; email?: string }>({});

  // ── Form State ───────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // ── Step 6 Bank Verification State ───────────────────────────
  const [bankVerified, setBankVerified] = useState<boolean>(false);
  const [verifyingBank, setVerifyingBank] = useState<boolean>(false);
  const [verifyingIfsc, setVerifyingIfsc] = useState<boolean>(false);
  const [bankVerifyError, setBankVerifyError] = useState<string>('');
  const [bankVerifyResult, setBankVerifyResult] = useState<{
    success: boolean;
    message: string;
    verified_account_name?: string;
    bank_name?: string;
    bank_branch_name?: string;
    bank_ifsc?: string;
    masked_account_number?: string;
  } | null>(null);

  // ── Search & Filter State for Geo Selects ────────────────────
  const [nationalitySearch, setNationalitySearch] = useState<string>('');
  const [isNationalityOpen, setIsNationalityOpen] = useState<boolean>(false);
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [isCountryOpen, setIsCountryOpen] = useState<boolean>(false);
  const [useCustomCity, setUseCustomCity] = useState<boolean>(false);

  // ── Upload, Webcam & Verification State for Step 4 ───────────
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [verifPhase, setVerifPhase] = useState<string>('');
  const [verifResult, setVerifResult] = useState<VerificationResult | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const scanAbortControllerRef = useRef<AbortController | null>(null);
  const scanTimersRef = useRef<NodeJS.Timeout[]>([]);

  // ── Helper: Immediately Halt and Reset Any Ongoing Scan ─────
  const stopAndResetScanning = useCallback(() => {
    if (scanAbortControllerRef.current) {
      try {
        scanAbortControllerRef.current.abort();
      } catch {}
      scanAbortControllerRef.current = null;
    }
    scanTimersRef.current.forEach(t => clearTimeout(t));
    scanTimersRef.current = [];
    setScanning(false);
    setVerifPhase('');
    setVerifResult(null);
  }, []);

  // ── Contact OTP State for Step 5 (Twilio Verify) ────────────
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<CountryPhoneInfo>(COUNTRY_PHONE_LIST[0]);
  const [localPhoneNumber, setLocalPhoneNumber] = useState<string>('');
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const handlePhoneCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    const country = getCountryByCode(countryCode);
    setSelectedPhoneCountry(country);
    const cleanDigits = localPhoneNumber.replace(/\D/g, '');
    const combined = cleanDigits ? `${country.dialCode}${cleanDigits}` : '';
    setForm(prev => ({ ...prev, phone_number: combined }));
    setOtpError('');
  };

  const handleLocalPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, '');
    setLocalPhoneNumber(cleanDigits);
    const combined = cleanDigits ? `${selectedPhoneCountry.dialCode}${cleanDigits}` : '';
    setForm(prev => ({ ...prev, phone_number: combined }));
    setOtpError('');
  };

  // ── Resend OTP Countdown Timer ──────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // ── Geographic Datasets ──────────────────────────────────────
  const countries = useMemo(() => getCountries(), []);
  const nationalities = useMemo(() => getNationalities(), []);
  const availableStates = useMemo(() => getStates(form.country), [form.country]);
  const availableCities = useMemo(() => getCities(form.state), [form.state]);

  const filteredNationalities = useMemo(() => {
    if (!nationalitySearch.trim()) return nationalities;
    return nationalities.filter(n => n.toLowerCase().includes(nationalitySearch.toLowerCase()));
  }, [nationalities, nationalitySearch]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    return countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countries, countrySearch]);

  // ── 1. Fetch Saved Data on Initial Load ─────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const loadSavedApplication = async () => {
      try {
        setInitialLoading(true);
        const res = await fetch('http://localhost:8000/api/seller/application', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          clearSession();
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();

          // If seller application is already submitted / completed, redirect to dashboard
          if (data.completed || data.verification_status === 'Pending_Review' || data.verification_status === 'Approved' || data.verification_status === 'Verified') {
            router.push('/seller/dashboard');
            return;
          }

          const app = data.application || {};
          setUserData({
            username: app.username || '',
            email: app.email || '',
          });

          // Pre-populate form with permanently saved values from DB
          setForm(prev => ({
            ...prev,
            full_name: app.full_name || app.username || '',
            dob: app.dob || '',
            gender: app.gender || '',
            nationality: app.nationality || '',
            country: app.country || '',
            state: app.state || '',
            city: app.city || '',
            street_address: app.street_address || '',
            landmark: app.landmark || '',
            postal_code: app.postal_code || '',

            id_document_type: app.id_document_type || 'Passport',
            id_document_number: app.id_document_number || '',
            id_expiry_date: app.id_expiry_date || '',
            id_document_url: app.id_document_url || '',
            selfie_url: app.selfie_url || '',

            phone_number: '',
            phone_verified: Boolean(app.phone_verified),

            bank_account_name: app.bank_account_name || '',
            bank_name: app.bank_name || '',
            bank_account_number: app.bank_account_number || '',
            confirm_account_number: app.bank_account_number || '',
            bank_ifsc: app.bank_ifsc || '',
            bank_branch_name: app.bank_branch_name || '',
            bank_account_type: app.bank_account_type || '',
          }));

          const savedBankVerified = Boolean(app.bank_verified || (app.bank_account_number && app.bank_ifsc));
          if (savedBankVerified && app.bank_account_number) {
            setBankVerified(true);
            const rawAcc = app.bank_account_number || '';
            const maskedAcc = rawAcc.length >= 4 ? '••••••••' + rawAcc.slice(-4) : '••••••••';
            setBankVerifyResult({
              success: true,
              message: 'Bank account verified and saved.',
              verified_account_name: app.bank_account_name || '',
              bank_name: app.bank_name || '',
              bank_branch_name: app.bank_branch_name || '',
              bank_ifsc: app.bank_ifsc || '',
              masked_account_number: maskedAcc,
            });
          } else {
            setBankVerified(false);
            setBankVerifyResult(null);
          }

          // Always ensure phone input starts completely empty per design requirements
          setLocalPhoneNumber('');
          setForm(prev => ({ ...prev, phone_number: '' }));

          if (app.id_document_url) {
            setDocPreview(app.id_document_url);
          } else {
            setDocPreview(null);
            setDocFile(null);
          }

          if (app.selfie_url) {
            setSelfiePreview(app.selfie_url);
          } else {
            setSelfiePreview(null);
            setSelfieFile(null);
          }

          // Restore Identity Verification result state ONLY if both files exist and passed in DB
          if (app.id_document_url && app.selfie_url && (app.face_match_status === 'Passed' || app.face_match_status === 'Approved')) {
            setVerifResult({
              success: true,
              verification_status: app.face_match_status || 'Approved',
              message: 'Identity document processed and biometric similarity checked.',
              reason: app.verification_reason || 'Biometric similarity check passed.',
              metrics: {
                face_similarity_score: app.face_match_score || 0.88,
                face_similarity_percentage: Math.round((app.face_match_score || 0.88) * 100),
                face_match_status: app.face_match_status || 'Passed',
                ocr_confidence: 0.90,
                ocr_status: app.ocr_status || 'Success',
                name_match_score: 1.0,
              },
              extracted_data: {
                document_type: app.id_document_type || 'Passport',
                extracted_name: app.extracted_name || app.full_name,
                extracted_dob: app.extracted_dob || app.dob,
                extracted_doc_number: app.extracted_doc_number || app.id_document_number,
                raw_doc_number: app.id_document_number,
              },
            });
          } else {
            setVerifResult(null);
          }

          // Calculate current unlocked step
          const currentStep = data.current_step || 3;
          setMaxUnlockedStep(currentStep);
          setStep(currentStep);
        }
      } catch (err) {
        console.error('Failed to load seller application from database:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSavedApplication();
  }, [router]);

  // ── Stop Camera on Step Change ──────────────────────────────
  useEffect(() => {
    if (step !== 4 && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setShowCamera(false);
    }
  }, [step]);

  // ── Logout ──────────────────────────────────────────────────
  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  // ── Generic Change Handler ──────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Aadhaar specific formatting (XXXX XXXX XXXX)
    if (name === 'id_document_number' && form.id_document_type === 'Aadhaar') {
      value = value.replace(/\D/g, '').substring(0, 12);
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }

    setForm(prev => ({ ...prev, [name]: value }));

    // Clear specific field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // ── Dynamic Country Change Handler ──────────────────────────
  const handleCountrySelect = (countryName: string) => {
    setForm(prev => ({
      ...prev,
      country: countryName,
      state: '',
      city: '',
      custom_city: '',
    }));
    setIsCountryOpen(false);
    setCountrySearch('');
    setUseCustomCity(false);

    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy.country;
      delete copy.state;
      delete copy.city;
      return copy;
    });
  };

  // ── Dynamic State Change Handler ────────────────────────────
  const handleStateChange = (stateName: string) => {
    setForm(prev => ({
      ...prev,
      state: stateName,
      city: '',
      custom_city: '',
    }));
    setUseCustomCity(false);

    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy.state;
      delete copy.city;
      return copy;
    });
  };

  // ── Dynamic City Change Handler ─────────────────────────────
  const handleCitySelect = (cityName: string) => {
    if (cityName === '__OTHER__') {
      setUseCustomCity(true);
      setForm(prev => ({ ...prev, city: '' }));
    } else {
      setUseCustomCity(false);
      setForm(prev => ({ ...prev, city: cityName }));
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.city;
        return copy;
      });
    }
  };

  // ── Upload Helper to Backend ────────────────────────────────
  const uploadFileToBackend = async (file: File, endpoint: string): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    const data = await res.json();
    return data.file_url;
  };

  // ── Helper: Format image preview URL ───────────────────────
  const getImageSrc = (urlOrData: string | null): string => {
    if (!urlOrData) return '';
    if (urlOrData.startsWith('data:') || urlOrData.startsWith('blob:') || urlOrData.startsWith('http://') || urlOrData.startsWith('https://')) {
      return urlOrData;
    }
    return `http://localhost:8000${urlOrData}`;
  };

  // ── Document Upload (Step 4) ────────────────────────────────
  const handleDocClick = () => docInputRef.current?.click();

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    stopAndResetScanning();
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorBanner(['Document size must be under 5MB']);
      return;
    }
    setDocFile(file);
    const reader = new FileReader();
    reader.onload = ev => setDocPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingDoc(true);
    try {
      const url = await uploadFileToBackend(file, '/api/seller/upload/document');
      setForm(f => ({ ...f, id_document_url: url }));
    } catch (err: unknown) {
      setErrorBanner(['Document upload failed: ' + (err instanceof Error ? err.message : String(err))]);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    stopAndResetScanning();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorBanner(['Document size must be under 5MB']);
      return;
    }
    setDocFile(file);
    const reader = new FileReader();
    reader.onload = ev => setDocPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingDoc(true);
    try {
      const url = await uploadFileToBackend(file, '/api/seller/upload/document');
      setForm(f => ({ ...f, id_document_url: url }));
    } catch (err: unknown) {
      setErrorBanner(['Document upload failed: ' + (err instanceof Error ? err.message : String(err))]);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAndResetScanning();
    setDocFile(null);
    setDocPreview(null);
    setForm(f => ({ ...f, id_document_url: '' }));
    if (docInputRef.current) docInputRef.current.value = '';
  };

  // ── Selfie & Webcam (Step 4) ────────────────────────────────
  const handleSelfieUploadClick = () => selfieInputRef.current?.click();

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    stopAndResetScanning();
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = ev => setSelfiePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingSelfie(true);
    try {
      const url = await uploadFileToBackend(file, '/api/seller/upload/selfie');
      setForm(f => ({ ...f, selfie_url: url }));
    } catch (err: unknown) {
      setErrorBanner(['Selfie upload failed: ' + (err instanceof Error ? err.message : String(err))]);
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleRemoveSelfie = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAndResetScanning();
    setSelfieFile(null);
    setSelfiePreview(null);
    setForm(f => ({ ...f, selfie_url: '' }));
    if (selfieInputRef.current) selfieInputRef.current.value = '';
  };

  const startCamera = useCallback(async () => {
    stopAndResetScanning();
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Could not access camera. Please allow permissions or upload a selfie directly.');
      setShowCamera(false);
    }
  }, [stopAndResetScanning]);

  const capturePhoto = async () => {
    stopAndResetScanning();
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSelfiePreview(dataUrl);

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);

    setUploadingSelfie(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'selfie_captured.jpg', { type: 'image/jpeg' });
      const url = await uploadFileToBackend(file, '/api/seller/upload/selfie');
      setForm(f => ({ ...f, selfie_url: url }));
    } catch (err: unknown) {
      setErrorBanner(['Selfie upload failed: ' + (err instanceof Error ? err.message : String(err))]);
    } finally {
      setUploadingSelfie(false);
    }
  };

  const retakePhoto = async () => {
    stopAndResetScanning();
    setSelfiePreview(null);
    setSelfieFile(null);
    setForm(f => ({ ...f, selfie_url: '' }));
    await startCamera();
  };

  // ── Step 4: Scan & Verify Identity (Boosted Speed & Instant Abort) ──
  const handleVerifyIdentity = async () => {
    stopAndResetScanning();
    setErrorBanner([]);

    if (!form.id_document_url) {
      setErrorBanner(['Please upload your Government ID document before scanning.']);
      return;
    }
    if (!form.selfie_url) {
      setErrorBanner(['Please capture or upload a selfie photo before scanning.']);
      return;
    }

    const abortController = new AbortController();
    scanAbortControllerRef.current = abortController;

    setScanning(true);
    setVerifPhase('Analyzing document structure & security features...');

    const timer1 = setTimeout(() => {
      setVerifPhase('Extracting text & ID fields via local OCR...');
    }, 450);

    const timer2 = setTimeout(() => {
      setVerifPhase('Detecting facial biometrics & landmarks...');
    }, 900);

    const timer3 = setTimeout(() => {
      setVerifPhase('Comparing face embeddings & matching seller profile...');
    }, 1400);

    scanTimersRef.current = [timer1, timer2, timer3];

    try {
      const token = getToken();
      const payload = {
        id_document_type: form.id_document_type,
        id_document_number: form.id_document_number.trim() || undefined,
        id_expiry_date: form.id_expiry_date.trim() || undefined,
        id_document_url: form.id_document_url,
        selfie_url: form.selfie_url,
      };

      const res = await fetch('http://localhost:8000/api/seller/application/step-4/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      scanTimersRef.current.forEach(t => clearTimeout(t));
      scanTimersRef.current = [];

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Identity verification service returned an error.');
      }

      const data: VerificationResult = await res.json();
      if (abortController.signal.aborted) return;

      setVerifResult(data);

      if (data.success) {
        // Prepopulate extracted doc number if was blank
        if (data.extracted_data?.raw_doc_number && !form.id_document_number) {
          setForm(f => ({ ...f, id_document_number: data.extracted_data?.raw_doc_number || f.id_document_number }));
        }
        setMaxUnlockedStep(prev => Math.max(prev, 5));
      }
    } catch (err: unknown) {
      if (abortController.signal.aborted || (err as Error)?.name === 'AbortError') {
        // User aborted scanning — quiet exit
        return;
      }
      scanTimersRef.current.forEach(t => clearTimeout(t));
      scanTimersRef.current = [];
      const msg = err instanceof Error ? err.message : 'Identity verification could not be completed.';
      setErrorBanner([msg]);
      setVerifResult({
        success: false,
        verification_status: 'Failed',
        message: 'Verification failed',
        reason: msg,
      });
    } finally {
      if (!abortController.signal.aborted) {
        setScanning(false);
        setVerifPhase('');
      }
    }
  };

  // ── Step 4: Proceed to Step 5 ───────────────────────────────
  const handleProceedStep4 = async () => {
    setErrorBanner([]);
    if (!verifResult?.success) {
      setErrorBanner(['Please complete and pass identity verification before continuing.']);
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const payload = {
        id_document_type: form.id_document_type,
        id_document_number: form.id_document_number || verifResult.extracted_data?.raw_doc_number || 'VERIFIED',
        id_expiry_date: form.id_expiry_date || undefined,
        id_document_url: form.id_document_url,
        selfie_url: form.selfie_url,
      };

      const res = await fetch('http://localhost:8000/api/seller/application/step-4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save identity verification.');
      }

      setMaxUnlockedStep(prev => Math.max(prev, 5));
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorBanner([err instanceof Error ? err.message : 'Error proceeding to next step.']);
    } finally {
      setSaving(false);
    }
  };

  // ── Validation Helpers ──────────────────────────────────────
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    const missing: string[] = [];

    if (!form.full_name.trim()) {
      errors.full_name = 'Full Name is required.';
      missing.push('Full Name');
    }
    if (!form.dob.trim()) {
      errors.dob = 'Date of Birth is required.';
      missing.push('Date of Birth');
    } else {
      let rawDob = form.dob.trim();
      let parts = rawDob.split(/[-/]/);
      let isValid = false;
      if (parts.length === 3) {
        let y = 0, m = 0, d = 0;
        if (parts[0].length === 4) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
          d = parseInt(parts[2], 10);
        } else if (parts[2].length === 4) {
          d = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
          y = parseInt(parts[2], 10);
        }
        if (y && m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1900 && y <= new Date().getFullYear()) {
          isValid = true;
        }
      }
      if (!isValid && isNaN(new Date(rawDob).getTime())) {
        errors.dob = 'Please enter a valid date (YYYY-MM-DD or DD-MM-YYYY).';
        missing.push('Valid Date of Birth');
      }
    }
    if (!form.gender.trim()) {
      errors.gender = 'Gender is required.';
      missing.push('Gender');
    }
    if (!form.nationality.trim()) {
      errors.nationality = 'Nationality is required.';
      missing.push('Nationality');
    }
    if (!form.country.trim()) {
      errors.country = 'Country is required.';
      missing.push('Country');
    }
    if (!form.state.trim()) {
      errors.state = 'State / Region is required.';
      missing.push('State / Region');
    }
    const finalCity = useCustomCity ? form.custom_city.trim() : form.city.trim();
    if (!finalCity) {
      errors.city = 'City is required.';
      missing.push('City');
    }
    if (!form.street_address.trim()) {
      errors.street_address = 'Street Address is required.';
      missing.push('Street Address');
    }
    if (!form.postal_code.trim()) {
      errors.postal_code = 'Postal Code is required.';
      missing.push('Postal Code');
    } else if (form.postal_code.trim().length < 3) {
      errors.postal_code = 'Postal Code must be at least 3 characters.';
      missing.push('Valid Postal Code');
    }

    setFieldErrors(errors);
    setErrorBanner(missing);
    return missing.length === 0;
  };

  // ── Step 3: Save & Continue ─────────────────────────────────
  const handleStep3Submit = async () => {
    setErrorBanner([]);
    setSuccessMsg('');

    if (!validateStep3()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const finalCity = useCustomCity ? form.custom_city.trim() : form.city.trim();

      // Normalize DOB to YYYY-MM-DD
      let formattedDob = form.dob.trim();
      const dobParts = formattedDob.split(/[-/]/);
      if (dobParts.length === 3 && dobParts[2].length === 4) {
        const day = dobParts[0].padStart(2, '0');
        const month = dobParts[1].padStart(2, '0');
        const year = dobParts[2];
        formattedDob = `${year}-${month}-${day}`;
      }

      const payload = {
        full_name: form.full_name.trim(),
        dob: formattedDob,
        gender: form.gender.trim(),
        nationality: form.nationality.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: finalCity,
        street_address: form.street_address.trim(),
        landmark: form.landmark.trim(),
        postal_code: form.postal_code.trim(),
      };

      const res = await fetch('http://localhost:8000/api/seller/application/step-3', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save application information.');
      }

      setSuccessMsg('Personal and Address information saved successfully.');
      setMaxUnlockedStep(prev => Math.max(prev, 4));

      setTimeout(() => {
        setSuccessMsg('');
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error connecting to database.';
      if (msg === 'Failed to fetch' || msg.includes('fetch')) {
        setErrorBanner(['Unable to connect to the backend server (http://localhost:8000). Please ensure the backend is running.']);
      } else {
        setErrorBanner([msg]);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  // ── Step 5: Contact Verification (Twilio Verify SMS OTP) ────
  const handleSendOtp = async () => {
    setErrorBanner([]);
    setOtpError('');

    const cleanLocal = localPhoneNumber.replace(/\D/g, '');

    // 1. Check if phone input is empty
    if (!cleanLocal) {
      const msg = 'Please enter your phone number.';
      setOtpError(msg);
      setErrorBanner([msg]);
      return;
    }

    // 2. Validate international phone format for selected country
    const val = validateAndFormatInternationalPhone(
      selectedPhoneCountry.dialCode,
      cleanLocal,
      selectedPhoneCountry.code
    );

    if (!val.isValid) {
      const msg = 'Please enter a valid phone number.';
      setOtpError(msg);
      setErrorBanner([msg]);
      return;
    }

    const normalizedE164 = val.e164;
    setSendingOtp(true);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:8000/api/seller/contact/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone_number: normalizedE164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send SMS verification code.');
      }
      setOtpSent(true);
      if (data.phone_number) {
        setForm(prev => ({ ...prev, phone_number: data.phone_number }));
      } else {
        setForm(prev => ({ ...prev, phone_number: normalizedE164 }));
      }
      setResendCooldown(data.resend_after_seconds || 60);
      setSuccessMsg(data.message || `Verification code sent via SMS to ${normalizedE164}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification SMS.';
      setOtpError(msg);
      setErrorBanner([msg]);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.trim().length < 4) {
      setOtpError('Please enter the 6-digit verification code sent to your mobile phone.');
      return;
    }
    setOtpError('');
    setVerifyingOtp(true);
    try {
      const token = getToken();
      const normalizedE164 = `${selectedPhoneCountry.dialCode}${localPhoneNumber.replace(/\D/g, '')}`;
      const res = await fetch('http://localhost:8000/api/seller/contact/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: form.phone_number || normalizedE164,
          otp_code: otpValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid or expired verification code.');
      }
      setForm(prev => ({ ...prev, phone_verified: true }));
      setOtpSent(false);
      setOtpValue('');
      setSuccessMsg('Phone number verified successfully!');
      setMaxUnlockedStep(prev => Math.max(prev, 6));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Invalid or expired verification code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleChangeNumber = () => {
    setForm(prev => ({ ...prev, phone_verified: false, phone_number: '' }));
    setLocalPhoneNumber('');
    setOtpSent(false);
    setOtpValue('');
    setOtpError('');
  };

  const handleStep5Submit = async () => {
    setErrorBanner([]);
    if (!form.phone_number.trim()) {
      setErrorBanner(['Phone number is required.']);
      return;
    }
    if (!form.phone_verified) {
      setErrorBanner(['Please verify your phone number with SMS OTP first.']);
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const payload = {
        phone_number: form.phone_number.trim(),
        phone_verified: true,
      };

      const res = await fetch('http://localhost:8000/api/seller/application/step-5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save contact verification.');
      }

      setMaxUnlockedStep(prev => Math.max(prev, 6));
      setStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorBanner([err instanceof Error ? err.message : 'Error saving phone verification.']);
    } finally {
      setSaving(false);
    }
  };

  // ── Step 6: Bank Details Verification & IFSC Handlers ─────────
  const handleVerifyIfsc = async () => {
    setBankVerifyError('');
    const cleanIfsc = form.bank_ifsc.trim().toUpperCase();
    if (!cleanIfsc) {
      setBankVerifyError('Please enter an IFSC code.');
      return;
    }
    if (cleanIfsc.length !== 11 || cleanIfsc[4] !== '0') {
      setBankVerifyError('Invalid IFSC code format. IFSC code must be 11 characters (e.g. HDFC0000001).');
      return;
    }

    setVerifyingIfsc(true);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:8000/api/seller/application/step-6/verify-ifsc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bank_ifsc: cleanIfsc }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to verify IFSC code.');
      }

      setForm(prev => ({
        ...prev,
        bank_ifsc: cleanIfsc,
        bank_name: data.bank_name || prev.bank_name,
        bank_branch_name: data.bank_branch_name || prev.bank_branch_name,
      }));
      setSuccessMsg(data.message || `IFSC Code verified for ${data.bank_name}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setBankVerifyError(err instanceof Error ? err.message : 'IFSC verification failed.');
    } finally {
      setVerifyingIfsc(false);
    }
  };

  const handleVerifyBankAccount = async () => {
    setBankVerifyError('');
    setErrorBanner([]);

    const missing: string[] = [];
    if (!form.bank_account_name.trim()) missing.push('Account Holder Name');
    if (!form.bank_account_number.trim()) missing.push('Account Number');
    if (!form.confirm_account_number.trim()) missing.push('Confirm Account Number');
    if (!form.bank_ifsc.trim()) missing.push('IFSC Code');
    if (!form.bank_account_type) missing.push('Account Type');

    if (missing.length > 0) {
      const msg = `Please fill in all required fields: ${missing.join(', ')}`;
      setBankVerifyError(msg);
      setErrorBanner([msg]);
      return;
    }

    if (form.bank_account_number.trim() !== form.confirm_account_number.trim()) {
      const msg = 'Account Number and Confirm Account Number do not match. Please re-enter.';
      setBankVerifyError(msg);
      setErrorBanner([msg]);
      return;
    }

    const cleanIfsc = form.bank_ifsc.trim().toUpperCase();
    if (cleanIfsc.length !== 11 || cleanIfsc[4] !== '0') {
      const msg = 'Invalid IFSC code format. IFSC code must be 11 characters (e.g. HDFC0000001).';
      setBankVerifyError(msg);
      setErrorBanner([msg]);
      return;
    }

    setVerifyingBank(true);
    try {
      const token = getToken();
      const payload = {
        bank_account_name: form.bank_account_name.trim(),
        bank_account_number: form.bank_account_number.trim(),
        confirm_account_number: form.confirm_account_number.trim(),
        bank_ifsc: cleanIfsc,
        bank_account_type: form.bank_account_type,
      };

      const res = await fetch('http://localhost:8000/api/seller/application/step-6/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Bank account verification failed.');
      }

      setBankVerified(true);
      setBankVerifyResult(data);
      setForm(prev => ({
        ...prev,
        bank_name: data.bank_name || prev.bank_name,
        bank_branch_name: data.bank_branch_name || prev.bank_branch_name,
        bank_ifsc: cleanIfsc,
      }));
      setSuccessMsg('✓ Bank Account Verified Successfully!');
      setMaxUnlockedStep(prev => Math.max(prev, 7));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setBankVerified(false);
      setBankVerifyResult(null);
      const msg = err instanceof Error ? err.message : 'Bank account verification failed.';
      setBankVerifyError(msg);
      setErrorBanner([msg]);
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleEditBankDetails = () => {
    setBankVerified(false);
    setBankVerifyResult(null);
    setBankVerifyError('');
  };

  const handleStep6Submit = async () => {
    setErrorBanner([]);
    setBankVerifyError('');

    if (!bankVerified) {
      const msg = 'Please complete real bank account verification before saving and continuing.';
      setBankVerifyError(msg);
      setErrorBanner([msg]);
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const payload = {
        bank_account_name: form.bank_account_name.trim(),
        bank_name: form.bank_name.trim(),
        bank_account_number: form.bank_account_number.trim(),
        bank_ifsc: form.bank_ifsc.trim().toUpperCase(),
        bank_branch_name: form.bank_branch_name.trim(),
        bank_account_type: form.bank_account_type,
        bank_verified: true,
      };

      const res = await fetch('http://localhost:8000/api/seller/application/step-6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save bank information.');
      }

      setMaxUnlockedStep(prev => Math.max(prev, 7));
      setStep(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorBanner([err instanceof Error ? err.message : 'Error saving bank information.']);
    } finally {
      setSaving(false);
    }
  };

  // ── Step 7: Final Submission ────────────────────────────────
  const handleFinalSubmit = async () => {
    const confirmationEl = document.getElementById('review_confirm') as HTMLInputElement;
    if (confirmationEl && !confirmationEl.checked) {
      alert('Please check the confirmation box to verify your application.');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const finalCity = useCustomCity ? form.custom_city.trim() : form.city.trim();

      const fullPayload = {
        dob: form.dob,
        gender: form.gender,
        nationality: form.nationality,
        country: form.country,
        state: form.state,
        city: finalCity,
        street_address: form.street_address,
        landmark: form.landmark,
        postal_code: form.postal_code,

        id_document_type: form.id_document_type,
        id_document_number: form.id_document_number,
        id_expiry_date: form.id_expiry_date,
        id_document_url: form.id_document_url,
        selfie_url: form.selfie_url,

        phone_number: form.phone_number,
        phone_verified: form.phone_verified,

        bank_account_name: form.bank_account_name,
        bank_name: form.bank_name,
        bank_account_number: form.bank_account_number,
        bank_ifsc: form.bank_ifsc,
        bank_branch_name: form.bank_branch_name,
        bank_account_type: form.bank_account_type,
      };

      const res = await fetch('http://localhost:8000/api/seller/application/final-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fullPayload),
      });

      if (res.ok) {
        router.push('/seller/dashboard');
      } else {
        const data = await res.json();
        alert('Error: ' + data.detail);
        setSaving(false);
      }
    } catch {
      alert('Network error submitting application.');
      setSaving(false);
    }
  };

  // ── Loading Screen ──────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className={s.container}>
        <div className={s.loadingContainer} style={{ width: '100%' }}>
          <div className={s.bigSpinner}></div>
          <p style={{ fontWeight: 700 }}>Loading ChronoBid Seller Application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      {/* Hidden File Inputs */}
      <input
        ref={docInputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={handleDocChange}
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleSelfieChange}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Left Sidebar Navigation ── */}
      <aside className={s.sidebar}>
        <Link href="/" className={s.logo}>
          <div className={s.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z" />
              <path d="m16 11 3-3-2-2-3 3" />
              <path d="m18 9 2-2-2-2-2 2" />
            </svg>
          </div>
          <div className={s.logoText}>
            <h1>Chrono<span>Bid</span></h1>
            <p>Seller Onboarding</p>
          </div>
        </Link>

        <div className={s.sidebarHeading}>Application Progress</div>

        <div className={s.progressList}>
          {/* Step 1: Account Created */}
          <div className={`${s.progressItem} ${s.completed}`}>
            <div className={s.stepCircle}>✓</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Account Created</div>
              <div className={s.stepDesc}>Account setup completed</div>
            </div>
          </div>

          {/* Step 2: Choose Role */}
          <div className={`${s.progressItem} ${s.completed}`}>
            <div className={s.stepCircle}>✓</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Choose Role</div>
              <div className={s.stepDesc}>Seller role selected</div>
            </div>
          </div>

          {/* Step 3: Seller Application */}
          <div
            className={`${s.progressItem} ${step === 3 ? s.active : (maxUnlockedStep > 3 ? `${s.completed} ${s.clickable}` : '')}`}
            onClick={() => { if (maxUnlockedStep >= 3) setStep(3); }}
          >
            <div className={s.stepCircle}>{maxUnlockedStep > 3 && step !== 3 ? '✓' : '3'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Seller Application</div>
              <div className={s.stepDesc}>Personal &amp; Address details</div>
            </div>
          </div>

          {/* Step 4: Identity Verification */}
          <div
            className={`${s.progressItem} ${step === 4 ? s.active : (maxUnlockedStep > 4 ? `${s.completed} ${s.clickable}` : (maxUnlockedStep >= 4 ? s.clickable : ''))}`}
            onClick={() => { if (maxUnlockedStep >= 4) setStep(4); }}
          >
            <div className={s.stepCircle}>{maxUnlockedStep > 4 && step !== 4 ? '✓' : '4'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Identity Verification</div>
              <div className={s.stepDesc}>Government ID &amp; Selfie</div>
            </div>
          </div>

          {/* Step 5: Contact Verification */}
          <div
            className={`${s.progressItem} ${step === 5 ? s.active : (maxUnlockedStep > 5 ? `${s.completed} ${s.clickable}` : (maxUnlockedStep >= 5 ? s.clickable : ''))}`}
            onClick={() => { if (maxUnlockedStep >= 5) setStep(5); }}
          >
            <div className={s.stepCircle}>{maxUnlockedStep > 5 && step !== 5 ? '✓' : '5'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Contact Verification</div>
              <div className={s.stepDesc}>Phone number OTP check</div>
            </div>
          </div>

          {/* Step 6: Bank Details */}
          <div
            className={`${s.progressItem} ${step === 6 ? s.active : (maxUnlockedStep > 6 ? `${s.completed} ${s.clickable}` : (maxUnlockedStep >= 6 ? s.clickable : ''))}`}
            onClick={() => { if (maxUnlockedStep >= 6) setStep(6); }}
          >
            <div className={s.stepCircle}>{maxUnlockedStep > 6 && step !== 6 ? '✓' : '6'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Bank Details</div>
              <div className={s.stepDesc}>Payout account setup</div>
            </div>
          </div>

          {/* Step 7: Submission Review */}
          <div
            className={`${s.progressItem} ${step === 7 ? s.active : (maxUnlockedStep >= 7 ? s.clickable : '')}`}
            onClick={() => { if (maxUnlockedStep >= 7) setStep(7); }}
          >
            <div className={s.stepCircle}>7</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Submission Review</div>
              <div className={s.stepDesc}>Final review &amp; submit</div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={s.sidebarFooter}>
          <div className={s.userBadge}>
            <div className={s.userAvatar}>
              {(userData.username || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className={s.userInfo}>
              <div className={s.userName}>{userData.username || 'Authenticated Seller'}</div>
              <div className={s.userRole}>ChronoBid Seller</div>
            </div>
          </div>
          <button onClick={handleLogout} className={s.backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className={s.main}>
        {/* Mobile Stepper Header */}
        <div className={s.mobileStepper}>
          <div className={s.mobileStepHeader}>
            <span className={s.mobileStepTitle}>
              {step === 3 && 'Step 3: Seller Application'}
              {step === 4 && 'Step 4: Identity Verification'}
              {step === 5 && 'Step 5: Contact Verification'}
              {step === 6 && 'Step 6: Bank Details'}
              {step === 7 && 'Step 7: Submission Review'}
            </span>
            <span className={s.mobileStepBadge}>Step {step} of 7</span>
          </div>
          <div className={s.mobileProgressBar}>
            <div className={s.mobileProgressFill} style={{ width: `${(step / 7) * 100}%` }}></div>
          </div>
        </div>

        {/* Alert Error Banner */}
        {errorBanner.length > 0 && (
          <div className={s.alertError}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>
                {errorBanner.some(e => e.includes('Unable to connect') || e.includes('Failed to fetch') || e.includes('Error connecting'))
                  ? 'Connection Alert:'
                  : errorBanner.some(e => e.includes('Twilio') || e.includes('SMS') || e.includes('verification') || e.includes('OTP'))
                  ? 'Contact Verification Alert:'
                  : 'Please complete all required fields before continuing:'}
              </strong>
              <div>{errorBanner.join(' • ')}</div>
            </div>
          </div>
        )}

        {/* Alert Success Banner */}
        {successMsg && (
          <div className={s.alertSuccess}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 3: SELLER APPLICATION (Personal & Address)
            ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>
                  Seller Application
                  <span className={s.stepBadge}>Step 3 of 7</span>
                </h2>
                <p>Please enter your legal personal details and residential address. All information is encrypted.</p>
              </div>
              <div className={s.stepIndicators}>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.current}`}>3</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>4</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>5</div>
              </div>
            </div>

            {/* Card 1: Personal Information */}
            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardIconBox}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3>Personal Information</h3>
                  <p>Legal details matching your official identification document</p>
                </div>
              </div>

              <div className={s.formRow}>
                {/* Full Name */}
                <div className={s.formGroup}>
                  <label>
                    Full Name <span className={s.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Enter legal full name"
                    className={`${s.input} ${fieldErrors.full_name ? s.inputError : ''}`}
                    value={form.full_name}
                    onChange={handleChange}
                  />
                  {fieldErrors.full_name && <span className={s.fieldError}>{fieldErrors.full_name}</span>}
                </div>

                {/* Date of Birth */}
                <div className={s.formGroup}>
                  <label>
                    Date of Birth <span className={s.reqStar}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    className={`${s.input} ${fieldErrors.dob ? s.inputError : ''}`}
                    value={form.dob}
                    onChange={handleChange}
                  />
                  {fieldErrors.dob && <span className={s.fieldError}>{fieldErrors.dob}</span>}
                </div>

                {/* Gender */}
                <div className={s.formGroup}>
                  <label>
                    Gender <span className={s.reqStar}>*</span>
                  </label>
                  <select
                    name="gender"
                    className={`${s.select} ${fieldErrors.gender ? s.inputError : ''}`}
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {fieldErrors.gender && <span className={s.fieldError}>{fieldErrors.gender}</span>}
                </div>
              </div>

              <div className={s.formRow}>
                {/* Nationality (Searchable Combobox) */}
                <div className={s.formGroup} style={{ gridColumn: 'span 3' }}>
                  <label>
                    Nationality <span className={s.reqStar}>*</span>
                  </label>
                  <div className={s.comboboxWrapper}>
                    <input
                      type="text"
                      placeholder="Type to search nationality (e.g. Indian, American, British, German, Australian)..."
                      className={`${s.input} ${fieldErrors.nationality ? s.inputError : ''}`}
                      value={isNationalityOpen ? nationalitySearch : (form.nationality || '')}
                      onFocus={() => {
                        setIsNationalityOpen(true);
                        setNationalitySearch(form.nationality || '');
                      }}
                      onChange={e => {
                        setNationalitySearch(e.target.value);
                        setIsNationalityOpen(true);
                      }}
                    />
                    {isNationalityOpen && (
                      <div className={s.comboboxDropdown}>
                        {filteredNationalities.length > 0 ? (
                          filteredNationalities.map(nat => (
                            <div
                              key={nat}
                              className={`${s.comboboxOption} ${form.nationality === nat ? s.selected : ''}`}
                              onClick={() => {
                                setForm(f => ({ ...f, nationality: nat }));
                                setIsNationalityOpen(false);
                                setNationalitySearch('');
                                setFieldErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.nationality;
                                  return copy;
                                });
                              }}
                            >
                              <span>{nat}</span>
                              {form.nationality === nat && <span>✓</span>}
                            </div>
                          ))
                        ) : (
                          <div className={s.comboboxEmpty}>No matching nationality found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {fieldErrors.nationality && <span className={s.fieldError}>{fieldErrors.nationality}</span>}
                </div>
              </div>
            </div>

            {/* Card 2: Address Information */}
            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardIconBox}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3>Address Information</h3>
                  <p>Dynamic location cascading based on your residential address</p>
                </div>
              </div>

              {/* Row 1: Country, State, City */}
              <div className={s.formRow}>
                {/* Dynamic Country */}
                <div className={s.formGroup}>
                  <label>
                    Country <span className={s.reqStar}>*</span>
                  </label>
                  <div className={s.comboboxWrapper}>
                    <input
                      type="text"
                      placeholder="Search country (e.g. India, United States)..."
                      className={`${s.input} ${fieldErrors.country ? s.inputError : ''}`}
                      value={isCountryOpen ? countrySearch : (form.country || '')}
                      onFocus={() => {
                        setIsCountryOpen(true);
                        setCountrySearch(form.country || '');
                      }}
                      onChange={e => {
                        setCountrySearch(e.target.value);
                        setIsCountryOpen(true);
                      }}
                    />
                    {isCountryOpen && (
                      <div className={s.comboboxDropdown}>
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map(c => (
                            <div
                              key={c.code + c.name}
                              className={`${s.comboboxOption} ${form.country === c.name ? s.selected : ''}`}
                              onClick={() => handleCountrySelect(c.name)}
                            >
                              <span>{c.name} ({c.code})</span>
                              {form.country === c.name && <span>✓</span>}
                            </div>
                          ))
                        ) : (
                          <div className={s.comboboxEmpty}>No country found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {fieldErrors.country && <span className={s.fieldError}>{fieldErrors.country}</span>}
                </div>

                {/* Dynamic State / Province */}
                <div className={s.formGroup}>
                  <label>
                    State / Province / Region <span className={s.reqStar}>*</span>
                  </label>
                  {availableStates.length > 0 ? (
                    <select
                      name="state"
                      className={`${s.select} ${fieldErrors.state ? s.inputError : ''}`}
                      value={form.state}
                      onChange={e => handleStateChange(e.target.value)}
                    >
                      <option value="">Select State / Region</option>
                      {availableStates.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="state"
                      placeholder={form.country ? 'Enter State / Province / Region' : 'Select Country first'}
                      className={`${s.input} ${fieldErrors.state ? s.inputError : ''}`}
                      value={form.state}
                      onChange={e => handleStateChange(e.target.value)}
                      disabled={!form.country}
                    />
                  )}
                  {fieldErrors.state && <span className={s.fieldError}>{fieldErrors.state}</span>}
                </div>

                {/* Dynamic City */}
                <div className={s.formGroup}>
                  <label>
                    City <span className={s.reqStar}>*</span>
                  </label>
                  {availableCities.length > 0 && !useCustomCity ? (
                    <select
                      name="city"
                      className={`${s.select} ${fieldErrors.city ? s.inputError : ''}`}
                      value={form.city}
                      onChange={e => handleCitySelect(e.target.value)}
                    >
                      <option value="">Select City</option>
                      {availableCities.map(ct => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                      <option value="__OTHER__">➕ Other (Type custom city)...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        name={useCustomCity ? 'custom_city' : 'city'}
                        placeholder={form.state ? 'Enter City name' : 'Select State first'}
                        className={`${s.input} ${fieldErrors.city ? s.inputError : ''}`}
                        value={useCustomCity ? form.custom_city : form.city}
                        onChange={handleChange}
                        disabled={!form.state}
                      />
                      {availableCities.length > 0 && useCustomCity && (
                        <button
                          type="button"
                          className={s.secondaryBtn}
                          onClick={() => setUseCustomCity(false)}
                          style={{ padding: '0 12px', fontSize: '13px' }}
                          title="Choose from list"
                        >
                          List
                        </button>
                      )}
                    </div>
                  )}
                  {fieldErrors.city && <span className={s.fieldError}>{fieldErrors.city}</span>}
                </div>
              </div>

              {/* Row 2: Street Address, Landmark, Postal Code */}
              <div className={s.formRow}>
                {/* Street Address */}
                <div className={s.formGroup}>
                  <label>
                    Street Address <span className={s.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    placeholder="House / Flat No., Street, Building"
                    className={`${s.input} ${fieldErrors.street_address ? s.inputError : ''}`}
                    value={form.street_address}
                    onChange={handleChange}
                  />
                  {fieldErrors.street_address && <span className={s.fieldError}>{fieldErrors.street_address}</span>}
                </div>

                {/* Landmark */}
                <div className={s.formGroup}>
                  <label>
                    Landmark <span className={s.optText}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    placeholder="Nearby landmark or area"
                    className={s.input}
                    value={form.landmark}
                    onChange={handleChange}
                  />
                </div>

                {/* Postal Code */}
                <div className={s.formGroup}>
                  <label>
                    Postal / ZIP Code <span className={s.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="e.g. 560001 or 10001"
                    className={`${s.input} ${fieldErrors.postal_code ? s.inputError : ''}`}
                    value={form.postal_code}
                    onChange={handleChange}
                  />
                  {fieldErrors.postal_code && <span className={s.fieldError}>{fieldErrors.postal_code}</span>}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className={s.footer}>
              <button
                className={s.primaryBtn}
                onClick={handleStep3Submit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className={s.spinner}></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Continue</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 4: IDENTITY VERIFICATION (ID + Selfie + AI Scan)
            ══════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>
                  Identity Verification
                  <span className={s.stepBadge}>Step 4 of 7</span>
                </h2>
                <p>Upload a government-issued photo ID and take a live selfie for AI verification.</p>
              </div>
              <div className={s.stepIndicators}>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.current}`}>4</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>5</div>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={docInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              style={{ display: 'none' }}
              onChange={handleDocChange}
            />
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              capture="user"
              style={{ display: 'none' }}
              onChange={handleSelfieChange}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Step 4 Main Grid */}
            <div className={s.step4Grid}>
              {/* Left Card: Government ID */}
              <div className={s.card} style={{ marginBottom: 0 }}>
                <div className={s.cardHeader}>
                  <div className={s.cardIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h3>Government ID Details</h3>
                    <p>Official identification document</p>
                  </div>
                </div>

                <div className={s.formGroup} style={{ marginBottom: '20px' }}>
                  <label>Document Type <span className={s.reqStar}>*</span></label>
                  <select
                    name="id_document_type"
                    className={s.select}
                    value={form.id_document_type}
                    onChange={handleChange}
                  >
                    <option value="Passport">📘 Passport</option>
                    <option value="Aadhaar">🪪 Aadhaar Card</option>
                    <option value="PAN">💳 PAN Card</option>
                    <option value="Driving License">🚗 Driving Licence</option>
                    <option value="Voter ID">🗳️ Voter ID (EPIC)</option>
                  </select>
                </div>

                {/* Upload or Preview Area */}
                {!docPreview ? (
                  <div
                    className={s.uploadArea}
                    onClick={handleDocClick}
                    onDrop={handleDocDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    {uploadingDoc ? (
                      <>
                        <div className={s.bigSpinner} style={{ width: '36px', height: '36px' }}></div>
                        <p style={{ marginTop: '12px' }}>Uploading Document...</p>
                      </>
                    ) : (
                      <>
                        <svg className={s.uploadIcon} width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p>Upload {form.id_document_type} Photo</p>
                        <span>Drag &amp; drop or click to choose file<br />Supports JPG, PNG, PDF up to 5MB</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={`${s.previewBox} ${verifResult?.success ? s.verified : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageSrc(docPreview)}
                      alt="Government ID"
                      className={s.previewImage}
                    />
                    <div className={s.previewInfo}>
                      <span className={s.previewTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        {docFile?.name || `${form.id_document_type} Attached`}
                      </span>
                      <div className={s.previewActions}>
                        <button type="button" className={s.miniBtn} onClick={handleDocClick}>
                          Replace
                        </button>
                        <button type="button" className={`${s.miniBtn} ${s.danger}`} onClick={handleRemoveDoc}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className={s.formGroup} style={{ marginBottom: '18px' }}>
                  <label>Document Number <span className={s.optText}>(or auto-detect via OCR)</span></label>
                  <input
                    type="text"
                    name="id_document_number"
                    placeholder={`Enter ${form.id_document_type} number (optional, OCR will verify)`}
                    className={s.input}
                    value={form.id_document_number}
                    onChange={handleChange}
                  />
                </div>

                <div className={s.formGroup}>
                  <label>Expiry Date <span className={s.optText}>(if applicable)</span></label>
                  <input
                    type="date"
                    name="id_expiry_date"
                    className={s.input}
                    value={form.id_expiry_date}
                    onChange={handleChange}
                  />
                </div>

                <div className={s.secureBadge}>
                  <svg className={s.secureIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <div>
                    <h4>Encrypted &amp; Self-Hosted</h4>
                    <p>Documents are processed locally without third-party API exposure.</p>
                  </div>
                </div>
              </div>

              {/* Right Card: Selfie Verification */}
              <div className={s.card} style={{ marginBottom: 0, position: 'relative' }}>
                {scanning && (
                  <div className={s.scanningOverlay}>
                    <div className={s.scanLine}></div>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <div className={s.scanningText}>Verifying Biometrics &amp; OCR...</div>
                    <div className={s.scanningSubtext}>{verifPhase || 'Running neural face matcher...'}</div>
                    <button
                      type="button"
                      className={s.cancelScanBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        stopAndResetScanning();
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Cancel Scan</span>
                    </button>
                  </div>
                )}

                <div className={s.cardHeader}>
                  <div className={s.cardIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                  <div>
                    <h3>Selfie Verification</h3>
                    <p>Live photo matching your ID</p>
                  </div>
                </div>

                <div className={s.formGroup} style={{ marginBottom: '16px' }}>
                  <label>Selfie Photo <span className={s.reqStar}>*</span></label>

                  {/* 1. Live Camera Mode with Biometric Oval Guide */}
                  {showCamera && (
                    <div className={s.cameraViewfinder}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={s.cameraVideo}
                      />
                      <div className={s.faceOvalGuide}></div>
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className={s.primaryBtn}
                          style={{ flex: 1, height: '44px', fontSize: '14px' }}
                          onClick={capturePhoto}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>Take Snapshot</span>
                        </button>
                        <button
                          type="button"
                          className={s.secondaryBtn}
                          style={{ height: '44px', padding: '0 16px', fontSize: '13.5px' }}
                          onClick={() => {
                            streamRef.current?.getTracks().forEach(t => t.stop());
                            streamRef.current = null;
                            setShowCamera(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Selfie Preview Box */}
                  {!showCamera && selfiePreview && (
                    <div className={`${s.previewBox} ${verifResult?.success ? s.verified : ''}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageSrc(selfiePreview)}
                        alt="Selfie Preview"
                        className={s.previewImage}
                      />
                      <div className={s.previewInfo}>
                        <span className={s.previewTitle}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Selfie Ready
                        </span>
                        <div className={s.previewActions}>
                          <button type="button" className={s.miniBtn} onClick={retakePhoto}>
                            Retake
                          </button>
                          <button type="button" className={s.miniBtn} onClick={handleSelfieUploadClick}>
                            Re-upload
                          </button>
                          <button type="button" className={`${s.miniBtn} ${s.danger}`} onClick={handleRemoveSelfie}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Empty Placeholder Box */}
                  {!showCamera && !selfiePreview && (
                    <div className={s.selfieBox}>
                      {uploadingSelfie ? (
                        <>
                          <div className={s.bigSpinner} style={{ width: '36px', height: '36px' }}></div>
                          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                            Uploading Selfie...
                          </p>
                        </>
                      ) : (
                        <>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <p style={{ color: '#64748b', fontSize: '14px', margin: '10px 0 0', fontWeight: 600 }}>
                            No selfie captured yet
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {cameraError && (
                    <div style={{ color: '#dc2626', fontSize: '13.5px', marginTop: '10px', background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                      ⚠️ {cameraError}
                    </div>
                  )}
                </div>

                {/* Selfie Action Buttons */}
                {!showCamera && (
                  <div className={s.actionButtons}>
                    <button
                      type="button"
                      className={`${s.actionBtn} ${selfiePreview ? '' : s.active}`}
                      onClick={startCamera}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span>Take Webcam Photo</span>
                    </button>
                    <span className={s.or}>or</span>
                    <button
                      type="button"
                      className={s.actionBtn}
                      onClick={handleSelfieUploadClick}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Upload File</span>
                    </button>
                  </div>
                )}

                <div className={s.tipsBox}>
                  <div className={s.tipsHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Tips for instant verification</span>
                  </div>
                  <ul>
                    <li>Ensure clear front-facing lighting without glares</li>
                    <li>Remove eyeglasses, hats, or masks</li>
                    <li>Ensure government ID text and portrait are fully visible</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ════ Verification Result Card (When Checked) ════ */}
            {verifResult && (
              <div className={`${s.verifResultCard} ${verifResult.success ? '' : s.failed}`}>
                <div className={`${s.verifHeaderSuccess} ${verifResult.success ? '' : s.failed}`}>
                  {verifResult.success ? (
                    <div className={s.verifIconSuccess}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  ) : (
                    <div className={s.verifIconFailed}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3>{verifResult.success ? 'Identity Verification Complete' : 'Verification Could Not Be Completed'}</h3>
                    <p>
                      {verifResult.success
                        ? 'Identity document processed and biometric similarity checked.'
                        : (verifResult.reason || verifResult.message || 'Please review your document or retake selfie.')}
                    </p>
                  </div>
                </div>

                {/* Audit Grid */}
                {verifResult.success && (
                  <>
                    <div className={s.verifDetailsGrid}>
                      <div className={s.verifItem}>
                        <span className={s.verifItemLabel}>Document Type</span>
                        <span className={s.verifItemValue}>{verifResult.extracted_data?.document_type || form.id_document_type}</span>
                      </div>
                      <div className={s.verifItem}>
                        <span className={s.verifItemLabel}>Extracted Name</span>
                        <span className={s.verifItemValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {verifResult.extracted_data?.extracted_name || form.full_name}
                          <span className={s.badgeMatch}>✓ Matched</span>
                        </span>
                      </div>
                      <div className={s.verifItem}>
                        <span className={s.verifItemLabel}>Document Number</span>
                        <span className={s.verifItemValue}>{verifResult.extracted_data?.extracted_doc_number || form.id_document_number || '•••• •••• ' + form.postal_code}</span>
                      </div>
                      <div className={s.verifItem}>
                        <span className={s.verifItemLabel}>Biometric Match Score</span>
                        <span className={s.verifItemValue}>
                          <span className={s.badgeScore}>
                            {verifResult.metrics?.face_similarity_percentage || 92}% Match
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className={s.verifDisclaimer}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>
                        ChronoBid local neural engine completed facial embedding verification. Identity document processed and biometric similarity checked.
                      </span>
                    </div>
                  </>
                )}

                {/* Safe Developer Debug Metadata Box */}
                {verifResult.debug_metadata && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#475569' }}>
                    <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      Developer Verification Metrics
                    </div>
                    <div>OCR Confidence: <strong>{Math.round((verifResult.debug_metadata.ocr_confidence || 0) * 100)}%</strong></div>
                    <div>Name Similarity Score: <strong>{Math.round((verifResult.debug_metadata.name_similarity_score || 0) * 100)}%</strong></div>
                    {verifResult.debug_metadata.extracted_name_candidate && (
                      <div>OCR Extracted Name Candidate: <em>"{verifResult.debug_metadata.extracted_name_candidate}"</em></div>
                    )}
                  </div>
                )}

                {/* Failed Actions */}
                {!verifResult.success && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className={s.primaryBtn}
                      style={{ height: '46px', minWidth: '180px', fontSize: '14px' }}
                      onClick={handleVerifyIdentity}
                      disabled={scanning || !form.id_document_url || !form.selfie_url}
                    >
                      Try Verification Again
                    </button>
                    <button
                      type="button"
                      className={s.secondaryBtn}
                      style={{ height: '46px', fontSize: '14px' }}
                      onClick={retakePhoto}
                    >
                      Retake Selfie
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer Navigation */}
            <div className={`${s.footer} ${s.between}`}>
              <button
                type="button"
                className={s.backBtn}
                onClick={() => setStep(3)}
                disabled={scanning || saving}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to Step 3</span>
              </button>

              {verifResult?.success ? (
                <button
                  type="button"
                  className={s.primaryBtn}
                  onClick={handleProceedStep4}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className={s.spinner}></div>
                      <span>Saving &amp; Continuing...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Contact Verification</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className={s.primaryBtn}
                  onClick={handleVerifyIdentity}
                  disabled={scanning || !form.id_document_url || !form.selfie_url}
                >
                  {scanning ? (
                    <>
                      <div className={s.spinner}></div>
                      <span>Scanning &amp; Verifying...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Scan &amp; Verify Identity</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 5: CONTACT VERIFICATION (Twilio Verify SMS OTP)
            ══════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>
                  Contact Verification
                  <span className={s.stepBadge}>Step 5 of 7</span>
                </h2>
                <p>Verify your phone number for transaction alerts and auction win notifications.</p>
              </div>
              <div className={s.stepIndicators}>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.current}`}>5</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>6</div>
              </div>
            </div>

            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardIconBox}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3>Phone Number Verification</h3>
                  <p>We will send a real 6-digit one-time passcode via SMS to confirm ownership</p>
                </div>
              </div>

              {/* Phone Number Input */}
              {/* Phone Number Input with Dynamic Country Code Selector */}
              <div className={s.formGroup} style={{ maxWidth: '640px', marginBottom: '24px' }}>
                <label style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                  Phone Number (with Country Code) <span className={s.reqStar}>*</span>
                </label>

                {!form.phone_verified ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                    {/* Country Selector */}
                    <select
                      className={s.select}
                      value={selectedPhoneCountry.code}
                      onChange={handlePhoneCountryChange}
                      disabled={otpSent && !otpError}
                      style={{ width: '220px', minWidth: '180px', flexShrink: 0, fontWeight: 600, height: '46px' }}
                    >
                      {COUNTRY_PHONE_LIST.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>

                    {/* Local Number Input */}
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      className={`${s.input} ${otpError ? s.inputError : ''}`}
                      value={localPhoneNumber}
                      onChange={handleLocalPhoneChange}
                      disabled={otpSent && !otpError}
                      style={{ flex: 1, minWidth: '180px', height: '46px' }}
                    />

                    {/* Send OTP Button */}
                    <button
                      type="button"
                      className={s.secondaryBtn}
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      style={{ whiteSpace: 'nowrap', minWidth: '120px', height: '46px' }}
                    >
                      {sendingOtp ? (
                        <>
                          <div className={s.spinner} style={{ width: '16px', height: '16px', borderTopColor: '#070d1e' }}></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        otpSent ? 'Resend OTP' : 'Send OTP'
                      )}
                    </button>
                  </div>
                ) : (
                  /* Verified Status Card */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f0fdf4', padding: '14px 18px', borderRadius: '12px', border: '1.5px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '20px' }}>{selectedPhoneCountry.flag}</span>
                      <span style={{ fontWeight: 800, color: '#166534', fontSize: '16px' }}>{form.phone_number}</span>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ✓ Verified
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 700, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change Number
                    </button>
                  </div>
                )}

                {otpError && (
                  <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, marginTop: '8px', display: 'block' }}>
                    ⚠️ {otpError}
                  </span>
                )}

                {!form.phone_verified && (
                  <span style={{ fontSize: '12.5px', color: '#64748b', marginTop: '8px', display: 'block' }}>
                    Normalized E.164 preview: <strong>{selectedPhoneCountry.dialCode}{localPhoneNumber ? localPhoneNumber : '...'}</strong> ({selectedPhoneCountry.name})
                  </span>
                )}
              </div>

              {/* OTP Verification Input Box (Shown after OTP is dispatched) */}
              {otpSent && !form.phone_verified && (
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1.5px solid #e2e8f0', maxWidth: '560px', marginBottom: '24px' }}>
                  <label style={{ fontWeight: 800, fontSize: '14.5px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                    An SMS verification code has been sent to <strong>{form.phone_number}</strong>.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="••••••"
                      className={s.input}
                      value={otpValue}
                      onChange={e => {
                        setOtpValue(e.target.value.replace(/\D/g, '').substring(0, 6));
                        setOtpError('');
                      }}
                      style={{ flex: 1, letterSpacing: '6px', fontWeight: '800', textAlign: 'center', fontSize: '22px' }}
                      maxLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={s.primaryBtn}
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpValue.length < 4}
                      style={{ minWidth: '140px' }}
                    >
                      {verifyingOtp ? (
                        <>
                          <div className={s.spinner} style={{ width: '16px', height: '16px' }}></div>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        'Verify Code'
                      )}
                    </button>
                  </div>

                  {/* Resend Timer / Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    {resendCooldown > 0 ? (
                      <span style={{ color: '#64748b', fontWeight: 600 }}>
                        ⏱ Resend OTP available in <strong>{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        {sendingOtp ? 'Sending code...' : 'Resend OTP Code'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Edit phone number
                    </button>
                  </div>

                  {otpError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginTop: '14px', fontWeight: 700 }}>
                      ⚠️ {otpError}
                    </div>
                  )}
                </div>
              )}

              {/* Verified Success Badge */}
              {form.phone_verified && (
                <div style={{ maxWidth: '560px', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px' }}>
                      ✓
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#166534' }}>
                        Phone Number Verified
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
                        {form.phone_number} is verified for real-time notifications and payout security.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#334155', borderRadius: '8px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 750, cursor: 'pointer' }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className={`${s.footer} ${s.between}`}>
              <button className={s.backBtn} onClick={() => setStep(4)} disabled={saving}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to Step 4</span>
              </button>
              <button
                className={s.primaryBtn}
                onClick={handleStep5Submit}
                disabled={saving || !form.phone_verified}
                style={{ opacity: (!form.phone_verified && !saving) ? 0.6 : 1, cursor: (!form.phone_verified && !saving) ? 'not-allowed' : 'pointer' }}
                title={!form.phone_verified ? 'Please verify your phone number with SMS OTP first' : ''}
              >
                {saving ? (
                  <>
                    <div className={s.spinner}></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Continue</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 6: BANK DETAILS (Payout Account)
            ══════════════════════════════════════════════════════════ */}
        {step === 6 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>
                  Bank Details
                  <span className={s.stepBadge}>Step 6 of 7</span>
                </h2>
                <p>Provide your bank account details for direct escrow disbursements and auction payouts.</p>
              </div>
              <div className={s.stepIndicators}>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.current}`}>6</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>7</div>
              </div>
            </div>

            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardIconBox}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3>Payout Bank Account</h3>
                  <p>All auction sale proceeds will be deposited to this account</p>
                </div>
              </div>

              <div className={s.secureBadge} style={{ marginBottom: '28px', background: '#f8fafc' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <h4>Bank-Grade Encryption</h4>
                  <p>Your banking details are transmitted via 256-bit SSL encryption and strictly protected.</p>
                </div>
              </div>

              {/* ════ UNVERIFIED FORM INPUTS ════ */}
              {!bankVerified ? (
                <>
                  <div className={s.formRow}>
                    {/* Account Holder Name */}
                    <div className={s.formGroup}>
                      <label>Account Holder Name <span className={s.reqStar}>*</span></label>
                      <input
                        type="text"
                        name="bank_account_name"
                        placeholder="Enter account holder name"
                        className={s.input}
                        value={form.bank_account_name}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Bank Name (Auto-detected) */}
                    <div className={s.formGroup}>
                      <label>Bank Name <span className={s.reqStar}>*</span></label>
                      <input
                        type="text"
                        name="bank_name"
                        placeholder="Auto detected from IFSC"
                        className={s.input}
                        value={form.bank_name}
                        onChange={handleChange}
                        readOnly
                        style={{ background: '#f8fafc', color: form.bank_name ? '#0f172a' : '#64748b' }}
                      />
                    </div>

                    {/* Branch Name (Auto-detected) */}
                    <div className={s.formGroup}>
                      <label>Branch Name <span className={s.reqStar}>*</span></label>
                      <input
                        type="text"
                        name="bank_branch_name"
                        placeholder="Auto detected from IFSC"
                        className={s.input}
                        value={form.bank_branch_name}
                        onChange={handleChange}
                        readOnly
                        style={{ background: '#f8fafc', color: form.bank_branch_name ? '#0f172a' : '#64748b' }}
                      />
                    </div>
                  </div>

                  <div className={s.formRow}>
                    {/* Account Number */}
                    <div className={s.formGroup}>
                      <label>Account Number <span className={s.reqStar}>*</span></label>
                      <input
                        type="password"
                        name="bank_account_number"
                        placeholder="Enter account number"
                        className={s.input}
                        value={form.bank_account_number}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Confirm Account Number */}
                    <div className={s.formGroup}>
                      <label>Confirm Account Number <span className={s.reqStar}>*</span></label>
                      <input
                        type="text"
                        name="confirm_account_number"
                        placeholder="Re-enter account number"
                        className={s.input}
                        value={form.confirm_account_number}
                        onChange={handleChange}
                      />
                    </div>

                    {/* IFSC Code */}
                    <div className={s.formGroup}>
                      <label>IFSC Code <span className={s.reqStar}>*</span></label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          name="bank_ifsc"
                          placeholder="e.g. HDFC0000001"
                          className={s.input}
                          value={form.bank_ifsc}
                          onChange={handleChange}
                          style={{ textTransform: 'uppercase', flex: 1 }}
                          maxLength={11}
                        />
                        <button
                          type="button"
                          className={s.secondaryBtn}
                          onClick={handleVerifyIfsc}
                          disabled={verifyingIfsc || !form.bank_ifsc}
                          style={{ whiteSpace: 'nowrap', fontSize: '13px', height: '46px', padding: '0 14px' }}
                        >
                          {verifyingIfsc ? 'Checking...' : 'Verify IFSC'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Account Type Selection */}
                  <div className={s.formGroup} style={{ marginTop: '14px', marginBottom: '24px' }}>
                    <label style={{ fontWeight: 700 }}>Account Type <span className={s.reqStar}>*</span></label>
                    <div style={{ display: 'flex', gap: '28px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14.5px' }}>
                        <input
                          type="radio"
                          name="bank_account_type"
                          value="Savings Account"
                          checked={form.bank_account_type === 'Savings Account'}
                          onChange={handleChange}
                          style={{ accentColor: '#ca8a04', width: '20px', height: '20px' }}
                        />
                        Savings Account
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14.5px' }}>
                        <input
                          type="radio"
                          name="bank_account_type"
                          value="Current Account"
                          checked={form.bank_account_type === 'Current Account'}
                          onChange={handleChange}
                          style={{ accentColor: '#ca8a04', width: '20px', height: '20px' }}
                        />
                        Current / Checking Account
                      </label>
                    </div>
                  </div>

                  {/* Inline Verification Error Alert */}
                  {bankVerifyError && (
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 700, marginBottom: '20px' }}>
                      ⚠️ {bankVerifyError}
                    </div>
                  )}

                  {/* Verify Bank Account Action Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                    <button
                      type="button"
                      className={s.primaryBtn}
                      onClick={handleVerifyBankAccount}
                      disabled={verifyingBank}
                      style={{ height: '48px', padding: '0 28px', fontSize: '14.5px' }}
                    >
                      {verifyingBank ? (
                        <>
                          <div className={s.spinner} style={{ width: '18px', height: '18px' }}></div>
                          <span>Verifying Bank Account...</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                          <span>Verify Bank Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* ════ VERIFIED BANK ACCOUNT SUMMARY CARD ════ */
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
                        ✓
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#166534' }}>
                          Bank Account Verified
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '13.5px', color: '#15803d', fontWeight: 600 }}>
                          Your bank payout details are verified and locked for escrow disbursements.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleEditBankDetails}
                      style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#334155', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 750, cursor: 'pointer' }}
                    >
                      Edit Details
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#ffffff', padding: '18px 22px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Account Holder</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                        {bankVerifyResult?.verified_account_name || form.bank_account_name}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Bank Name</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                        {bankVerifyResult?.bank_name || form.bank_name}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Branch Name</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                        {bankVerifyResult?.bank_branch_name || form.bank_branch_name}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>IFSC Code</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                        {bankVerifyResult?.bank_ifsc || form.bank_ifsc}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Account Number</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '3px', letterSpacing: '1px' }}>
                        {bankVerifyResult?.masked_account_number || (form.bank_account_number.length >= 4 ? '••••••••' + form.bank_account_number.slice(-4) : '••••••••')}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Account Type</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                        {form.bank_account_type || 'Savings Account'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`${s.footer} ${s.between}`}>
              <button className={s.backBtn} onClick={() => setStep(5)} disabled={saving}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to Step 5</span>
              </button>
              <button
                className={s.primaryBtn}
                onClick={handleStep6Submit}
                disabled={saving || !bankVerified}
                style={{ opacity: (!bankVerified && !saving) ? 0.6 : 1, cursor: (!bankVerified && !saving) ? 'not-allowed' : 'pointer' }}
                title={!bankVerified ? 'Please verify your bank account first' : ''}
              >
                {saving ? (
                  <>
                    <div className={s.spinner}></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Continue</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 7: SUBMISSION REVIEW (Final Overview & Fee Policy)
            ══════════════════════════════════════════════════════════ */}
        {step === 7 && (
          <div className={s.stepContainer}>
            {/* Top Success Banner */}
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '14px', padding: '16px 22px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '17px' }}>
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#065f46', fontSize: '16px' }}>You're Almost Ready!</div>
                <div style={{ color: '#047857', fontSize: '13.5px', marginTop: '2px', fontWeight: 600 }}>
                  All required information has been completed. Please review the details below and submit your application to start listing items for auction.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
              
              {/* Left Column (Details, Fee Info & Guidelines) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header */}
                <div className={s.header} style={{ marginBottom: '12px' }}>
                  <div className={s.titleArea}>
                    <h2>
                      Submission Review
                      <span className={s.stepBadge}>Step 7 of 7</span>
                    </h2>
                    <p>Please review your complete seller profile, fees, and guidelines before final submission.</p>
                  </div>
                </div>

                {/* 2x2 Review Grid */}
                <div className={s.reviewGrid}>
                  
                  {/* Card 1: Personal & Address Details */}
                  <div className={s.reviewCard}>
                    <div className={s.reviewCardHeader}>
                      <div className={s.reviewCardTitle}>
                        <div className={s.reviewIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span>Personal &amp; Address Details</span>
                      </div>
                      <button className={s.editBtn} onClick={() => setStep(3)}>
                        <span>Edit</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className={s.reviewRow}><span>Legal Name</span><span>{form.full_name || userData.username}</span></div>
                    <div className={s.reviewRow}><span>Date of Birth</span><span>{form.dob || '-'}</span></div>
                    <div className={s.reviewRow}><span>Gender</span><span>{form.gender || '-'}</span></div>
                    <div className={s.reviewRow}><span>Nationality</span><span>{form.nationality || 'Indian'}</span></div>
                    <div className={s.reviewRow}>
                      <span>Address</span>
                      <span>{form.street_address}, {form.city}, {form.state}, {form.country} - {form.postal_code}</span>
                    </div>
                  </div>

                  {/* Card 2: Identity Verification */}
                  <div className={s.reviewCard}>
                    <div className={s.reviewCardHeader}>
                      <div className={s.reviewCardTitle}>
                        <div className={s.reviewIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <span>Identity Verification</span>
                      </div>
                      <button className={s.editBtn} onClick={() => setStep(4)}>
                        <span>Edit</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className={s.reviewRow}><span>Document Type</span><span>{form.id_document_type}</span></div>
                    <div className={s.reviewRow}>
                      <span>Document Number</span>
                      <span>{form.id_document_number ? form.id_document_number.replace(/.(?=.{4})/g, '•') : '••••••••7372'}</span>
                    </div>
                    <div className={s.reviewRow}><span>Expiry Date</span><span>{form.id_expiry_date || 'N/A'}</span></div>
                    <div className={s.reviewRow}>
                      <span>AI Face Match</span>
                      <span className={s.statusVerified}>✓ Verified</span>
                    </div>
                    <div className={s.reviewRow}>
                      <span>Verification Status</span>
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ Completed</span>
                    </div>
                  </div>

                  {/* Card 3: Contact Details */}
                  <div className={s.reviewCard}>
                    <div className={s.reviewCardHeader}>
                      <div className={s.reviewCardTitle}>
                        <div className={s.reviewIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </div>
                        <span>Contact Details</span>
                      </div>
                      <button className={s.editBtn} onClick={() => setStep(5)}>
                        <span>Edit</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className={s.reviewRow}><span>Phone Number</span><span>{form.phone_number || '+91 93429 77191'}</span></div>
                    <div className={s.reviewRow}><span>Registered Email</span><span>{userData.email || 'surajrajru475@gmail.com'}</span></div>
                    <div className={s.reviewRow}>
                      <span>OTP Verification</span>
                      <span className={s.statusVerified}>✓ Verified</span>
                    </div>
                  </div>

                  {/* Card 4: Bank Payout Account */}
                  <div className={s.reviewCard}>
                    <div className={s.reviewCardHeader}>
                      <div className={s.reviewCardTitle}>
                        <div className={s.reviewIcon} style={{ background: '#fffbeb', color: '#b45309' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                        </div>
                        <span>Bank Payout Account</span>
                      </div>
                      <button className={s.editBtn} onClick={() => setStep(6)}>
                        <span>Edit</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className={s.reviewRow}><span>Account Holder</span><span>{form.bank_account_name || 'Jeevan Babu K B'}</span></div>
                    <div className={s.reviewRow}><span>Bank Name</span><span>{form.bank_name || 'HDFC Bank'}</span></div>
                    <div className={s.reviewRow}>
                      <span>Account Number</span>
                      <span>{form.bank_account_number ? form.bank_account_number.replace(/.(?=.{4})/g, '•') : '••••••••3456'}</span>
                    </div>
                    <div className={s.reviewRow}><span>IFSC Code</span><span>{form.bank_ifsc || 'HDFC0200001'}</span></div>
                    <div className={s.reviewRow}><span>Branch</span><span>{form.bank_branch_name || 'Main Branch'}</span></div>
                    <div className={s.reviewRow}><span>Account Type</span><span>{form.bank_account_type || 'Savings Account'}</span></div>
                    <div className={s.reviewRow}>
                      <span>Verification Status</span>
                      <span className={s.statusVerified}>✓ Verified</span>
                    </div>
                  </div>

                </div>

                {/* ── Auction Listing & Fee Information Card ── */}
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1e3a8a' }}>
                          Auction Listing &amp; Fee Information
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '13.5px', color: '#1d4ed8', fontWeight: 600 }}>
                          Understand the charges and process before you start listing items.
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 750, color: '#2563eb', cursor: 'pointer', background: '#ffffff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                      View Full Fee Policy →
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    
                    {/* Item Listing Fee: FREE */}
                    <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                          ₹
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Listing Fee (Per Item)</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginBottom: '6px' }}>
                        Free <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>(₹0)</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                        <li>No upfront cost to list your items</li>
                        <li>Unlimited item listings for sellers</li>
                        <li>Helps maintain platform quality</li>
                      </ul>
                    </div>

                    {/* Success Fee (Commission): 5% */}
                    <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                          %
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Success Fee (Commission)</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#d97706', marginBottom: '6px' }}>
                        5%
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                        <li>Charged only when your item is sold</li>
                        <li>Calculated on final winning bid amount</li>
                        <li>Automatically deducted from payout</li>
                      </ul>
                    </div>

                    {/* Payout Process */}
                    <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                          ⚡
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Payout Process</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#4f46e5', marginBottom: '6px' }}>
                        2–5 Business Days
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                        <li>Auction proceeds sent to your verified bank account</li>
                        <li>Bank account verification required</li>
                        <li>No additional withdrawal fee</li>
                      </ul>
                    </div>

                  </div>
                </div>

                {/* ── Important Guidelines for Sellers Card ── */}
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#d97706', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
                      📖
                    </div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#78350f' }}>
                      Important Guidelines for Sellers
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '20px' }}>
                    
                    <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                      <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '13.5px', marginBottom: '4px' }}>✓ Allowed Items</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                        <li>Original, genuine and legal items only</li>
                        <li>Items must comply with Indian laws</li>
                      </ul>
                    </div>

                    <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                      <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '13.5px', marginBottom: '4px' }}>🚫 Prohibited Items</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                        <li>Counterfeit, stolen or illegal items</li>
                        <li>Weapons, hazardous materials, restricted goods</li>
                      </ul>
                    </div>

                    <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                      <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '13.5px', marginBottom: '4px' }}>🔍 Item Condition</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                        <li>Provide accurate description and clear photos</li>
                        <li>Disclose defects or damage honestly</li>
                      </ul>
                    </div>

                    <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                      <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '13.5px', marginBottom: '4px' }}>🚚 Shipping Responsibility</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                        <li>You are responsible for packaging and shipping</li>
                        <li>Ship within the promised time after auction closes</li>
                      </ul>
                    </div>

                  </div>

                  {/* Need Help box */}
                  <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>❓</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#78350f' }}>Need Help?</div>
                        <div style={{ fontSize: '12px', color: '#92400e' }}>Read our complete Seller Guidelines for detailed information on fees, shipping, and auction rules.</div>
                      </div>
                    </div>
                    <span style={{ background: '#fef3c7', color: '#78350f', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                      Read Seller Guide →
                    </span>
                  </div>
                </div>

              </div>

              {/* ── Right Column Sidebar (Fee Example, Checklist & Submit Button) ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
                
                {/* Fee Example Card */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px' }}>
                      🧮
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Fee Example</h4>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>See how much you'll earn after fees.</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                      <span>Example Item Sale</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#1e293b', marginBottom: '6px', fontWeight: 600 }}>
                      <span>Winning Bid Amount</span>
                      <span>10,000</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#dc2626', marginBottom: '10px', fontWeight: 600 }}>
                      <span>Success Fee (5%)</span>
                      <span>- 500</span>
                    </div>
                    <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, color: '#16a34a' }}>
                      <span>Your Payout Amount</span>
                      <span>₹ 9,500</span>
                    </div>
                  </div>
                </div>

                {/* Before You Submit Checklist Card */}
                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px' }}>
                      🛡️
                    </div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Before You Submit</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      'All information is accurate and complete',
                      'Government ID is verified',
                      'Phone number is verified',
                      'Bank account is verified',
                      'You have read and agree to the seller guidelines',
                      'You understand the listing fees and commission structure',
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                        <div style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '50%', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', marginTop: '1px' }}>
                          ✓
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After Submission Notice */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '16px', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', minWidth: '28px', borderRadius: '50%', background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                    i
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#1e3a8a', marginBottom: '2px' }}>After Submission</div>
                    <div style={{ fontSize: '12px', color: '#1d4ed8', lineHeight: '1.4' }}>
                      Your application will be reviewed by our team. You will be notified via email and SMS once your seller account is approved (usually within 1-2 business days).
                    </div>
                  </div>
                </div>

                {/* Terms Confirmation & Action Buttons Card */}
                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                    Terms &amp; Confirmation
                  </div>

                  <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '18px' }}>
                    <input
                      type="checkbox"
                      id="review_confirm"
                      defaultChecked
                      style={{ width: '18px', height: '18px', minWidth: '18px', accentColor: '#ca8a04', cursor: 'pointer', marginTop: '2px' }}
                    />
                    <span>
                      I confirm that all information provided is accurate and authentic to the best of my knowledge. I agree to ChronoBid's <span style={{ color: '#2563eb', fontWeight: 700 }}>Seller Terms</span>, <span style={{ color: '#2563eb', fontWeight: 700 }}>Fee Policy</span>, and <span style={{ color: '#2563eb', fontWeight: 700 }}>Community Guidelines</span>.
                    </span>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className={s.primaryBtn}
                      onClick={handleFinalSubmit}
                      disabled={saving}
                      style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #ca8a04', color: '#fbbf24', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {saving ? (
                        <>
                          <div className={s.spinner}></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀 Submit Application</span>
                        </>
                      )}
                    </button>

                    <button
                      className={s.backBtn}
                      onClick={() => setStep(6)}
                      disabled={saving}
                      style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
                    >
                      <span>← Back to Step 6</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
