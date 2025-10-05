import React from 'react'
import { useForm } from 'react-hook-form'
const delay = (d) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, d * 1000);
        })
    }

const Register = () => {

  const { register, handleSubmit,watch, formState: { errors, isSubmitting } } = useForm({mode: "onChange"});

      const onSubmit = async (data) => {
          await delay(2);
          console.log(data)
          try {
            const response =  await fetch('http://localhost:3000/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const result = await response.json();
            console.log(result);

          } catch (error) {
            console.log("There was a problem with the fetch operation:", error);
          }
      }
  return (
    <div className="h-screen w-screen bg-[url('./assets/space.jpg')] bg-no-repeat object-bottom-right bg-cover flex justify-center items-center box-border">
      <div className='w-1/2 h-4/5 rounded-lg flex justify-center items-center bg-gray-50 opacity-30 '>
        <div className='w-full h-full flex flex-col justify-center items-center z-10 p-5'>

          <div className='w-full h-[10%] flex justify-center items-center'>
            <h1 className='text-3xl font-bold'>Create your account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col w-full  h-[90%] justify-center items-center gap-3'>

            {isSubmitting && <span className='text-green-500'>Submitting...</span>}

            {errors.username && <span className='text-red-500'>{errors.username.message}</span>}
            <input className="w-2xs p-2 rounded-3xl border-2 border-gray-400" {...register("username", { required: "username is required", minLength: { value: 4, message: "Username must be atleast 4 characters long" }, maxLength: { value: 16, message: "Username lenght cannot exceed 16 characters" } })} placeholder="Enter your username" />

            {errors.password && <span className='text-red-500'>{errors.password.message}</span>}
            <input type='password' className='w-2xs p-2 rounded-3xl border-2 border-gray-400' {...register("password", { required: "password is required", minLength: { value: 8, message: "password must be atleast 8 characters long" } })} placeholder='Enter your password' />

            <label>
              <input type="radio" value="NoForgot" {...register("myRadioGroup",{required:"please select a option"})} />
              Do you want a Secure Account ? *You will not be able to recover your account if you forget your password
            </label>

            <label>
              <input type="radio" value="Forgot" {...register("myRadioGroup",{required:"please select a option"})} />
              I want to use my phone number to recover my account if I forget my password
            </label>

            {errors.myRadioGroup && <span className='text-red-500'>{errors.myRadioGroup.message}</span>}

            {/* Show warning if "NoForgot" is selected */}
            {watch("myRadioGroup") === "NoForgot" && (
              <span className='text-red-500'>*Make sure you remember your password</span>
            )}

            {/* Show number input if "Forgot" is selected */}
            {watch("myRadioGroup") === "Forgot" && (
              <>
                {errors.number && <span className='text-red-500'>{errors.number.message}</span>}
                <input
                  type='tel'
                  className='w-2xs p-2 rounded-3xl border-2 border-gray-400'
                  {...register("number", {
                    required: "Enter valid number",
                    minLength: { value: 10, message: "Enter valid number" },
                    maxLength: { value: 10, message: "Enter valid number" }
                  })}
                  placeholder='Enter your number'
                />
              </>
            )}

            <input type="submit" className='text-white hover:text-red-700 bg-indigo-500 p-3 rounded-3xl' value="Continue Securely" />
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
