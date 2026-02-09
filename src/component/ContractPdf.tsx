import { forwardRef } from 'react'

const ContractPdf = forwardRef(({ contract }: any, ref: any) => {
  // แก้ไข: กัน Error กรณีไม่มีข้อมูล
  if (!contract) return null;

  const { customer, room } = contract

  return (
    <div ref={ref} className="p-16 text-[16px] leading-8 bg-white text-black min-h-screen">
      <h1 className="text-center text-2xl font-bold mb-10">
        สัญญาเช่าห้องพัก
      </h1>

      <div className="space-y-4">
        <p className="text-right">เขียนที่....................................................</p>
        <p>
          สัญญาฉบับนี้ทำขึ้นเมื่อวันที่ <b>{new Date(contract.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</b>
        </p>

        <p className="indent-12">
          ข้าพเจ้า <b>{customer.fullName}</b> ถือบัตรประชาชนเลขที่ <b>{customer.citizenId}</b> 
          อาศัยอยู่บ้านเลขที่ <b>{customer.address}</b> ต่อไปในสัญญานี้เรียกว่า "ผู้เช่า"
        </p>

        <p className="indent-12">
          ผู้เช่าได้ตกลงเช่าห้องพักเลขที่ <b>{room.roomNumber}</b> ชั้น <b>{room.floor}</b> 
          โดยมีกำหนดระยะเวลาเช่าเริ่มตั้งแต่วันที่ {new Date(contract.startDate).toLocaleDateString('th-TH')} 
          ถึงวันที่ {new Date(contract.endDate).toLocaleDateString('th-TH')}
        </p>

        <p className="indent-12">
          ตกลงชำระค่าเช่าในอัตราเดือนละ <b>{contract.monthlyRentRate?.toLocaleString()}</b> บาท 
          โดยได้วางเงินมัดจำไว้เป็นจำนวน <b>{contract.depositAmount?.toLocaleString()}</b> บาท 
          และค่าเช่าล่วงหน้า <b>{contract.advancePayment?.toLocaleString()}</b> บาท
        </p>
      </div>

      <div className="mt-24 flex justify-around">
        <div className="text-center">
          ลงชื่อ ........................................<br />
          (........................................)<br />
          ผู้ให้เช่า
        </div>
        <div className="text-center">
          ลงชื่อ ........................................<br />
          (<b>{customer.fullName}</b>)<br />
          ผู้เช่า
        </div>
      </div>
    </div>
  )
})

ContractPdf.displayName = 'ContractPdf'

export default ContractPdf