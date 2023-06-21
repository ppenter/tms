import { useFrappeAuth } from "frappe-react-sdk"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Auth() {
  const [count, setCount] = useState(0)

  const {currentUser, login, logout} = useFrappeAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if(currentUser){
      navigate('/')
    }
  },[])

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2>เข้าสู่ระบบ</h2>
      <input type='text' />
      <button onClick={e => {
        login('administrator', '092353457z')
      }}>Login</button>
    </div>
  )
}

export default Auth
