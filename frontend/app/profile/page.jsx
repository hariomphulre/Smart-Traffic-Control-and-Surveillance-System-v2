'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from "next/navigation";
import {startRegistration} from '@simplewebauthn/browser'
import { useSearchParams } from "next/navigation";


const Profile = () => {
    const router=useRouter();
    const searchParams = useSearchParams();
    const backendInternal =process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001'
    const handlePasskey = async (e)=>{
        e.preventDefault();
        const userId = searchParams.get("userId");

        console.log(`userId: ${userId}`);

        const response =await fetch(`${backendInternal}/api/auth/register-challenge`,{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({userId})
        }) 
        const challengeResult=await response.json();
        const {options}=challengeResult;

        const authResult= await startRegistration({optionsJSON:options});
        console.log(authResult);

        await fetch(`${backendInternal}/api/auth/register-verify`,{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({userId,cred: authResult})
        })
        .then(()=>{
            router.push('/login');
        })
        .catch((error)=>{
            console.log("Something went wrong",error)
        })
    }
    return (
        <div>
            <h1>Profile</h1>
            <button onClick={handlePasskey}>Register Passkey</button>
        </div>
    )
}

export default Profile