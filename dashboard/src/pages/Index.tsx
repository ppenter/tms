import { useFrappeAuth, useFrappeGetDocList } from "frappe-react-sdk"
import { useState } from "react"

function Index() {

  const {data} = useFrappeGetDocList('Employee', {
    status: 'Active'
  })

  console.log(data)

  return (
    <div className="flex flex-col gap-2 w-full">
      
    </div>
  )
}

export default Index
