'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/utils/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useLang } from '@/hooks/useLang.js';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const inputRefs = useRef([]);
  const phoneNumber = searchParams.get('phone');
  const { t } = useLang();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
      return;
    }

    if (!phoneNumber) {
      router.push('/login');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, phoneNumber, router]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (error) setError('');

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && !loading) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode = null) => {
    const currentOtp = otpCode || otp.join('');
    
    if (currentOtp.length !== 5) {
      setError('Please enter the complete 5-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOtp(phoneNumber, currentOtp);
      
      // Login the user with the received token
      const { access_token } = response.data;
      await login({ phone: phoneNumber }, access_token);
      
      router.push('/');
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(
        err.response?.data?.message || 
        'Invalid verification code. Please try again.'
      );
      // Clear OTP on error
      setOtp(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');

    try {
      await authAPI.requestOtp(phoneNumber);
      setCountdown(60);
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!phoneNumber) {
    return null; // Will redirect
  }

  const maskedPhone = phoneNumber.replace(/(\d{4})(\d{3})(\d{4})/, '$1***$3');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="tg-topbar flex items-center px-4 py-3 sticky top-0 z-40 bg-white border-b">
        <button
          onClick={() => router.back()}
          className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowBackIcon />
        </button>
        <h1 className="text-xl font-semibold">Verify Phone</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SecurityIcon sx={{ fontSize: 40, color: '#059669' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
            <p className="text-gray-600 mb-1">
              We've sent a 5-digit code to
            </p>
            <p className="font-medium text-gray-800">{maskedPhone}</p>
          </div>

          <div className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the code?
              </p>
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend code in {countdown} seconds
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
                >
                  {resendLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  )}
                  {resendLoading ? t('auth.resendCodeSending') : t('auth.resendCode')}
                </button>
              )}
            </div>

            {loading && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Enter the 5-digit code sent to your phone</p>
            <p className="mt-1">For testing, use: <span className="font-mono font-bold">12345</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}