import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

const TwoFAVerificationPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    const handleVerification = async (data) => {
        const twoFaToken = localStorage.getItem('twoFaToken');

        if (!twoFaToken) {
            toast.error("Security error. Please log in again.");
            return navigate('/');
        }
        
        const code = data.twoFACode; 

        try {
            const response = await fetch('/api/2fa/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twoFaToken, code })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.removeItem('twoFaToken');
                localStorage.setItem('authToken', result.token); 
                toast.success(result.message); 
                setTimeout(() => navigate('/home'), 500);

            } else {
                toast.error(result.message || 'Verification failed. Try again.');
                if (response.status === 401 || response.status === 400) {
                     localStorage.removeItem('twoFaToken'); 
                     setTimeout(() => navigate('/'), 2000);
                }
            }
        } catch (error) {
            console.error("2FA Auth Fetch Error:", error);
            toast.error('Network error during verification.');
        }
    };

    return (
        <div className="h-screen flex justify-center items-center bg-zinc-800 text-white">
            <div className="p-8 bg-zinc-700 rounded-lg shadow-xl w-96">
                <h2 className="text-3xl font-bold mb-4 text-indigo-400">Two-Factor Authentication</h2>
                <p className="mb-6 text-sm text-gray-300">
                    Enter the 6-digit code from your mobile authenticator app.
                </p>

                <form onSubmit={handleSubmit(handleVerification)} className="space-y-4">
                    <input
                        type="text"
                        placeholder="6-Digit Code"
                        className="w-full p-3 rounded bg-zinc-600 border border-zinc-500 focus:ring-indigo-500 focus:border-indigo-500 text-lg tracking-widest text-center"
                        {...register("twoFACode", { required: "Code is required", pattern: { value: /^\d{6}$/, message: "Must be 6 digits" } })}
                        maxLength="6"
                        inputMode="numeric"
                    />
                    {errors.twoFACode && <p className="text-red-400 text-sm">{errors.twoFACode.message}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded disabled:bg-gray-500"
                    >
                        {isSubmitting ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
            </div>
            <ToastContainer position="top-right" autoClose={5000} theme="dark" />
        </div>
    );
};

export default TwoFAVerificationPage;