import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { KeyRound, Phone, Lock, ArrowLeft, Check, User, AlertCircle } from 'lucide-react';
import spaceBackground from '../assets/space.jpg';

const Forgot = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Username, 2: OTP, 3: Reset Password
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [accountType, setAccountType] = useState(''); // 'Forgot' or 'NoForgot'
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm({ mode: "onChange" });
  
  const password = watch("newPassword");

  // Step 1: Check Username and Account Type
  const handleCheckUsername = async (data) => {
    try {
      const response = await fetch('/api/forgot/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username })
      });

      const result = await response.json();

      if (response.ok) {
        setUsername(data.username);
        setAccountType(result.accountType);
        setPhoneNumber(result.phoneNumber);

        // Check if account has recovery enabled
        if (result.accountType === 'NoForgot') {
          toast.error('This is a SECURE ACCOUNT without recovery option. Password cannot be reset.');
          return;
        }

        // Account has recovery enabled
        toast.success('Account found! Proceeding to send OTP...');
        
        // Automatically request OTP
        setTimeout(() => {
          handleRequestOTP(data.username, result.phoneNumber);
        }, 1000);

      } else {
        toast.error(result.message || 'Username not found');
      }
    } catch (error) {
      console.error('Check Username Error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  // Step 2: Request OTP (called automatically after username check)
  const handleRequestOTP = async (uname, phone) => {
    try {
      const response = await fetch('/api/forgot/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname || username, phoneNumber: phone || phoneNumber })
      });

      const result = await response.json();

      if (response.ok) {
        setOtpToken(result.otpToken);
        toast.success(result.message || 'OTP sent to your phone!');
        setStep(2);
        reset();
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Request OTP Error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (data) => {
    try {
      const response = await fetch('/api/forgot/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otpToken: otpToken,
          otp: data.otp 
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'OTP verified!');
        setStep(3);
        reset();
      } else {
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  // Step 4: Reset Password
  const handleResetPassword = async (data) => {
    try {
      const response = await fetch('/api/forgot/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otpToken: otpToken,
          username: username,
          newPassword: data.newPassword 
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Password reset successful!');
        reset();
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset Password Error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const onSubmit = (data) => {
    if (step === 1) {
      handleCheckUsername(data);
    } else if (step === 2) {
      handleVerifyOTP(data);
    } else if (step === 3) {
      handleResetPassword(data);
    }
  };

  return (
    <div 
      style={{ backgroundImage: `url(${spaceBackground})` }} 
      className="h-screen box-border flex justify-center items-center w-screen bg-no-repeat bg-cover bg-center"
    >
      <div className='w-full max-w-md mx-4 rounded-2xl flex flex-col justify-center items-center bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 p-8'>
        
        {/* Header */}
        <div className='w-full mb-8'>
          <Link to="/" className='flex items-center gap-2 text-white hover:text-indigo-300 transition-colors mb-6'>
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Login</span>
          </Link>
          
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className='text-4xl font-bold text-center text-white mb-2'>Forgot Password</h1>
          <p className='text-center text-gray-300 text-sm'>
            {step === 1 && "Enter your username to verify account"}
            {step === 2 && "Enter the OTP sent to your phone"}
            {step === 3 && "Create a new password for your account"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="w-full flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-indigo-500' : 'bg-gray-600'
                } transition-colors duration-300`}>
                  {step > s ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{s}</span>
                  )}
                </div>
                <span className={`text-xs mt-2 ${step >= s ? 'text-white' : 'text-gray-400'}`}>
                  {s === 1 ? 'Username' : s === 2 ? 'Verify' : 'Reset'}
                </span>
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-indigo-500' : 'bg-gray-600'} transition-colors duration-300`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col w-full gap-4'>
          
          {isSubmitting && <span className='text-green-400 text-center'>Processing...</span>}

          {/* Step 1: Enter Username */}
          {step === 1 && (
            <>
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-2 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white">
                  Only accounts with <span className="font-bold">phone recovery enabled</span> can reset password. Secure accounts cannot be recovered.
                </p>
              </div>

              {errors.username && <span className='text-red-400 text-sm'>{errors.username.message}</span>}
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type='text'
                  className='w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-600 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors'
                  {...register("username", {
                    required: "Username is required",
                    minLength: { value: 4, message: "Username must be at least 4 characters" },
                    maxLength: { value: 16, message: "Username cannot exceed 16 characters" }
                  })}
                  placeholder='Enter your username'
                />
              </div>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <>
              <div className="bg-indigo-500/20 border border-indigo-500/50 rounded-xl p-4 mb-2">
                <p className="text-sm text-white text-center">
                  OTP sent to <span className="font-bold">{phoneNumber}</span>
                </p>
                <p className="text-xs text-gray-300 text-center mt-1">
                  Account: <span className="font-bold">{username}</span>
                </p>
              </div>
              
              {errors.otp && <span className='text-red-400 text-sm'>{errors.otp.message}</span>}
              <input
                type='text'
                className='w-full px-4 py-3 rounded-xl border-2 border-gray-600 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors text-center text-2xl tracking-widest'
                inputMode="numeric"
                maxLength="6"
                {...register("otp", {
                  required: "OTP is required",
                  pattern: { value: /^\d{6}$/, message: "OTP must be 6 digits" }
                })}
                placeholder='000000'
              />
              
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  reset();
                }}
                className="text-indigo-300 hover:text-indigo-200 text-sm text-center transition-colors"
              >
                Didn't receive OTP? Try again
              </button>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <>
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-2">
                <p className="text-sm text-white text-center">
                  OTP Verified! ✓
                </p>
                <p className="text-xs text-gray-300 text-center mt-1">
                  Create a new password for: <span className="font-bold">{username}</span>
                </p>
              </div>

              {errors.newPassword && <span className='text-red-400 text-sm'>{errors.newPassword.message}</span>}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type='password'
                  className='w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-600 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors'
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" }
                  })}
                  placeholder='Enter new password'
                />
              </div>

              {errors.confirmPassword && <span className='text-red-400 text-sm'>{errors.confirmPassword.message}</span>}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type='password'
                  className='w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-600 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors'
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: value => value === password || "Passwords do not match"
                  })}
                  placeholder='Confirm new password'
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className='w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-4'
          >
            {isSubmitting ? 'Processing...' : 
              step === 1 ? 'Check Account' : 
              step === 2 ? 'Verify OTP' : 
              'Reset Password'}
          </button>
        </form>

        {/* Footer */}
        <div className='w-full mt-6 text-center'>
          <Link className="text-sm text-gray-300 hover:text-white transition-colors" to='/'>
            Remember your password? <span className="text-indigo-300 font-semibold">Sign in</span>
          </Link>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} theme="dark" />
    </div>
  );
};

export default Forgot;