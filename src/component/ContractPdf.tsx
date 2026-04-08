import { forwardRef } from "react";

// Component ย่อยสำหรับสร้างเส้นประเติมคำ
const Blank = ({ value, width = "w-32" }: any) => (
  <span
    className={`inline-block border-b border-dotted border-black text-center px-1 ${width}`}
  >
    {value || "\u00A0"}
  </span>
);

const ContractPdf = forwardRef(({ contract }: any, ref: any) => {
  if (!contract) return null;

  const { customer, room } = contract;
  const dateObj = new Date(contract.startDate);
  const pageClass = "min-h-[257mm] break-after-page";
  const lastPageClass = "min-h-[257mm]";
  const bodyTextClass = "space-y-2 text-justify";

  return (
    <div
      ref={ref}
      className="p-[20mm] text-[16px] leading-[1.85] bg-white text-black min-h-screen max-w-[210mm] mx-auto"
      style={{
        fontFamily:
          "'TH SarabunPSK', 'TH Sarabun New', 'Sarabun', 'Times New Roman', serif",
      }}
    >
      {/* --- PAGE 1 --- */}
      <section className={pageClass}>
        <div className="relative mb-6">
          {/* ส่วนกลาง: สัญญาเช่า (วางไว้กึ่งกลางเป๊ะของหน้ากระดาษ) */}
          <h1 className="text-2xl font-bold text-center">สัญญาเช่า</h1>

          {/* ส่วนขวา: เลขที่ห้อง (ใช้ absolute เพื่อไม่ให้รบกวนการจัดกลางของหัวข้อ) */}
          <div className="absolute right-0 top-1 text-[16px]">
            เลขที่ห้อง <Blank value={room.roomNumber} width="w-24" />
          </div>
        </div>

        <div className="text-right mb-6">
          วันที่
          <Blank value={dateObj.getDate()} width="w-12" />
          เดือน
          <Blank
            value={dateObj.toLocaleDateString("th-TH", { month: "long" })}
            width="w-24"
          />
          พ.ศ.
          <Blank value={dateObj.getFullYear() + 543} width="w-16" />
        </div>

        <div className={bodyTextClass}>
          <p className="indent-[3em]">
            สัญญาเช่าทำขึ้นระหว่าง ซิตี้ฮิลล์อพาร์ทเม้นท์
            ซึ่งต่อไปนี้ในสัญญาจะเรียกว่า “ผู้ให้เช่า” ฝ่ายหนึ่งกับ
            <Blank value={customer.fullName} width="w-56" /> อายุ
            <Blank value={customer.age} width="w-12" />
            ปี อาชีพ
            <Blank value={customer.occupation} width="w-32" />
          </p>
          <p>
            อยู่บ้านเลขที่ <Blank value={customer.address} width="w-40" /> ซอย
            <Blank value="" width="w-32" />
            ตำบล
            <Blank value="หาดใหญ่" width="w-32" />
          </p>
          <p>
            อำเภอ
            <Blank value="หาดใหญ่" width="w-32" /> จังหวัด
            <Blank value="สงขลา" width="w-32" />
            โทรศัพท์
            <Blank value={customer.phone} width="w-40" /> ซึ่งต่อไปนี้เรียกว่า “
            ผู้เช่า”
          </p>
          <p>
            บัตรประจำตัวประชาชนเลขที่
            <Blank value={customer.citizenId} width="w-64" />
            อีกฝ่ายหนึ่ง ทั้งสองฝ่ายตกลงทำสัญญากัน ดังมีข้อความดังต่อไปนี้
          </p>

          <p className="pt-2">
            <b>ข้อ1.</b> ผู้ให้เช่าตกลงให้เช่าและผู้เช่าตกลงเช่า ทรัพย์สิน
            โดยมีวัตถุประสงค์ กำหนดระยะเวลาการเช่า อัตราค่าเช่า
            และเงินประกันความเสียหายดังต่อไปนี้
          </p>

          <div className="pl-6 space-y-2">
            <p>
              1.1 ทรัพย์สินที่เช่า ห้องพักเลขที่
              <Blank value={room.roomNumber} width="w-16" />
              ชั้นที่
              <Blank value={room.floor} width="w-16" />
              ในอาคารซิตี้ฮิลล์อพาร์ทเม้นท์ ซึ่งตั้งอยู่ เลขที่ 300
              ถนนประชายินดี ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา 90110
              พร้อมด้วยอุปกรณ์และเฟอร์นิเจอร์ ดังปรากฏรายละเอียดแนบท้ายสัญญานี้
            </p>
            <p>
              1.2 วัตถุประสงค์ของทรัพย์สินที่เช่า เพื่อใช้เป็นที่อยู่อาศัย
              โดยไม่ใช้ทรัพย์สินดังกล่าวไปในทางต้องห้ามทางกฎหมาย
              หรือนำไปให้เช่าช่วงหรือการกระทำอย่างอื่นที่มิใช่เพื่ออยู่อาศัย
              และผู้เช่าสัญญาว่าจะปฏิบัติตามกฎระเบียบ
              ข้อบังคับหรือเงื่อนไขที่ผู้ให้เช่าได้กำหนดไว้อย่างเคร่งครัด
              ตลอดระยะเวลาการเช่า
            </p>
            <p>
              1.3 กำหนดระยะเวลาการเช่า มีกำหนดการเช่าอย่างน้อย 3 เดือน
              นับตั้งแต่ วันที่
              <Blank value={dateObj.getDate()} width="w-12" />
              เดือน
              <Blank
                value={dateObj.toLocaleDateString("th-TH", { month: "long" })}
                width="w-24"
              />
              พ.ศ.
              <Blank value={dateObj.getFullYear() + 543} width="w-16" />
            </p>
            <p>
              1.4 อัตราค่าเช่าเดือนละ
              <Blank
                value={contract.monthlyRentRate?.toLocaleString()}
                width="w-24"
              />
              บาท โดยผู้เช่าจะนำไปชำระให้แก่ผู้ให้เช่าล่วงหน้า ภายในวันที่ 5
              ของทุกเดือน
            </p>
            <p>
              1.5 ค่าน้ำประปา ค่าไฟ หรือค่าบริการอื่นๆ
              ผู้เช่าต้องไปชำระให้แก่ผู้ให้เช่า ณ.
              สำนักงานของผู้ให้เช่าภายในวันที่ 5
              ของเดือนที่ถึงกำหนดชำระค่าเช่าแต่ละเดือน
            </p>
          </div>
        </div>
      </section>

      {/* --- PAGE 2 --- */}
      <section className={`${pageClass} mt-18`}>
        <div className={bodyTextClass}>
          <p>
            1.6 เงินประกันความเสียหาย การเช่า เป็นจำนวนเงิน
            <Blank
              value={contract.depositAmount?.toLocaleString()}
              width="w-24"
            />
            ผู้เช่าจะต้องชำระเงินค่าประกันความเสียหายให้แก่ผู้ให้เช่า
            ยึดถือไว้ตลอดระยะเวลา โดยชำระในวันที่ทำสัญญานี้
            และผู้ให้เช่าจะจ่ายคืนเมื่อสิ้นสุดการให้เช่า
            หากผู้เช่าทำให้เกิดความเสียหายอย่างใดอย่างหนึ่งแก่ทรัพย์สินและอุปกรณ์เฟอร์นิเจอร์
            ผู้ให้เช่าจะคิดค่าเสียหายเอาจากเงินประกันความเสียหายนั้นได้
            และเงินประกันความเสียหายที่ผู้เช่าให้ไว้กับผู้ให้เช่าไม่
          </p>
          <p>
            เพียงพอกับความเสียหายที่ผู้เช่าได้กระทำขึ้น
            ผู้ให้เช่ามีสิทธิ์จะเรียกร้องเอาจากผู้เช่าพร้อมกับดอกเบี้ยได้ตามกฎหมาย
          </p>
          <p>
            <b>ข้อ2.</b> ในกรณีผู้เช่าผิดนัดชำระเงินค่าเช่า
            ผู้เช่าต้องเสียค่าปรับให้แก่ผู้ให้เช่าวันละ 200 บาท
            จนกว่าผู้เช่าจะนำเงินค่าเช่า ของเดือนนั้นมาชำระ
          </p>
          <p>
            <b>ข้อ3.</b> หากผู้เช่าต้องการบอกเลิกสัญญาเช่า
            ผู้เช่าต้องแจ้งให้ผู้ให้เช่าทราบล่วงหน้าอย่างน้อย 1 เดือน
            ก่อนถึงกำหนดค่าเช่าเดือนถัดไป มิฉะนั้นจะถือว่า
            ผู้เช่ามีความประสงค์จะเช่าอีก 1 เดือน ของเดือนถัดไป
          </p>
          <p>
            <b>ข้อ4.</b> ต้องใช้และสงวนทรัพย์ที่เช่าอย่างวิญญูชน
            หากมีสิ่งใดชำรุดเสียหาย ผู้เช่าต้องแจ้งให้ผู้ให้เช่าทราบทันที
            หากความเสียหายเกิดขึ้นจากผู้เช่า
            ผู้เช่าต้องเป็นผู้รับผิดชอบในความชำรุดเสียหายนั้น
          </p>
          <p>
            <b>ข้อ5.</b> เมื่อสัญญาเช่าระงับไม่ว่าด้วยเหตุใดๆ
            ผู้เช่ามีหน้าที่ส่งมอบทรัพย์สินที่เช่าคืนในสภาพเหมือนเดิมในทันที
            หากผู้เช่าไม่ส่งมอบทรัพย์สินที่เช่าคืนทันทีผู้เช่ายินยอมเสียค่าเช่าคิดเป็นรายวันให้แก่ผู้ให้เช่าวันละ
            200 บาท นับตั้งแต่สัญญาเช่าระงับเป็นต้นไป
          </p>
          <p>
            <b>ข้อ6.</b> ในกรณีที่มีการขนย้ายทรัพย์สิน
            ไม่ว่าจะย้ายเข้าหรือย้ายออกให้ขนย้ายได้เฉพาะในเวลากลางวันเท่านั้น
            เว้นแต่จะได้รับความยินยอมจากผู้ให้เช่าเป็นลายลักษณ์อักษร
          </p>
          <p>
            <b>ข้อ7.</b> ห้ามมิให้ผู้เช่าตอกตะปู
            หรือกระทำการใดในลักษณะเดียวกันลงบนฝาผนัง
            การดัดแปลงต่อเติมห้องที่เช่า
            เว้นแต่จะได้รับความยินยอมจากผู้ให้เช่าเป็นลายลักษณ์อักษร
          </p>
          <p>
            <b>ข้อ8.</b> ห้ามมิให้ผู้เช่าเก็บอาวุธ หรือวัตถุระเบิด วัตถุไวไฟ
            เคมีภัณฑ์ร้ายแรงและสิ่งของที่ผิดกฎหมาย ภายในห้องเช่า
          </p>
          <p>
            <b>ข้อ9.</b> ห้ามมิให้ผู้เช่านำเข้ามา ซื้อ ขาย แลกเปลี่ยน
            มีไว้ในความครอบครองหรือเสพ ซึ่งสิ่งเสพติดให้โทษอันผิดกฎหมายในบริเวณ
            ซิตี้ฮิลล์ อพาร์ทเม้นท์
          </p>
          <p>
            <b>ข้อ10.</b> ห้ามมิให้ผู้เช่านำสัตว์เลี้ยงเข้ามาในห้องเช่า
          </p>
        </div>
      </section>

      {/* --- PAGE 3 --- */}
      <section className={pageClass}>
        <div className="space-y-6 mt-18">
          <p>
            <b>ข้อ11.</b> ผู้เช่าจะต้องไม่ทำหรือทำการใดๆ
            ในสถานที่เช่าอันจะเป็นการก่อให้เกิดอันตราย
            หรือความเดือนร้อนรำคาญแก่บุคคลอื่นหรือเป็นการฝ่าฝืนบทบัญญัติแห่งกฎหมายว่าด้วยความสงบเรียบร้อยหรือศีลธรรมอันดีของประชาชน
            หรือขัดต่อข้อกำหนดของผู้ให้เช่า
            ถ้าผู้เช่าผิดสัญญาข้อหนึ่งข้อใดผู้ให้เช่ามีสิทธิบอกเลิกสัญญาเช่าได้ทันทีโดยไม่ต้องตักเตือนหรือบอกกล่าวให้ปฏิบัติตามสัญญาก่อน
          </p>
          <p className="indent-[3em] text-justify">
            สัญญานี้ทำขึ้นไว้ 2 ฉบับ มีข้อความตรงกัน
            คู่สัญญาได้อ่านจนเป็นที่เข้าใจแล้วเห็นว่าถูกต้องตามวัตถุประสงค์
            ในสัญญานี้ จึงลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน
          </p>

          <div className="mt-16 space-y-16">
            <div className="grid grid-cols-2 gap-y-12">
              <div className="text-center">
                ลงชื่อ
                <Blank width="w-48" />
                ผู้เช่า
                <br />(<Blank value={customer.fullName} width="w-48" />)
              </div>
              <div className="text-center">
                ลงชื่อ
                <Blank width="w-48" />
                ผู้ให้เช่า
                <br />(<Blank width="w-48" />)
              </div>
              <div className="text-center">
                ลงชื่อ
                <Blank width="w-48" />
                พยาน
                <br />(<Blank width="w-48" />)
              </div>
              <div className="text-center">
                ลงชื่อ
                <Blank width="w-48" />
                พยาน
                <br />(<Blank width="w-48" />)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PAGE 4 --- */}
      <section className={pageClass}>
        <div className="mt-18">
          <h2 className="font-bold underline text-lg mb-4">ต่อท้ายสัญญาเช่า</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">ก.รายละเอียดอุปกรณ์และเฟอร์นิเจอร์</h3>
              <ul className="list-none pl-4 space-y-1">
                <li>✓ เครื่องปรับอากาศ</li>
                <li>✓ ตู้เก็บเสื้อผ้าพร้อมหิ้ง</li>
                <li>✓  ชุดโต๊ะเครื่องแป้ง</li>
                <li>✓  ชุดรับแขก</li>
                <li>✓ ชุดเตียงนอนพร้อมที่นอน</li>
                <li>✓ อ่างล้างถ้วยชามพร้อมสุขภัณฑ์</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">ข.อัตราค่าสาธารณูปโภค</h3>
              <ul className="list-none pl-4 space-y-1">
                <li>{">"} ค่าไฟฟ้าหน่วยละ 6 บาท</li>
                <li>{">"} ค่าน้ำ 100/คน/เดือน</li>
                <li>{">"} ค่าอินเตอร์เน็ต 300 บาท (ชำระแรกเข้า)</li>
                <li>{">"} ค่าเคเบิลทีวี 200 บาท (ชำระแรกเข้า)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">
                ค.เมื่อผู้เช่าย้ายออกมีค่าใช่จ่ายดังนี้
              </h3>
              <ul className="list-none pl-4 space-y-1">
                <li>
                  • ค่าทำความสะอาดห้องพัก <span className="ml-8">300 บาท</span>
                </li>
                <li>
                  • ค่าซักผ้ารองเปื้อน <span className="ml-12">200 บาท</span>
                </li>
                <li>
                  • ค่าซักผ้าม่าน <span className="ml-16">200 บาท</span>
                </li>
              </ul>
            </div>
            <div className="mt-12 text-center w-1/2 ml-auto">
              <p>
                ลงชื่อ
                <Blank width="w-40" />
              </p>
              <p className="mt-2">ผู้เช่า</p>
            </div>
            <div className="pt-6">
              <h3 className="font-bold underline mb-2">หมายเหตุ</h3>
              <p>
                รถยนต์ยี่ห้อ
                <Blank width="w-40" />
                หมายเลขทะเบียน
                <Blank width="w-32" />
              </p>
              <p className="mt-2">
                รถจักรยานยนต์ยี่ห้อ
                <Blank width="w-32" />
                หมายเลขทะเบียน
                <Blank width="w-32" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PAGE 5 --- */}
      <section className={lastPageClass}>
        <div className="mt-18">
          <h2 className="font-bold text-center text-lg mb-6">
            รายการค่าเสียหายอุปกรณ์ภายในห้อง
          </h2>

          <table className="w-full max-w-2xl mx-auto border-collapse">
            <tbody>
              {[
                ["กุญแจลูกบิดคิดเป็นชุด", "400 บาท"],
                ["รอยตะปู", "100 บาท"],
                ["ติดกาวสองหน้า", "100 บาท"],
                ["กระจกเครื่องแป้ง", "300 บาท"],
                ["กระจกส่องหน้าในห้องน้ำ", "300 บาท"],
                ["ที่นอน", "3,600 บาท"],
                ["เก้าอี้ชำรุดเสียหาย", "500 บาท"],
                ["เครื่องสุขภัณฑ์ ชักโครก", "1,300 บาท"],
                ["ฝักบัว", "300 บาท"],
                ["ราวพาดผ้าในห้องน้ำ", "200 บาท"],
                ["ประตูมุ้งลวด", "1,000 บาท"],
                ["ประตูกระจกบานเลื่อน", "3,000 บาท"],
                ["ชุดหลอดไฟสั้น", "110 บาท"],
                ["ชุดหลอดไฟยาว", "140 บาท"],
              ].map(([item, price], index) => (
                <tr key={index}>
                  <td className="py-2 pr-4">{item}</td>
                  <td className="py-2 pl-4 text-right">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
});

ContractPdf.displayName = "ContractPdf";
export default ContractPdf;
