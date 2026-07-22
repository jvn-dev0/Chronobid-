'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import s from './seller.module.css';

export default function SellerApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(3);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [userData, setUserData] = useState({ username: '', email: '' });

  // File upload state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Webcam state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file inputs
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState({
    // Step 3
    dob: '', gender: '', nationality: '', country: '', state: '', city: '', street_address: '', landmark: '', postal_code: '',
    // Step 4
    id_document_type: '', id_document_number: '', id_expiry_date: '', id_document_url: '', selfie_url: '',
    // Step 5
    phone_number: '', phone_verified: false,
    // Step 6
    bank_account_name: '', bank_name: '', bank_account_number: '', bank_ifsc: '', bank_branch_name: '', bank_account_type: 'Savings Account'
  });

  // Contact Verify State
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('chronobid_token');
    if (!token) { router.push('/login'); return; }
    fetch('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.username) setUserData(data); })
      .catch(err => console.error('Could not fetch user profile', err));
  }, [router]);

  // Stop camera when leaving step 4
  useEffect(() => {
    if (step !== 4 && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setShowCamera(false);
    }
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Helper: upload a file to backend and return saved URL ──
  const uploadFileToBackend = async (file: File, endpoint: string): Promise<string> => {
    const token = localStorage.getItem('chronobid_token');
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

  // ── Document Upload ────────────────────────────────────────
  const handleDocClick = () => docInputRef.current?.click();

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    setDocFile(file);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setDocPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload to backend and save real URL
    try {
      const url = await uploadFileToBackend(file, '/api/seller/upload/document');
      setForm(f => ({ ...f, id_document_url: url }));
    } catch (err: unknown) {
      alert('Document upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDocDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    setDocFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setDocPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const url = await uploadFileToBackend(file, '/api/seller/upload/document');
      setForm(f => ({ ...f, id_document_url: url }));
    } catch (err: unknown) {
      alert('Document upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ── Selfie Upload ──────────────────────────────────────────
  const handleSelfieUploadClick = () => selfieInputRef.current?.click();

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSelfiePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const url = await uploadFileToBackend(file, '/api/seller/upload/selfie');
      setForm(f => ({ ...f, selfie_url: url }));
    } catch (err: unknown) {
      alert('Selfie upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ── Webcam ─────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Could not access camera. Please allow camera permission or use Upload Selfie instead.');
      setShowCamera(false);
    }
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setSelfiePreview(dataUrl);
    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    // Convert dataUrl to File and upload to backend
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'selfie_captured.jpg', { type: 'image/jpeg' });
      const url = await uploadFileToBackend(file, '/api/seller/upload/selfie');
      setForm(f => ({ ...f, selfie_url: url }));
    } catch (err: unknown) {
      alert('Selfie upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const retakePhoto = async () => {
    setSelfiePreview(null);
    setSelfieFile(null);
    setForm(f => ({ ...f, selfie_url: '' }));
    await startCamera();
  };

  // ── Step 4 Submit (Go to Step 5: Contact Verify) ─────────
  const handleStep4Submit = async () => {
    if (!form.id_document_url) { alert('Please upload your Government ID document.'); return; }
    if (!form.selfie_url) { alert('Please upload or take your selfie.'); return; }

    setScanning(true);
    setTimeout(async () => {
      setScanning(false);
      setScanComplete(true);
      setTimeout(() => {
        setStep(5);
        setScanComplete(false); // Reset for UI safety
      }, 1000);
    }, 3000);
  };

  // ── Step 5 Submit (Go to Step 6: Bank Info) ───────────────
  const handleSendOtp = () => {
    if (form.phone_number.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }
    setOtpSent(true);
    alert("Mock OTP sent to " + form.phone_number + ". Use 123456 to verify.");
  };

  const handleVerifyOtp = () => {
    if (otpValue === '123456') {
      setForm({ ...form, phone_verified: true });
      setOtpError('');
    } else {
      setOtpError('Invalid OTP. Please try again.');
    }
  };

  const handleStep5Submit = () => {
    if (!form.phone_verified) {
      alert('Please verify your phone number first.');
      return;
    }
    setStep(6);
  };

  // ── Step 6 Submit (Go to Step 7: Submission Review) ───────
  const handleStep6Submit = () => {
    if (!form.bank_account_name || !form.bank_account_number || !form.bank_name || !form.bank_ifsc || !form.bank_branch_name) {
      alert('Please fill out all bank information fields.');
      return;
    }
    setStep(7);
  };

  // ── Final Submit (Step 7: Review & API Call) ──────────────
  const handleFinalSubmit = async () => {
    // Basic confirmation validation
    const confirmationEl = document.getElementById('review_confirm') as HTMLInputElement;
    if (confirmationEl && !confirmationEl.checked) {
      alert('Please confirm that the information is correct.');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('chronobid_token');
      const res = await fetch('http://localhost:8000/api/seller/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/seller/dashboard');
      } else if (res.status === 401) {
        // Token expired
        localStorage.removeItem('chronobid_token');
        localStorage.removeItem('chronobid_role');
        localStorage.removeItem('chronobid_user_id');
        alert('Your session has expired. Please log in again.');
        router.push('/login');
      } else {
        const data = await res.json();
        alert('Error: ' + data.detail);
        setLoading(false);
      }
    } catch {
      alert('Network error connecting to backend');
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      {/* Hidden file inputs */}
      <input ref={docInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleDocChange} />
      <input ref={selfieInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleSelfieChange} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Sidebar */}
      <aside className={s.sidebar}>
        <div className={s.logo}>
          <svg className={s.logoIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/>
            <path d="m16 11 3-3-2-2-3 3"/><path d="m18 9 2-2-2-2-2 2"/>
          </svg>
          <div className={s.logoText}>
            <h1>Chrono<span>Bid</span></h1>
            <p>Bid. Win. Own History.</p>
          </div>
        </div>

        <div className={s.progressList}>
          <div className={`${s.progressItem} ${s.completed}`}>
            <div className={s.stepCircle}>✓</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Account Created</div>
              <div className={s.stepDesc}>Your account has been created successfully.</div>
            </div>
          </div>
          <div className={`${s.progressItem} ${s.completed}`}>
            <div className={s.stepCircle}>✓</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Choose Role</div>
              <div className={s.stepDesc}>You chose to be a Seller.</div>
            </div>
          </div>
          <div className={`${s.progressItem} ${step === 3 ? s.active : s.completed}`}>
            <div className={s.stepCircle}>{step > 3 ? '✓' : '3'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Seller Application</div>
              <div className={s.stepDesc}>Your profile information has been saved.</div>
            </div>
          </div>
          <div className={`${s.progressItem} ${step === 4 ? s.active : (step > 4 ? s.completed : '')}`}>
            <div className={s.stepCircle}>{step > 4 ? '✓' : '4'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Identity Verification</div>
              <div className={s.stepDesc}>Your identity has been verified successfully.</div>
            </div>
          </div>
          <div className={`${s.progressItem} ${step === 5 ? s.active : (step > 5 ? s.completed : '')}`}>
            <div className={s.stepCircle}>{step > 5 ? '✓' : '5'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Contact Verification</div>
              <div className={s.stepDesc}>Verify your phone number.</div>
            </div>
          </div>
          <div className={`${s.progressItem} ${step === 6 ? s.active : (step > 6 ? s.completed : '')}`}>
            <div className={s.stepCircle}>{step > 6 ? '✓' : '6'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Bank Details</div>
              <div className={s.stepDesc}>Add your bank account details for payouts.</div>
            </div>
          </div>
          <div className={`${s.progressItem} ${step === 7 ? s.active : (step > 7 ? s.completed : '')}`}>
            <div className={s.stepCircle}>{step > 7 ? '✓' : '7'}</div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>Submission Review</div>
              <div className={s.stepDesc}>Review and submit your application.</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={s.main}>

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>STEP 3 - SELLER APPLICATION</h2>
                <p>Please fill in the details below to complete your seller registration.</p>
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

            <div className={s.card}>
              <div className={s.cardHeader}>
                <svg className={s.cardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h3>Personal Information</h3>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Full Name <span>(Auto-filled)</span></label>
                  <input type="text" className={s.input} disabled value={userData.username || 'Loading...'} />
                </div>
                <div className={s.formGroup}>
                  <label>Date of Birth</label>
                  <input type="text" name="dob" placeholder="DD / MM / YYYY" className={`${s.input} ${s.date}`} value={form.dob} onChange={handleChange} />
                </div>
                <div className={s.formGroup}>
                  <label>Gender</label>
                  <select name="gender" className={`${s.input} ${s.select}`} value={form.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Nationality</label>
                  <select name="nationality" className={`${s.input} ${s.select}`} value={form.nationality} onChange={handleChange}>
                    <option value="">Select Nationality</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Australia">Australia</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={s.card}>
              <div className={s.cardHeader}>
                <svg className={s.cardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <h3>Address Information</h3>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Country</label>
                  <select name="country" className={`${s.input} ${s.select}`} value={form.country} onChange={handleChange}>
                    <option value="">Select Country</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label>State</label>
                  <select name="state" className={`${s.input} ${s.select}`} value={form.state} onChange={handleChange}>
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label>City</label>
                  <input type="text" name="city" placeholder="Enter City" className={s.input} value={form.city} onChange={handleChange} />
                </div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Street Address</label>
                  <input type="text" name="street_address" placeholder="Enter Street Address" className={s.input} value={form.street_address} onChange={handleChange} />
                </div>
                <div className={s.formGroup}>
                  <label>Landmark <span>(Optional)</span></label>
                  <input type="text" name="landmark" placeholder="Enter Landmark" className={s.input} value={form.landmark} onChange={handleChange} />
                </div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup} style={{ maxWidth: '32%' }}>
                  <label>Postal Code</label>
                  <input type="text" name="postal_code" placeholder="Enter Postal Code" className={s.input} value={form.postal_code} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className={s.footer}>
              <button className={s.primaryBtn} onClick={() => setStep(4)}>
                Save &amp; Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>STEP 4 - IDENTITY VERIFICATION</h2>
                <p>Verify your identity by submitting a valid government ID and a live selfie.</p>
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

            <div className={s.step4Grid}>
              {/* ── Left: Government ID ── */}
              <div className={s.card} style={{ marginBottom: 0 }}>
                <div className={s.cardHeader}>
                  <svg className={s.cardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <h3>Government ID Details</h3>
                </div>

                <div className={s.formGroup} style={{ marginBottom: '20px' }}>
                  <label>Choose Document Type</label>
                  <select name="id_document_type" className={`${s.input} ${s.select}`} value={form.id_document_type} onChange={handleChange}>
                    <option value="">Select Document Type</option>
                    <option value="Aadhaar">🪪 Aadhaar</option>
                    <option value="Passport">📘 Passport</option>
                    <option value="Driving License">🪪 Driving License</option>
                    <option value="Voter ID">🗳️ Voter ID</option>
                  </select>
                </div>

                {/* Upload area */}
                <div
                  className={s.uploadArea}
                  onClick={handleDocClick}
                  onDrop={handleDocDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={docPreview ? { padding: '8px', border: '2px solid #38a169' } : {}}
                >
                  {docPreview ? (
                    <div style={{ position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={docPreview} alt="ID Document" style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '8px', objectFit: 'contain' }} />
                      <div style={{ color: '#38a169', fontWeight: 600, marginTop: '8px', fontSize: '13px' }}>
                        ✓ {docFile?.name || 'Document uploaded'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>Click to replace</div>
                    </div>
                  ) : (
                    <>
                      <svg className={s.uploadIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p>Upload Document Image</p>
                      <span>Drag and drop or click to upload<br />JPG, PNG, PDF up to 5MB</span>
                    </>
                  )}
                </div>

                <div className={s.formGroup} style={{ marginBottom: '20px' }}>
                  <label>Document Number</label>
                  <input type="text" name="id_document_number" placeholder="Enter Document Number" className={s.input} value={form.id_document_number} onChange={handleChange} />
                </div>

                <div className={s.formGroup}>
                  <label>Expiry Date <span>(if applicable)</span></label>
                  <input type="text" name="id_expiry_date" placeholder="DD / MM / YYYY" className={`${s.input} ${s.date}`} value={form.id_expiry_date} onChange={handleChange} />
                </div>

                <div className={s.secureBadge}>
                  <svg className={s.secureIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <div>
                    <h4>Your documents are secure and encrypted.</h4>
                    <p>We only use them for verification purposes.</p>
                  </div>
                </div>
              </div>

              {/* ── Right: Selfie ── */}
              <div className={s.card} style={{ marginBottom: 0, position: 'relative' }}>
                {scanning && (
                  <div className={s.scanningOverlay}>
                    <div className={s.scanLine}></div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    <div className={s.scanningText}>AI is comparing your face...</div>
                  </div>
                )}
                {scanComplete && (
                  <div className={s.scanningOverlay} style={{ background: 'rgba(240,253,244,0.97)' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '18px', marginTop: '15px' }}>Face Match Successful!</div>
                    <div style={{ color: '#15803d', fontSize: '14px', marginTop: '6px' }}>Identity Verified ✓</div>
                  </div>
                )}

                <div className={s.cardHeader}>
                  <svg className={s.cardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  <h3>Selfie Verification</h3>
                </div>

                <div className={s.formGroup} style={{ marginBottom: '12px' }}>
                  <label style={{ marginBottom: '10px' }}>Upload / Capture Selfie</label>

                  {/* Camera view */}
                  {showCamera && (
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '12px', background: '#000', maxHeight: '220px', objectFit: 'cover' }} />
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className={s.primaryBtn} style={{ flex: 1 }} onClick={capturePhoto}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/></svg>
                          Capture
                        </button>
                        <button className={s.backBtn} onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setShowCamera(false); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selfie preview */}
                  {!showCamera && (
                    <div className={s.selfieBox} style={selfiePreview ? { border: '2px solid #38a169', padding: '8px' } : {}}>
                      {selfiePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selfiePreview} alt="Selfie" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" style={{ margin: '20px 0' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                      {selfiePreview && (
                        <div style={{ color: '#38a169', fontWeight: 600, fontSize: '13px', marginTop: '8px' }}>✓ Selfie captured</div>
                      )}
                    </div>
                  )}

                  {cameraError && (
                    <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                      ⚠️ {cameraError}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {!showCamera && (
                  <div className={s.actionButtons}>
                    <button className={s.actionBtn} onClick={selfiePreview ? retakePhoto : handleSelfieUploadClick}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {selfiePreview ? 'Re-upload' : 'Upload Selfie'}
                    </button>
                    <span className={s.or}>or</span>
                    <button className={s.actionBtn} onClick={selfiePreview ? retakePhoto : startCamera}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      {selfiePreview ? 'Retake' : 'Take Selfie'}
                    </button>
                  </div>
                )}

                <div className={s.purposeBox} style={{ marginTop: '25px' }}>
                  <h4>Purpose</h4>
                  <p>AI compares your selfie with your government ID to verify your identity.</p>
                  <div className={s.aiFlow}>
                    <div className={s.flowItem}>
                      <div className={s.flowIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                      </div>
                      Selfie
                    </div>
                    <svg className={s.flowArrow} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <div className={s.flowItem}>
                      <div className={s.flowIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      Government ID
                    </div>
                    <svg className={s.flowArrow} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <div className={s.flowItem}>
                      <div className={`${s.flowIcon} ${s.blue}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                      </div>
                      Face Match
                    </div>
                  </div>
                </div>

                <div className={s.tipsBox}>
                  <div className={s.tipsHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Tips for best results
                  </div>
                  <ul>
                    <li>Use a well-lit area</li>
                    <li>Remove glasses or headgear</li>
                    <li>Look directly at the camera</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`${s.footer} ${s.between}`}>
              <button className={s.backBtn} onClick={() => setStep(3)} disabled={loading || scanning}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <button className={s.primaryBtn} onClick={handleStep4Submit} disabled={loading || scanning || scanComplete}>
                {loading || scanning || scanComplete ? 'Processing...' : 'Save & Continue'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: CONTACT VERIFICATION ── */}
        {step === 5 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>STEP 5 - CONTACT VERIFICATION</h2>
                <p>Verify your phone number to ensure we can reach you for important updates.</p>
              </div>
              <div className={s.stepIndicators}>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.checked}`}>✓</div>
                <div className={`${s.indicatorLine} ${s.checked}`}></div>
                <div className={`${s.indicatorCircle} ${s.current}`}>5</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>6</div>
                <div className={s.indicatorLine}></div>
                <div className={s.indicatorCircle}>7</div>
              </div>
            </div>

            <div className={s.card}>
              <div className={s.cardHeader}>
                <svg className={s.cardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <h3>Phone Verification</h3>
              </div>
              
              <div className={s.formGroup} style={{ marginBottom: '20px' }}>
                <label>Phone Number</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" name="phone_number" placeholder="+91 Enter 10-digit number" className={s.input} value={form.phone_number} onChange={handleChange} disabled={form.phone_verified || otpSent} style={{ flex: 1 }} />
                  {!form.phone_verified && !otpSent && (
                    <button className={s.secondaryBtn} onClick={handleSendOtp} style={{ whiteSpace: 'nowrap' }}>
                      Send OTP
                    </button>
                  )}
                </div>
              </div>

              {otpSent && !form.phone_verified && (
                <div className={s.formGroup} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label>Enter 6-digit OTP</label>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>An OTP has been sent to {form.phone_number}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="123456" className={s.input} value={otpValue} onChange={e => setOtpValue(e.target.value)} style={{ flex: 1, letterSpacing: '2px', fontWeight: 'bold' }} />
                    <button className={s.primaryBtn} onClick={handleVerifyOtp} style={{ width: 'auto', padding: '0 20px' }}>
                      Verify
                    </button>
                  </div>
                  {otpError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{otpError}</p>}
                </div>
              )}

              {form.phone_verified && (
                <div className={s.secureBadge} style={{ background: '#f0fdf4', borderColor: '#bbf7d0', marginTop: '20px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <div style={{ color: '#166534', fontWeight: 600 }}>
                    Phone Number Verified Successfully!
                  </div>
                </div>
              )}
            </div>

            <div className={`${s.footer} ${s.between}`}>
              <button className={s.backBtn} onClick={() => setStep(4)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <button className={s.primaryBtn} onClick={handleStep5Submit}>
                Save & Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: BANK DETAILS ── */}
        {step === 6 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>STEP 6 - BANK DETAILS</h2>
                <p>Please provide your bank account details. This will be used for secure payouts.</p>
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
              <div className={s.cardHeader} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#f0f4f8', padding: '12px', borderRadius: '50%', color: '#2563eb' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Bank Account Information</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>All payouts will be transferred to this bank account.</p>
                </div>
              </div>
              
              <div className={s.secureBadge} style={{ marginBottom: '24px', background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div style={{ fontSize: '14px', color: '#334155' }}>
                  <span style={{ color: '#2563eb', fontWeight: 500 }}>Your</span> bank details are encrypted and 100% secure. We <span style={{ color: '#2563eb', fontWeight: 500 }}>never store your</span> full account information.
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Account Holder Name</label>
                  <div className={s.inputWithIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input type="text" name="bank_account_name" placeholder="Enter account holder name" className={s.input} value={form.bank_account_name} onChange={handleChange} />
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label>Bank Name</label>
                  <div className={s.inputWithIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <input type="text" name="bank_name" placeholder="Select your bank" className={s.input} value={form.bank_name} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Account Number</label>
                  <div className={s.inputWithIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <input type="password" name="bank_account_number" placeholder="Enter account number" className={s.input} value={form.bank_account_number} onChange={handleChange} />
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label>Confirm Account Number</label>
                  <div className={s.inputWithIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <input type="text" placeholder="Re-enter account number" className={s.input} />
                  </div>
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>IFSC Code</label>
                  <div className={s.inputWithIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <input type="text" name="bank_ifsc" placeholder="Enter IFSC code" className={s.input} value={form.bank_ifsc} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label>Branch Name</label>
                  <div className={s.inputWithIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <input type="text" name="bank_branch_name" placeholder="Enter branch name" className={s.input} value={form.bank_branch_name} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Account Type</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="bank_account_type" value="Savings Account" checked={form.bank_account_type === 'Savings Account'} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      Savings Account
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="bank_account_type" value="Current Account" checked={form.bank_account_type === 'Current Account'} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      Current Account
                    </label>
                  </div>
                </div>
              </div>
              
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px', marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ marginTop: '2px' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <div style={{ fontSize: '13px', color: '#92400e' }}>
                  <strong>Important:</strong> Ensure all details are correct. Incorrect details may cause delays in payouts or failed transactions.
                </div>
              </div>
            </div>

            <div className={`${s.footer} ${s.between}`}>
              <button className={s.backBtn} onClick={() => setStep(5)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <button className={s.primaryBtn} onClick={handleStep6Submit}>
                Save & Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 7: SUBMISSION REVIEW ── */}
        {step === 7 && (
          <div className={s.stepContainer}>
            <div className={s.header}>
              <div className={s.titleArea}>
                <h2>STEP 7 - SUBMISSION REVIEW</h2>
                <p>Please review all your information carefully before submitting your seller application.</p>
              </div>
            </div>

            <div className={s.reviewGrid}>
              {/* Personal Info */}
              <div className={s.reviewCard}>
                <div className={s.reviewCardHeader}>
                  <div className={s.reviewCardTitle}>
                    <div className={s.reviewIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                    Personal Information
                  </div>
                  <button className={s.editBtn} onClick={() => setStep(3)}>Edit <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                </div>
                <div className={s.reviewRow}><span>Full Name</span><span>{userData.username}</span></div>
                <div className={s.reviewRow}><span>Date of Birth</span><span>{form.dob}</span></div>
                <div className={s.reviewRow}><span>Gender</span><span>{form.gender}</span></div>
                <div className={s.reviewRow}><span>Nationality</span><span>{form.nationality}</span></div>
                <div className={s.reviewRow}>
                  <span>Address</span>
                  <span style={{ textAlign: 'right' }}>{form.street_address}, {form.city}<br/>{form.state}, {form.country} - {form.postal_code}</span>
                </div>
              </div>

              {/* Identity Verification */}
              <div className={s.reviewCard}>
                <div className={s.reviewCardHeader}>
                  <div className={s.reviewCardTitle}>
                    <div className={s.reviewIcon} style={{ background: '#f0fdf4' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                    Identity Verification
                  </div>
                  <button className={s.editBtn} onClick={() => setStep(4)}>Edit <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                </div>
                <div className={s.reviewRow}><span>Document Type</span><span>{form.id_document_type}</span></div>
                <div className={s.reviewRow}><span>Document Number</span><span>{form.id_document_number.replace(/.(?=.{4})/g, 'X')}</span></div>
                <div className={s.reviewRow}><span>Expiry Date</span><span>{form.id_expiry_date || '-'}</span></div>
                <div className={s.reviewRow}><span>Selfie Verification</span><span className={s.statusVerified}>✓ Verified</span></div>
              </div>

              {/* Contact Verification */}
              <div className={s.reviewCard}>
                <div className={s.reviewCardHeader}>
                  <div className={s.reviewCardTitle}>
                    <div className={s.reviewIcon} style={{ background: '#f5f3ff' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    Contact Verification
                  </div>
                  <button className={s.editBtn} onClick={() => setStep(5)}>Edit <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                </div>
                <div className={s.reviewRow}><span>Contact Method</span><span>Phone Number</span></div>
                <div className={s.reviewRow}><span>Phone Number</span><span>{form.phone_number}</span></div>
                <div className={s.reviewRow}><span>Email Address</span><span>{userData.email}</span></div>
                <div className={s.reviewRow}><span>Verification Status</span><span className={s.statusVerified}>✓ Verified</span></div>
              </div>

              {/* Bank Details */}
              <div className={s.reviewCard}>
                <div className={s.reviewCardHeader}>
                  <div className={s.reviewCardTitle}>
                    <div className={s.reviewIcon} style={{ background: '#fffbeb' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
                    Bank Details
                  </div>
                  <button className={s.editBtn} onClick={() => setStep(6)}>Edit <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                </div>
                <div className={s.reviewRow}><span>Account Holder Name</span><span>{form.bank_account_name}</span></div>
                <div className={s.reviewRow}><span>Bank Name</span><span>{form.bank_name}</span></div>
                <div className={s.reviewRow}><span>Account Number</span><span>{form.bank_account_number.replace(/.(?=.{4})/g, 'X')}</span></div>
                <div className={s.reviewRow}><span>IFSC Code</span><span>{form.bank_ifsc}</span></div>
                <div className={s.reviewRow}><span>Branch Name</span><span>{form.bank_branch_name}</span></div>
                <div className={s.reviewRow}><span>Account Type</span><span>{form.bank_account_type}</span></div>
              </div>
            </div>

            <div className={s.reviewImportantNote}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '50%' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Important Note</h4>
              </div>
              <ul className={s.importantList}>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Please ensure all information provided is correct.</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> You will not be able to edit these details after submission.</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Our team will review your application and notify you within 2-3 business days.</li>
              </ul>
            </div>

            <div className={s.confirmationCheckbox}>
              <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', fontWeight: 500, fontSize: '15px', color: '#334155' }}>
                <input type="checkbox" id="review_confirm" style={{ width: '20px', height: '20px', accentColor: '#2563eb', cursor: 'pointer' }} />
                I confirm that all the information provided is true and correct to the best of my knowledge.
              </label>
            </div>

            <div className={`${s.footer} ${s.between}`} style={{ marginTop: '30px' }}>
              <button className={s.backBtn} onClick={() => setStep(6)} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <button className={s.primaryBtn} onClick={handleFinalSubmit} disabled={loading} style={{ background: '#2563eb' }}>
                {loading ? 'Submitting...' : 'Submit Application'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
              {loading && <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right', width: '100%', marginTop: '8px' }}>🔒 Your data is secure and encrypted</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
