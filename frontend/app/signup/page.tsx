'use client'
import { useState } from 'react';
import { useRouter } from "next/navigation";

const Signup = () => {
    const backendInternal =process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001'
    const router=useRouter();
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");

    const handleSubmit = async (e: React.FormEvent)=>{
        e.preventDefault();
        const response=await fetch(`${backendInternal}/api/auth/register`,{
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                username: username,
                password: password,
            })

        })

        const result=await response.json();
        const {id}=result;
        console.log(id);
        router.push(`/profile/${id}`);
    }
    return (
        <div>
            <h1>Sign up</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder='Enter username' id="username" onChange={(e) => setUsername(e.target.value)}></input>
                <br/>
                <input type="password" placeholder='Enter password' id="password" onChange={(e)=>setPassword(e.target.value)}></input>
                <br/>
                <button type="submit">Register</button>
            </form>
        </div>
    )
}

export default Signup