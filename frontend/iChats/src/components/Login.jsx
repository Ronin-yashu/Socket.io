import React from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import spaceBackground from '../assets/space.jpg'
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
const delay = (d) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, d * 1000);
        })
    }

const Login = () => {
    const navigate = useNavigate();
    const { register,reset, handleSubmit, formState: { errors, isSubmitting } } = useForm({mode: "onChange"});
    const onSubmit = async (data) => {
    await delay(1);
    console.log(data)
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
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
                Object.values(result.errors).forEach(errMsg => {
                    toast.error(errMsg);
                });
            } else {
                toast.error(result.message || 'An unknown error occurred.');
            }
            localStorage.removeItem('authToken'); 
        }
    } catch (error) {
        console.error("Critical Frontend Error:", error);
        toast.error('Network error: Could not connect to the server.');
    }
};

    return (
        <div style={{ backgroundImage: `url(${spaceBackground})`}} className="h-screen box-border flex justify-center items-center w-screen bg-no-repeat object-bottom-right bg-cover">
            <div className='w-2/5 h-3/4 rounded-lg flex flex-col justify-center items-center'>
                <div className='flex flex-col w-full h-[35%] justify-center items-center '>
                    <h3 className='text-5xl font-bold text-white'>Welcome to iChats</h3>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col w-full  h-[60%] justify-center items-center gap-3'>

                    <h2 className='text-2xl text-white'>Login to your account</h2>

                    {isSubmitting && <span className='text-green-500'>Submitting...</span>}
                    
                    {errors.username && <span className='text-red-500'>{errors.username.message}</span>}
                    <input className="w-2xs p-2 rounded-3xl border-2 border-gray-400" {...register("username", { required: "username is required", minLength: { value: 4, message: "Username must be atleast 4 characters long" }, maxLength: { value: 16, message: "Username lenght cannot exceed 16 characters" } })} placeholder="Enter your username" />
                    
                    
                    {errors.password && <span className='text-red-500'>{errors.password.message}</span>}
                    <input type='password' className='w-2xs p-2 rounded-3xl border-2 border-gray-400' {...register("password", { required: "password is required", minLength: { value: 8, message: "password must be atleast 8 characters long" } })} placeholder='Enter your password' />

                    <input type="submit" className='text-white hover:text-red-700 bg-indigo-500 p-3 rounded-3xl' value="Continue Securely" />
                </form>

                <div className='w-full h-1/10 flex justify-center items-center  '>
                    <ul className='flex justify-between items-center gap-5 list-none '>
                        <li><Link className='underline hover:text-indigo-700' to='/Forgot'>Forgot password ?</Link></li>
                        <li><Link className="underline hover:text-indigo-700" to='/Register'>Don't have an account ? Sign up</Link></li>
                    </ul>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
        </div>
    )
}

export default Login
