import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import spaceBackground from '../assets/space.jpg';
import { ToastContainer, toast } from 'react-toastify';

const delay = (d) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, d * 1000);
    });
};

const Login = () => {
    const navigate = useNavigate();
    const {
        register,
        reset,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ mode: 'onChange' });

    const onSubmit = async (data) => {
        await delay(1);
        console.log(data);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.status === 200) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('username', result.user.username);
                localStorage.setItem('userId', result.user.id);

                toast.success(result.message);
                reset();
                setTimeout(() => {
                    navigate('/Home');
                }, 2000);
            } else if (response.status === 202) {
                localStorage.setItem('twoFaToken', result.twoFaToken);
                toast.info(result.message);
                reset();
                setTimeout(() => {
                    navigate('/2fa-verify');
                }, 500);
            } else {
                if (response.status === 400 && result.errors) {
                    toast.error(result.message || 'Please correct the form errors.');
                    Object.values(result.errors).forEach((errMsg) => {
                        toast.error(errMsg);
                    });
                } else {
                    toast.error(result.message || 'An unknown error occurred.');
                }
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
            }
        } catch (error) {
            console.error('Critical Frontend Error:', error);
            toast.error('Network error: Could not connect to the server.');
        }
    };

    return (
        <div
            style={{ backgroundImage: `url(${spaceBackground})` }}
            className="min-h-screen flex justify-center items-center w-screen bg-no-repeat bg-cover bg-center p-4 sm:p-6 md:p-8"
        >
            {/* Floating Container */}
            <div
                className="w-full max-w-sm sm:max-w-md md:max-w-lg p-6 sm:p-8 rounded-2xl flex flex-col items-center 
        bg-zinc-800/80 backdrop-blur-sm shadow-2xl shadow-indigo-900/50 
        border border-indigo-700/50 text-white"
            >
                {/* Title Section */}
                <div className="w-full mb-6 sm:mb-8 text-center">
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-wider">
                        Welcome to <span className="text-indigo-400">iChats</span>
                    </h3>
                    <h2 className="text-base sm:text-lg md:text-xl mt-3 text-gray-300">
                        Login to your Secure Account
                    </h2>
                </div>

                {/* Form Section */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col w-full gap-4 sm:gap-5"
                >
                    {isSubmitting && (
                        <span className="text-green-400 text-center">Submitting...</span>
                    )}

                    {/* Username Input */}
                    <div className="space-y-1">
                        {errors.username && (
                            <span className="text-red-400 text-sm">
                                {errors.username.message}
                            </span>
                        )}
                        <input
                            className="w-full p-3 sm:p-3.5 rounded-lg bg-zinc-700 border border-transparent 
              focus:ring-2 focus:ring-indigo-500 focus:outline-none 
              text-white placeholder-gray-400 text-sm sm:text-base"
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

                    {/* Password Input */}
                    <div className="space-y-1">
                        {errors.password && (
                            <span className="text-red-400 text-sm">
                                {errors.password.message}
                            </span>
                        )}
                        <input
                            type="password"
                            className="w-full p-3 sm:p-3.5 rounded-lg bg-zinc-700 border border-transparent 
              focus:ring-2 focus:ring-indigo-500 focus:outline-none 
              text-white placeholder-gray-400 text-sm sm:text-base"
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full p-3 sm:p-3.5 mt-2 rounded-lg font-semibold tracking-wider 
            bg-gradient-to-r from-indigo-600 to-purple-600 
            hover:from-indigo-700 hover:to-purple-700 
            transition duration-200 shadow-lg shadow-indigo-500/30 text-sm sm:text-base"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Verifying...' : 'Continue Securely'}
                    </button>
                </form>

                {/* Links Section */}
                <div className="w-full mt-5 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-center sm:text-left">
                    <Link
                        className="text-gray-400 hover:text-indigo-400 underline transition duration-200"
                        to="/Forgot"
                    >
                        Forgot password?
                    </Link>
                    <Link
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition duration-200"
                        to="/Register"
                    >
                        Don&apos;t have an account? Sign up
                    </Link>
                </div>
            </div>

            {/* Toast Container */}
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

export default Login;
