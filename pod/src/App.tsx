import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { FrappeProvider } from 'frappe-react-sdk'
import {POD} from './pages/Pod'
function App() {
  const [count, setCount] = useState(0)

  return (
	<div className="App w-screen h-screen overflow-auto flex flex-col items-center">
		<head>
			<title>TMS POD</title>
			<meta name="description" content="โปรแกรมยืนยันการส่งสินค้า" />
		</head>
	  <FrappeProvider>
	  		<div className='max-w-md w-full pt-12 p-4 pb-64'>
			<POD />	
			</div>
	  </FrappeProvider>
	</div>
  )
}

export default App
