'use client'
import React, { useState } from 'react'
import {startAuthentication, startRegistration} from '@simplewebauthn/browser'

const Login = () => {

    const [userId,setUserId]=useState("");
    const [islogin,setIslogin]=useState(false);
    const backendInternal =process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001'
    const handleSubmit=async (e: React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();

        const response = await fetch(`${backendInternal}/api/auth/login-challenge`,{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',

            },
            body: JSON.stringify({userId})
        })

        const challengeResult=await response.json();
        const {options}=challengeResult;

        const authResult=await startAuthentication({optionsJSON:options});
        console.log(authResult);

        await fetch(`${backendInternal}/api/auth/login-verify`,{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({userId,cred: authResult})
        })
        .then(()=>{
            console.log("Login successful!");
            setIslogin(true);
        })
        .catch((error)=>{
            console.log("something went wrong",error);
        })
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" id="userId" placeholder='Enter userId' onChange={(e)=>setUserId(e.target.value)}></input>
                <button type="submit">Authenticate with passkey</button>
            </form>
            {islogin && <p>Login Successful!</p>}
        </div>
    )
}

export default Login