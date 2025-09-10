'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/utils/api';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { useLang } from '@/hooks/useLang.js';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useLang();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 11 digits (0 + 10 digits)
    if (digits.length > 11) return phoneNumber;

    // Always start with 0 for display
    if (digits.length === 0) return '';
    if (digits[0] !== '0') return '0' + digits.slice(0, 10);

    return digits;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      setError(t('auth.phoneValidationError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.requestOtp(phoneNumber);
      // Navigate to OTP verification page with phone number
      router.push(`/verify-otp?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError(
        err.response?.data?.message ||
        t('auth.otpSendError')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError('');
  };

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="tg-topbar flex items-center px-4 py-3 sticky top-0 z-40 bg-white border-b">
        <button
          onClick={() => router.back()}
          className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowBackIcon />
        </button>
        <h1 className="text-xl font-semibold">{t('auth.login')}</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon sx={{ fontSize: 40, color: '#2563eb' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('auth.enterPhoneTitle')}</h2>
            <p className="text-gray-600">
              {t('auth.verificationMessage')}
            </p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.phoneNumberLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">🇮🇷 +98</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="09123456789"
                  className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SendIcon sx={{ fontSize: 20 }} />
              )}
              <span className="text-lg font-medium">
                {loading ? t('auth.sendingOtp') : t('auth.sendOtp')}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t('auth.termsAndPrivacy')}
          </div>
        </div>
      </div>
    </div>
  );
}
