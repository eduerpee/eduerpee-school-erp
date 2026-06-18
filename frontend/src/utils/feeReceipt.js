export function buildReceiptHTML(student, collectedItems, paymentMode, receiptNo, remarks) {
  const school  = (() => { try { return JSON.parse(localStorage.getItem('school_settings'))||{}; } catch { return {}; } })();
  const total   = collectedItems.reduce((s,i) => s + i.amount, 0);
  const today   = new Date();
  const dateStr = today.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const numToWords = n => {
    const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if(n===0)return'Zero';if(n<20)return a[n];if(n<100)return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');
    if(n<1000)return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+numToWords(n%100):'');
    if(n<100000)return numToWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+numToWords(n%1000):'');
    return numToWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+numToWords(n%100000):'');
  };
  const rows = collectedItems.map((item,i)=>
    `<tr><td class="c">${i+1}</td><td>${item.name}</td><td class="r">₹${Number(item.amount).toLocaleString('en-IN')}</td></tr>`
  ).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Fee Receipt</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;font-size:11px;background:#fff;}
.page{width:180mm;margin:0 auto;border:1.5px solid #000;}
.hdr{text-align:center;padding:6px 10px;border-bottom:1px solid #000;}
.hdr .sn{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:.03em;}
.hdr .si{font-size:9px;color:#444;margin-top:2px;}
.hdr .ti{font-size:10px;font-weight:700;background:#f0f0f0;display:inline-block;padding:1px 8px;margin-top:3px;border:1px solid #ccc;}
.stu{display:grid;grid-template-columns:1fr 1fr auto;border-bottom:1px solid #000;}
.sl{padding:6px 8px;border-right:1px solid #000;font-size:10px;}
.sr{padding:6px 8px;border-right:1px solid #000;font-size:10px;}
.sp{width:60px;height:66px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f5f5f5;}
.row{display:flex;margin-bottom:2px;}.lbl{font-weight:700;width:48px;flex-shrink:0;}
table{width:100%;border-collapse:collapse;font-size:10px;}
th{border:1px solid #000;padding:3px 6px;background:#f0f0f0;font-size:9px;text-transform:uppercase;}
td{border:1px solid #000;padding:3px 6px;}
td.c{text-align:center;width:28px;}td.r{text-align:right;width:80px;font-weight:600;}
.foot{display:grid;grid-template-columns:1fr 1fr;border-top:1.5px solid #000;}
.fl{padding:6px 8px;border-right:1px solid #000;font-size:10px;}
.fr{padding:6px 8px;font-size:10px;}
.al{display:flex;justify-content:space-between;margin-bottom:2px;}
.al.tot{font-weight:800;font-size:12px;border-top:1px solid #000;padding-top:3px;margin-top:3px;}
.sig{display:flex;justify-content:space-between;padding:6px 10px;border-top:1px solid #000;font-size:10px;}
@media print{@page{size:A5 landscape;margin:3mm;}body{margin:0;}}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="si">${school.affiliation?'Affiliation No. '+school.affiliation+' &nbsp;|&nbsp; ':''}</div>
    <div class="sn">${school.schoolName||'School Name'}</div>
    <div class="si">${[school.address,school.city,school.phone].filter(Boolean).join(' | ')}</div>
    <div class="ti">Fee Receipt</div>
  </div>
  <div class="stu">
    <div class="sl">
      <div class="row"><span class="lbl">Adm.No</span><span>: ${student.admission_no||'—'}</span></div>
      <div class="row"><span class="lbl">Date</span><span>: ${dateStr}</span></div>
      <div class="row"><span class="lbl">Receipt</span><span>: ${receiptNo}</span></div>
      <div class="row"><span class="lbl">Class</span><span>: ${student.class_name||'—'} ${student.section_name||''}</span></div>
      <div class="row"><span class="lbl">Session</span><span>: ${today.getFullYear()}-${String(today.getFullYear()+1).slice(-2)}</span></div>
    </div>
    <div class="sr">
      <div class="row"><span class="lbl">Name</span><span>: <strong>${student.first_name} ${student.last_name||''}</strong></span></div>
      <div class="row"><span class="lbl">Father</span><span>: ${student.parent_name||'—'}</span></div>
      <div class="row"><span class="lbl">Mobile</span><span>: ${student.parent_phone||'—'}</span></div>
      <div class="row" style="margin-top:4px"><span class="lbl">Month</span><span>: <strong>${today.toLocaleString('en-IN',{month:'long'})} ${today.getFullYear()}</strong></span></div>
    </div>
    <div class="sp">${student.photo_url?`<img src="${student.photo_url}" style="width:100%;height:100%;object-fit:cover"/>`:'<span style="font-size:24px;color:#ccc">👤</span>'}</div>
  </div>
  <table><thead><tr><th style="width:28px">Sr.</th><th>Particulars</th><th style="width:80px;text-align:right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="foot">
    <div class="fl">
      <div style="margin-bottom:3px"><strong>Mode : </strong>${paymentMode.replace(/_/g,' ').toUpperCase()}</div>
      <div style="margin-bottom:3px"><strong>Paid : </strong>₹${Number(total).toLocaleString('en-IN')}</div>
      <div>(${numToWords(Math.round(total))} Only)</div>
      ${remarks?`<div style="margin-top:3px;font-size:9px;color:#555">Remarks: ${remarks}</div>`:''}
    </div>
    <div class="fr">
      <div class="al"><span>Total Fee</span><span>₹${Number(total).toLocaleString('en-IN')}</span></div>
      <div class="al"><span>- Concession</span><span>0</span></div>
      <div class="al tot"><span>Amount Received</span><span>₹${Number(total).toLocaleString('en-IN')}</span></div>
      <div class="al"><span>Balance</span><span>0</span></div>
    </div>
  </div>
  <div class="sig"><span>Received By : ................................</span><span>School Seal &amp; Signature</span></div>
</div>
</body></html>`;
}

export function printFeeReceipt(student, collectedItems, paymentMode, receiptNo, remarks) {
  const html = buildReceiptHTML(student, collectedItems, paymentMode, receiptNo, remarks);
  const win = window.open('','_blank','width=750,height=550');
  win.document.write(html);
  win.document.close();
  setTimeout(() => { try { win.print(); } catch(e){} }, 600);
}

export function sendWhatsApp(student, collectedItems, paymentMode, receiptNo) {
  const total  = collectedItems.reduce((s,i) => s + i.amount, 0);
  const items  = collectedItems.map(i => `• ${i.name}: ₹${Number(i.amount).toLocaleString('en-IN')}`).join('\n');
  const today  = new Date().toLocaleDateString('en-IN');
  const school = (() => { try { return JSON.parse(localStorage.getItem('school_settings'))||{}; } catch { return {}; } })();
  const msg = `🏫 *${school.schoolName||'School'}*\n\n📄 *Fee Receipt*\nReceipt No: ${receiptNo}\nDate: ${today}\n\n👤 *${student.first_name} ${student.last_name||''}*\nAdm. No: ${student.admission_no}\nClass: ${student.class_name||'—'}\n\n💰 *Payment Details*\n${items}\n\n*Total Paid: ₹${Number(total).toLocaleString('en-IN')}*\nMode: ${paymentMode.replace(/_/g,' ').toUpperCase()}\n\nThank you! 🙏`;
  const phone = (student.parent_phone||'').replace(/\D/g,'');
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}
