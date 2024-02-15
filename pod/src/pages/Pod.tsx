import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchBar } from '@/components/ui/search-bar';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { formatDistance } from 'date-fns';
import { useFrappeAuth, useFrappeCreateDoc, useFrappeFileUpload, useFrappeGetDoc, useFrappeGetDocList, useFrappePostCall } from 'frappe-react-sdk';
import { CheckCircleIcon } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

export const POD = () => {
    const [mounted, setMounted] = React.useState(false)

    const [podImage, setPodImageet] = React.useState<File | null>(null)
    const [paymentImage, setPaymentImageet] = React.useState<File | null>(null)
    const [billImage, setBillImageet] = React.useState<File | null>(null)

    const {upload, reset, isCompleted} = useFrappeFileUpload()
    const [selected, setSelected] = React.useState<string>('')
    const [search, setSearch] = React.useState('')

    const [location, setLocation] = React.useState<number[]>([])

    const {currentUser, logout} = useFrappeAuth()

    const {data: delivery_orders, mutate} = useFrappeGetDocList('Delivery Order', {
        fields: ['*'],
        filters: [
            ['name', 'like', `%${search}%`]
        ],
        orderBy: {
            field: 'creation',
            order: 'desc'
        },
    })

    const {data: delivery_order, mutate: mutateDeliveryOder} = useFrappeGetDoc('Delivery Order', selected?.toUpperCase() || 'this-is-will-not-exist')

    const {data: recipient, mutate: mutateRecipient} = useFrappeGetDoc('TMS Recipient', delivery_order?.recipient_id || 'this-is-will-not-exist')
    const {data: proof_of_delivery, mutate: mutateProofOfDelivery} = useFrappeGetDoc('Proof Of Delivery', delivery_order?.name || 'this-is-will-not-exist')


    useEffect(() => {
        if (selected) {
            mutateDeliveryOder()
        }
    },[selected])

    useEffect(() => {
        if (delivery_order?.recipient_id) {
            mutateRecipient()
        }
    },[delivery_order])

    const {createDoc, isCompleted: isCreatePodComplete} = useFrappeCreateDoc()
    
    console.log(recipient)

    const {call} = useFrappePostCall('tms.tms.doctype.tms_recipient.tms_recipient.set_latitute_longitude')
    const handleUpdateLocation = async() => {
        const res = confirm(`
            คุณต้องการอัพเดทตำแหน่งของ ${recipient?.name} หรือไม่
            latitude: ${location[0]}
            longitude: ${location[1]}
        `)
        if (res) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                setLocation([position.coords.latitude, position.coords.longitude])
                await call({
                    recipient: recipient?.name,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
                await mutateRecipient()
                }
            )
        }
    }

    const handleLocation = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            setLocation([position.coords.latitude, position.coords.longitude])
            }
        )
    }



    const restart = () => {
        setSelected('')
        setPodImageet(null)
        setPaymentImageet(null)
        setBillImageet(null)
        handleLocation()
    }

    const handleChange = (name: string) => {
        setSelected(name)
        handleLocation()
    }

    const [isUploading, setIsUploading] = React.useState(false)

    const handleSubmit = async () => {
        if (!podImage) {
            toast.error('กรุณาเพิ่มรูปการส่ง')
            return
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            try{
                if(isUploading) return
                setIsUploading(true)
            setLocation([position.coords.latitude, position.coords.longitude])
            const pod = await createDoc('Proof Of Delivery',
            {
                delivery_order: selected.toUpperCase(),
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
        )
        if (podImage) {
            let _pod_image = new File([podImage], `pod_${pod.name}.jpg`, {type: podImage.type})
            await upload(_pod_image, {
                doctype: 'Proof Of Delivery',
                docname: selected,
                fieldname: `pod_image`,
                folder: 'Home/POD Image',
                isPrivate: true
            })
        }
        if (paymentImage) {
            let _payment_image = new File([paymentImage], `payment_${pod.name}.jpg`, {type: paymentImage.type})
            await upload(_payment_image, {
                doctype: 'Proof Of Delivery',
                docname: pod.name,
                fieldname: `payment_image`,
                folder: 'Home/Payment Image',
                isPrivate: true
            })
        }
        if (billImage) {
            let _bill_image = new File([billImage], `bill_${pod.name}.jpg`, {type: billImage.type})
            await upload(_bill_image, {
                doctype: 'Proof Of Delivery',
                docname: pod.name,
                fieldname: `bill_image`,
                folder: 'Home/Bill Image',
                isPrivate: true
            })
        }
        toast.success('บันทึกข้อมูลเรียบร้อย')
        mutateProofOfDelivery()
            }catch(e){
                toast.error('มีข้อผิดพลาด')
            }finally{
                setIsUploading(false)
            }
        }
        )
    }

    useEffect(() => {
        // debounce
        const timeout = setTimeout(() => {
            mutate()
        }, 100)
        return () => {
            clearTimeout(timeout)
        }
    },[search])

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.permissions
            .query({ name: "geolocation" })
            .then(function (result) {
                console.log(result);
                handleLocation()
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
        }, []);

    useEffect(() => {
        setMounted(true)
    }, [])

    if(!mounted){
        return <div>Loading...</div>
    }

    if(!currentUser){
        return <div className='flex flex-col gap-4 h-full p-12'>
            <Button onClick={() => {
                window.location.href = '/login'
            }}>เข้าสู่ระบบ</Button>
            <p className='text-center'>เมื่อคุณเข้าสู่ระบบแล้ว ปิดหน้าต่างและเขาใหม่</p>
        </div>
    }

    return (
        <div className='flex flex-col gap-4'>
        <h1 className='text-2xl font-bold'>POD</h1>
        <div className='flex gap-4 justify-between'>
        <p>
            สวัสดี, {currentUser}
        </p>
        <Button onClick={logout}>ออกจากระบบ</Button>
        </div>
        
        {
            !isUploading ? (
                <SearchBar results={delivery_orders} search={search} setSearch={setSearch} value={selected} onChange={handleChange} />
            ):(
                <p>กำลังโหลด...</p>
            )
        }
        <div>
            <div>
            {
                recipient ? (
                    <Table>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">ผู้รับ</TableCell>
      <TableCell className='justify-start'>{recipient?.name || ''}</TableCell>
    </TableRow>
    <TableRow>
      <TableCell className="font-medium">ที่อยู่</TableCell>
      <TableCell className='justify-start'>{recipient?.in_line_address || ''}</TableCell>
    </TableRow>
    {/* <TableRow>
      <TableCell className="font-medium">จำนวนเงิน</TableCell>
      <TableCell>{delivery_order?.grand_total}</TableCell>
    </TableRow> */}
    <TableRow>
      <TableCell className="font-medium">เบอร์โทร</TableCell>
      <TableCell className='justify-start'>{recipient?.phone || ''}</TableCell>
    </TableRow>
    <TableRow>
      <TableCell className="font-medium">เก็บเงิน</TableCell>
      <TableCell>{delivery_order?.cash_on || ''}</TableCell>
    </TableRow>
    <TableRow>
      <TableCell className="font-medium">ตำแหน่ง</TableCell>
      <TableCell>
        <div className='flex flex-col gap-1'>
        <div className='flex gap-2 items-center justify-between'>
        <div className='flex flex-col'>
            <p>{`${recipient.latitude}`}</p>
            <p>{`${recipient.longitude}`}</p>
        </div>
        <div className='flex gap-4 justify-end'>
            <Button
            disabled={!recipient?.latitude || !recipient?.longitude}
            variant='outline'
            size='sm'
                onClick={function () {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${recipient.latitude},${recipient.longitude}`);
                }}
            >
                แผนที่
            </Button>
            <Button
            disabled={isUploading}
            variant='outline'
            size='sm'
                onClick={handleUpdateLocation}
            >
                อัพเดทตำแหน่ง
            </Button>
        </div>
        </div>
        {
            !!recipient?.last_update_location_by && !!recipient?.last_update_location_date && (
                <p className='text-xs. text-zinc-500'>{`${recipient?.last_update_location_by} ${formatDistance(Date.now(), new Date(recipient?.last_update_location_date))}`}</p>
            )
        }
        <p className='text-xs text-red-500'>*ระวังหมุดไม่ตรง</p>
        </div>
      </TableCell>
      </TableRow>
  </TableBody>
</Table>
                ):(
                    <p>กรุณาเลือกใบส่งของ</p>
                )
            }
            </div>
        </div>
        {
            !proof_of_delivery ? (
                <div>
                    {selected && <h1 className='text-xl font-bold'>หลักฐานการส่ง</h1>}
        <Separator/>
        {
            selected && (
                <div className='flex flex-col gap-4 p-4'>
                    <div className='flex flex-wrap gap-4 justify-evenly'>
                        <Label>
                            รูปการส่ง
                            {podImage && <img src={podImage ? URL.createObjectURL(podImage) : ''} alt="pod" />}
                            <Input type="file" onChange={(e) => setPodImageet(e.target.files![0])} accept='image/*' />
                        </Label>
                        <Label>
                            รูปบิล
                            {billImage && <img src={billImage ? URL.createObjectURL(billImage) : ''} alt="bill" />}
                            <Input type="file" onChange={(e) => setPaymentImageet(e.target.files![0])} accept='image/*' />
                        </Label>
                        <Label>
                            รูปหลักฐานการจ่ายเงิน
                            {paymentImage && <img src={paymentImage ? URL.createObjectURL(paymentImage) : ''} alt="payment" />}
                            <Input type="file" onChange={(e) => setPaymentImageet(e.target.files![0])} accept='image/*' />
                        </Label>
                    </div>
                    <Separator/>
                    <div className='flex gap-4 w-full justify-end mt-4'>
                    <Button 
                        variant='secondary'
                        disabled={isUploading}
                        onClick={() => {
                            const res = confirm('คุณต้องการล้างข้อมูลทั้งหมดหรือไม่')
                            if (res) {
                                restart()
                            }
                        }}>ล้าง</Button>
                    <Button 
                        disabled={isUploading}
                        onClick={async() => {
                            const res = confirm(`ส่งของให้ ${recipient?.name} แล้วหรือไม่`)
                            if (res) {
                                await handleSubmit()
                            }
                    }}>
                        {
                            isUploading ? 'กำลังส่ง...' : 'ส่ง'
                        }
                    </Button>
                    </div>
                </div>
            )
        }
                </div>
            ):(
                <div>
                    <div className='flex gap-4 mb-2 items-center'>
                        <CheckCircleIcon size={24} color='green' />
                    <h1 className='text-xl font-bold text-green-500'>ส่งแล้ว</h1>
                    </div>
                    <Separator/>
                    <div className='flex flex-col gap-4 p-4'>
                        <Label>
                            รูปการส่ง
                            <img src={`${window.location.origin}/private/files/pod_${delivery_order?.name}.jpg`} alt="pod" />
                        </Label>
                        <Label>
                            รูปบิล
                            <img src={`${window.location.origin}/private/files/bill_${delivery_order?.name}.jpg`} alt="bill" />
                        </Label>
                        <Label>
                            รูปหลักฐานการจ่ายเงิน
                            <img src={`${window.location.origin}/private/files/payment_${delivery_order?.name}.jpg`} alt="payment" />
                        </Label>
                    </div>
                </div>
            )
        }
        <div className='flex gap-2 fixed bottom-0 left-0 w-full p-4 bg-white border items-end'>
            <p>ตำแหน่งของคุณ: {location[0]} {location[1]}</p>
        </div>
        </div>
    );
}