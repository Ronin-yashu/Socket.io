import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

const delay = (d) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, d * 1000);
  })
}

const Register = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({ mode: "onChange" });
  const onSubmit = async (data) => {
    await delay(2);
    console.log(data)
    try {
      const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.errors) {
          toast.error(errorData.message || 'Please correct the form errors.');
          Object.values(errorData.errors).forEach(errMsg => {
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
    await delay(6);
    setTimeout(() => {
      navigate('/');
    }, 6000);
  };

  return (
    <div className="h-screen w-screen bg-[url('./assets/space.jpg')] bg-no-repeat object-bottom-right bg-cover flex justify-center items-center box-border">
      <div className='w-1/2 h-4/5 rounded-lg flex justify-center items-center bg-white/20 backdrop-blur-md shadow-2xl'>
        <div className='w-full h-full flex flex-col justify-center items-center z-10 p-5'>

          <div className='w-full h-[10%] flex justify-center items-center'>
            <h1 className='text-4xl font-bold'>Create your account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col w-full  h-[90%] justify-center items-center gap-3'>

            {isSubmitting && <span className='text-green-500'>Submitting...</span>}

            {errors.username && <span className='text-red-500'>{errors.username.message}</span>}
            <input className="w-2xs p-2 rounded-3xl border-2 border-gray-400" {...register("username", { required: "username is required", minLength: { value: 4, message: "Username must be atleast 4 characters long" }, maxLength: { value: 16, message: "Username lenght cannot exceed 16 characters" } })} placeholder="Enter your username" />

            {errors.password && <span className='text-red-500'>{errors.password.message}</span>}
            <input type='password' className='w-2xs p-2 rounded-3xl border-2 border-gray-400' {...register("password", { required: "password is required", minLength: { value: 8, message: "password must be atleast 8 characters long" } })} placeholder='Enter your password' />

            <label>
              <input type="radio" value="NoForgot" {...register("myRadioGroup", { required: "please select a option" })} />
              Do you want a Secure Account ? *You will not be able to recover your account if you forget your password
            </label>

            <label>
              <input type="radio" value="Forgot" {...register("myRadioGroup", { required: "please select a option" })} />
              I want to use my phone number to recover my account if I forget my password
            </label>

            {errors.myRadioGroup && <span className='text-red-500'>{errors.myRadioGroup.message}</span>}

            {watch("myRadioGroup") === "NoForgot" && (
              <span className='text-red-500'>*Make sure you remember your password</span>
            )}

            {watch("myRadioGroup") === "Forgot" && (
              <>
                {errors.number && <span className='text-red-500'>{errors.number.message}</span>}
                <input
                  type='tel'
                  className='w-2xs p-2 rounded-3xl border-2 border-gray-400'
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register("number", {
                    required: "Enter valid number",
                    minLength: { value: 10, message: "Enter valid number" },
                    maxLength: { value: 10, message: "Enter valid number" },
                    pattern: { value: /^[0-9]+$/, message: "Only numbers are allowed" }
                  })}
                  placeholder='Enter your number'
                />
              </>
            )}

            <input type="submit" className='text-white hover:text-red-700 bg-indigo-500 p-3 rounded-3xl' value="Continue Securely" />
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </div>
  )
}

export default Register
