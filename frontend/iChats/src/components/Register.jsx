import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import spaceBackground from '../assets/space.jpg'; // make sure path matches your folder

const delay = (d) =>
  new Promise((resolve) => setTimeout(resolve, d * 1000));

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onChange' });

  const onSubmit = async (data) => {
    await delay(2);
    console.log(data);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.errors) {
          toast.error(errorData.message || 'Please correct the form errors.');
          Object.values(errorData.errors).forEach((errMsg) => {
            toast.error(errMsg);
          });
        } else {
          toast.error(errorData.message || 'An unknown error occurred.');
        }
      }
    } catch (error) {
      toast.error('Network error: Could not connect to the server.');
    }
    toast.info('Redirecting to login page...');
    reset();
    await delay(2);
    setTimeout(() => {
      navigate('/');
    }, 6000);
  };

  return (
    <div
      style={{ backgroundImage: `url(${spaceBackground})` }}
      className="min-h-screen w-screen bg-cover bg-center bg-no-repeat flex justify-center items-center p-4 sm:p-6 md:p-8"
    >
      {/* Glassy floating card */}
      <div
        className="w-full max-w-sm sm:max-w-md md:max-w-lg p-6 sm:p-8 rounded-2xl flex flex-col items-center 
        bg-zinc-800/80 backdrop-blur-md shadow-2xl shadow-indigo-900/50 border border-indigo-700/50 text-white"
      >
        {/* Title */}
        <div className="w-full mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-wider">
            Create Your <span className="text-indigo-400">Account</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mt-2">
            Join the secure iChats network today 🚀
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col w-full gap-4 sm:gap-5"
        >
          {isSubmitting && (
            <span className="text-green-400 text-center">Submitting...</span>
          )}

          {/* Username */}
          <div className="space-y-1">
            {errors.username && (
              <span className="text-red-400 text-sm">
                {errors.username.message}
              </span>
            )}
            <input
              className="w-full p-3 sm:p-3.5 rounded-lg bg-zinc-700 border border-transparent 
              focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-400 text-sm sm:text-base"
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 4,
                  message: 'Username must be at least 4 characters long',
                },
                maxLength: {
                  value: 16,
                  message: 'Username length cannot exceed 16 characters',
                },
              })}
              placeholder="Enter your username"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            {errors.password && (
              <span className="text-red-400 text-sm">
                {errors.password.message}
              </span>
            )}
            <input
              type="password"
              className="w-full p-3 sm:p-3.5 rounded-lg bg-zinc-700 border border-transparent 
              focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-400 text-sm sm:text-base"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters long',
                },
              })}
              placeholder="Enter your password"
            />
          </div>

          {/* Radio Options */}
          <div className="flex flex-col gap-3 text-sm sm:text-base mt-2">
            <label className="flex items-start gap-2">
              <input
                type="radio"
                value="NoForgot"
                className="mt-1 accent-indigo-500"
                {...register('myRadioGroup', {
                  required: 'Please select an option',
                })}
              />
              <span>
                Do you want a <strong>Secure Account?</strong> <br />
                <span className="text-gray-400 text-xs sm:text-sm">
                  *You will not be able to recover your account if you forget
                  your password.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="radio"
                value="Forgot"
                className="mt-1 accent-indigo-500"
                {...register('myRadioGroup', {
                  required: 'Please select an option',
                })}
              />
              <span>
                Use your <strong>phone number</strong> for recovery <br />
                <span className="text-gray-400 text-xs sm:text-sm">
                  *Recover your account easily if you forget your password.
                </span>
              </span>
            </label>

            {errors.myRadioGroup && (
              <span className="text-red-400 text-sm">
                {errors.myRadioGroup.message}
              </span>
            )}
          </div>

          {/* Conditional phone number input */}
          {watch('myRadioGroup') === 'Forgot' && (
            <div className="space-y-1">
              {errors.number && (
                <span className="text-red-400 text-sm">
                  {errors.number.message}
                </span>
              )}
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full p-3 sm:p-3.5 rounded-lg bg-zinc-700 border border-transparent 
                focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-400 text-sm sm:text-base"
                {...register('number', {
                  required: 'Enter valid number',
                  minLength: {
                    value: 10,
                    message: 'Enter valid number',
                  },
                  maxLength: {
                    value: 10,
                    message: 'Enter valid number',
                  },
                  pattern: {
                    value: /^[0-9]+$/,
                    message: 'Only numbers are allowed',
                  },
                })}
                placeholder="Enter your phone number"
              />
            </div>
          )}

          {watch('myRadioGroup') === 'NoForgot' && (
            <span className="text-red-400 text-sm">
              *Make sure you remember your password carefully!
            </span>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full p-3 sm:p-3.5 mt-4 rounded-lg font-semibold tracking-wider 
            bg-gradient-to-r from-indigo-600 to-purple-600 
            hover:from-indigo-700 hover:to-purple-700 
            transition duration-200 shadow-lg shadow-indigo-500/30 text-sm sm:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Continue Securely'}
          </button>
        </form>
      </div>

      {/* Toast */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Register;
