import { useEffect, useState } from 'react'
import './App.css'
import { useFrappeAuth } from 'frappe-react-sdk'
import { Outlet, useNavigate } from 'react-router-dom'
function App() {
  const [count, setCount] = useState(0)

  const {currentUser} = useFrappeAuth()
  const navigate = useNavigate()

  return (
    <div>
      สวัสดี, {currentUser}
      <Outlet/>
    </div>
  )
}

export default App
