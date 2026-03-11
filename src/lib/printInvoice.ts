export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export interface Invoice {
  id: string;
  contractId: number;
  roomNumber: string;
  customerName: string;
  month: number;
  year: number;
  rent: number;
  electricityUnits: number;
  electricityAmount: number;
  waterUnits: number;
  waterAmount: number;
  otherAmount: number;
  otherItems?: { name: string; amount: number }[];
  total: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
}

const thaiOnes = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];

function toThaiWords(n: number): string {
  if (n === 0) return '';
  if (n >= 1000000) return toThaiWords(Math.floor(n / 1000000)) + 'ล้าน' + toThaiWords(n % 1000000);
  let result = '';
  let rem = n;
  const bigUnits: [number, string][] = [[100000, 'แสน'], [10000, 'หมื่น'], [1000, 'พัน'], [100, 'ร้อย']];
  for (const [val, name] of bigUnits) {
    if (rem >= val) { result += thaiOnes[Math.floor(rem / val)] + name; rem %= val; }
  }
  let hadTens = false;
  if (rem >= 10) {
    const d = Math.floor(rem / 10);
    result += d === 2 ? 'ยี่สิบ' : d === 1 ? 'สิบ' : thaiOnes[d] + 'สิบ';
    rem %= 10; hadTens = true;
  }
  if (rem > 0) result += (hadTens && rem === 1) ? 'เอ็ด' : thaiOnes[rem];
  return result;
}

