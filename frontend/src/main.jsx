import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// #region agent log
fetch('http://127.0.0.1:7852/ingest/afc955dc-9d20-480c-ae49-585cc1d8bbca',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d36a5'},body:JSON.stringify({sessionId:'4d36a5',runId:'login-404',hypothesisId:'A',location:'main.jsx:boot',message:'app boot',data:{path:window.location.pathname,host:window.location.host,supabaseSet:Boolean(import.meta.env.VITE_SUPABASE_URL)},timestamp:Date.now()})}).catch(()=>{})
// #endregion
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
