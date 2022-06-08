import React, { useState, useRef } from 'react';
import './App.css';

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

import { doc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyBdZCp2iwnTEHS1RY_TVvl8WXD3L-bHK1Q",
  authDomain: "first-firebase-app-bf1f1.firebaseapp.com",
  projectId: "first-firebase-app-bf1f1",
  storageBucket: "first-firebase-app-bf1f1.appspot.com",
  messagingSenderId: "819801683141",
  appId: "1:819801683141:web:6fd99a46e46dccdf49acac",
  measurementId: "G-CQY3WWFMEC"
})

const auth = firebase.auth();
const firestore = firebase.firestore();


//if the user is signed in, user is an object. if the user is signed out, user is null

function App() {
  const [user] = useAuthState(auth);
  //if the user is defined, show ChatRoom, otherwise show SignIn
  return (
    <div className="App">
      <header>
        <h1>ChatApp</h1>
        <SignOut />
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    //Google sign-in popup utilizing firebase authentication sdk
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <button onClick = {signInWithGoogle}>Sign in with Google</button>
  )
}

function SignOut() {
  // auth.currentUser evaluates to true if the user is signed in and false if the user is signed out, 
  // && operator in React uses conditional rendering to display the Sign Out button if the expression before the operator is true.
  return auth.currentUser && (
    <button onClick = {() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom() {
  // reference the firestore collection
  const messagesRef = firestore.collection('messages');
  //queries for the most recent 25 messages
  const query = messagesRef.orderBy('createdAt').limit(25);

  //Returns an array of objects where each object is a message from the firestore db
  const [messages] = useCollectionData(query, {idField: 'id'});

  const [formValue, setFormValue] = useState('');

  const dummy = useRef();
  
  //async function that takes the event as its argument
  const sendMessage = async(e) => {
    //prevents the page from being refreshed when a form is submitted
    e.preventDefault();
    const messageId = messages.length;
    //get the user id and photo url of the current user
    const {uid, photoURL, displayName} = auth.currentUser;

    
    //writes a new document to the firestore database. takes a javascript object with the values that you want to write to the database as an argument.
    await messagesRef.doc(`/${messageId}`).set({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName,
      messageId,
    });

    setFormValue('');

    dummy.current.scrollIntoView({ behavior: 'smooth' });

  }

  // creates a ChatMessage element for each message, displays the input field and the submit button.
  // the input is assigned to formValue which is used as the text property of the message above
  return (
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key = {msg.id} message={msg} />)}
        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input value = {formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  )

  
}

function ChatMessage(props) {
  const {text, uid, photoURL, displayName, messageId} = props.message;
  // if the current user's id equals the user id of the message, the messageClass is 'sent', otherwise the messageClass is 'received'
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  const messageRef = doc(firestore, 'messages', `/${messageId}`)
  const handleDelete = (messageId) => {
    updateDoc(messageRef, {
      text: '[Message Deleted.]'
    });
  }


  const handleEdit = (messageId) => {
    var input = prompt("Enter the new message.");
    updateDoc(messageRef, {
      text: input
    })
  }
  //using the ternary operator, if the message was sent display the edit and delete buttons, if the message was received display the message normally.
  return (messageClass === 'sent' ?
    <>
    <div className={`message ${messageClass}`}>
      <img src = {photoURL} />
      <p>{text}</p>
      <p class="editButton" onClick={() => handleEdit(messageId)}>✎</p>
      <p class="editButton" onClick={() => handleDelete(messageId)}>x</p>
    </div>
    <h4 className={`message ${messageClass}`}>{displayName}</h4>
    </> :
    <>
    <div className={`message ${messageClass}`}>
    <img src = {photoURL} />
    <p>{text}</p>
    </div>
    <h4 className={`message ${messageClass}`}>{displayName}</h4>
    </>
  )

}

export default App;