function buildInvoicePage(inv: Invoice): string {
  const fmtNum = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const intPart = Math.floor(inv.total);
  const decPart = Math.round((inv.total - intPart) * 100);
  const totalWords =
    (intPart === 0 ? 'ศูนย์' : toThaiWords(intPart)) + 'บาท' +
    (decPart > 0 ? toThaiWords(decPart) + 'สตางค์' : 'ถ้วน');

  const dateStr = new Date(inv.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  let otherRows = '';
  if (inv.otherItems && inv.otherItems.length > 0) {
    otherRows = inv.otherItems
      .map((item) => `<div class="item-row"><span class="item-label">${item.name}</span><span class="item-line"></span><span class="item-amount">${fmtNum(item.amount)}</span><span class="item-unit">บาท</span></div>`)
      .join('');
  } else {
    otherRows = `<div class="item-row"><span class="item-label"></span><span class="item-line"></span><span class="item-amount"></span><span class="item-unit">บาท</span></div>`;
  }

  return `
<div class="page">
  <div class="title-main">CITYHILL APARTMENT</div>
  <div class="title-sub">ใบแจ้งหนี้</div>

  <div class="top-right">
    <div class="top-right-block">
      หมายเลขห้อง&nbsp;<span class="uline">&nbsp;${inv.roomNumber}&nbsp;</span><br/>
      วันที่&nbsp;<span class="uline">&nbsp;${dateStr}&nbsp;</span>
    </div>
  </div>

  <div class="customer-row">
    นาย,นาง,นางสาว&nbsp;<span class="uline">&nbsp;${inv.customerName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
  </div>

  <div class="section-header">รายการประจำเดือน ${THAI_MONTHS[inv.month]} ${inv.year}</div>

  <div class="item-row">
    <span class="item-label">ค่าเช่าห้องรวมเฟอร์นิเจอร์</span>
    <span class="item-line"></span>
    <span class="item-amount">${fmtNum(inv.rent)}</span>
    <span class="item-unit">บาท</span>
  </div>
  <div class="item-row">
    <span class="item-label">ค่าไฟฟ้า&nbsp;(${inv.electricityUnits}&nbsp;หน่วย)</span>
    <span class="item-line"></span>
    <span class="item-amount">${fmtNum(inv.electricityAmount)}</span>
    <span class="item-unit">บาท</span>
  </div>
  <div class="item-row">
    <span class="item-label">ค่าน้ำ&nbsp;(${inv.waterUnits}&nbsp;หน่วย)</span>
    <span class="item-line"></span>
    <span class="item-amount">${fmtNum(inv.waterAmount)}</span>
    <span class="item-unit">บาท</span>
  </div>
  ${otherRows}
  <div class="item-row">
    <span class="item-label"></span>
    <span class="item-line"></span>
    <span class="item-amount"></span>
    <span class="item-unit">บาท</span>
  </div>

  <div class="total-section">
    <span class="total-label">รวม</span>
    <span class="total-line">${fmtNum(inv.total)}</span>
    <span class="total-unit">บาท</span>
  </div>

  <div class="words-row">
    (&nbsp;<span class="words-inner">${totalWords}</span>&nbsp;)
  </div>

  <div class="sig-section">
    <div class="sig-block">
      ลงชื่อ&nbsp;<span class="sig-line"></span><br/>
      <span style="font-size:13px">ผู้แจ้ง</span>
    </div>
  </div>

  <div class="notes">
    <strong>หมายเหตุ</strong>&nbsp;1.กรุณาโอนเงินเข้าบัญชี &ldquo;นายณรงค์ศักย์ เลาหวีรานนท์&rdquo; ธนาคารกรุงเทพ เลขที่บัญชี 420-006181-2<br/>
    &emsp;&emsp;&emsp;&emsp;&emsp;2.แจ้งหลักฐานการโอนเงินผ่าน Line:@ 0630827638<br/>
    &emsp;&emsp;&emsp;&emsp;&emsp;3.ค่าเช่าชำระไม่เกินวันที่ 5 ของเดือน เกินกำหนดคะปรับวันละ 100 บาท
  </div>
</div>`;
}

const printStyles = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Sarabun','TH Sarabun New',Arial,sans-serif;background:#fff;font-size:15px;color:#000}
  .page{width:680px;min-height:960px;margin:20px auto;border:2px solid #000;padding:32px 40px 28px}
  .title-main{text-align:center;font-weight:bold;font-size:17px;letter-spacing:2px;margin-bottom:4px}
  .title-sub{text-align:center;font-size:20px;margin-bottom:18px}
  .top-right{display:flex;justify-content:flex-end;margin-bottom:6px}
  .top-right-block{font-size:14px;line-height:2}
  .uline{display:inline-block;border-bottom:1px solid #000;min-width:130px;text-align:center}
  .customer-row{font-size:14px;margin-bottom:18px}
  .customer-row .uline{min-width:320px}
  .section-header{text-align:center;font-size:15px;font-weight:bold;margin-bottom:14px}
  .item-row{display:flex;align-items:flex-end;margin-bottom:12px;font-size:14px}
  .item-label{min-width:230px;white-space:nowrap}
  .item-line{flex:1;border-bottom:1px solid #000;margin:0 6px 2px}
  .item-amount{min-width:90px;text-align:right;font-size:14px}
  .item-unit{margin-left:4px;white-space:nowrap}
  .total-section{display:flex;justify-content:flex-end;align-items:flex-end;margin:18px 0 10px;font-size:14px;font-weight:bold}
  .total-label{margin-right:8px}
  .total-line{border-bottom:1px solid #000;min-width:120px;text-align:right;padding-bottom:1px}
  .total-unit{margin-left:4px}
  .words-row{text-align:center;font-size:14px;margin:10px 0 24px;line-height:2}
  .words-inner{display:inline-block;border-bottom:1px solid #000;min-width:340px;text-align:center;padding:0 8px}
  .sig-section{display:flex;justify-content:flex-end;font-size:14px;line-height:2.2}
  .sig-block{text-align:center}
  .sig-line{display:inline-block;border-bottom:1px solid #000;min-width:180px}
  .notes{margin-top:24px;font-size:12.5px;line-height:1.9;border-top:1px solid #888;padding-top:10px}
  @media print{body{margin:0}.page{margin:0 auto;border:2px solid #000;page-break-after:always;width:100%}.page:last-child{page-break-after:avoid}}
`;

export function printInvoice(inv: Invoice): void {
  const win = window.open('', '_blank', 'width=860,height=1100');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"/><title>ใบแจ้งหนี้ ห้อง ${inv.roomNumber}</title><style>${printStyles}</style></head>
<body>${buildInvoicePage(inv)}<script>window.onload=function(){window.print();}<\/script></body></html>`);
  win.document.close();
}

export function printAllInvoices(invoices: Invoice[]): void {
  if (invoices.length === 0) return;
  const win = window.open('', '_blank', 'width=860,height=1100');
  if (!win) return;
  const pages = invoices.map(buildInvoicePage).join('');
  win.document.write(`<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"/><title>ใบแจ้งหนี้ทั้งหมด</title><style>${printStyles}</style></head>
<body>${pages}<script>window.onload=function(){window.print();}<\/script></body></html>`);
  win.document.close();
}
