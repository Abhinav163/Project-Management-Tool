// // src/Signup.js
// import React, { useState } from "react";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../firebase";

// const Signup = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState(null);

//   const handleSignup = (e) => {
//     e.preventDefault();
//     createUserWithEmailAndPassword(auth, email, password)
//       .then((userCredential) => {
//         console.log("User signed up:", userCredential.user);
//       })
//       .catch((err) => {
//         setError(err.message);
//       });
//   };

//   return (
//     <div className="container">
//       <div className="form-container">
//         <h2>Create Account</h2>
//         <form onSubmit={handleSignup}>
//           <input type="email" id="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
//           <input type="password" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
//           <button type="submit">Create Account</button>
//           {error && <p id="error-message">{error}</p>}
//         </form>
//         <p> Already have an account? <a href="/login">Login here</a></p>
//       </div>
//     </div>
//   );
// };

// export default Signup;
