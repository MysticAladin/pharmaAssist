import{b as l}from"./chunk-R4DAHHEE.js";import{O as c,T as p,ba as d}from"./chunk-M6HJP2RW.js";import{a as s}from"./chunk-C6Q5SG76.js";var m=class o{document=p(d);translate=p(l);defaultOptions={paperSize:"A4",orientation:"portrait",showHeader:!0,showFooter:!0,margins:{top:"20mm",right:"15mm",bottom:"20mm",left:"15mm"}};printOrder(i,r){let t=s(s({},this.defaultOptions),r),e=this.generateOrderHTML(i,t);this.print(e,t)}printPrescription(i,r){let t=s(s({},this.defaultOptions),r),e=this.generatePrescriptionHTML(i,t);this.print(e,t)}printCustom(i,r){let t=s(s({},this.defaultOptions),r),e=this.wrapContent(i,t);this.print(e,t)}print(i,r){let t=window.open("","_blank","width=800,height=600");if(!t){console.error("Failed to open print window");return}t.document.write(i),t.document.close(),t.onload=()=>{setTimeout(()=>{t.print()},250)}}generateOrderHTML(i,r){let t=n=>this.translate.instant(n),e=i.items.map(n=>`
      <tr>
        <td>${n.name}<br><small class="sku">${n.sku}</small></td>
        <td class="text-center">${n.quantity}</td>
        <td class="text-right">${this.formatCurrency(n.unitPrice)}</td>
        <td class="text-right">${this.formatCurrency(n.total)}</td>
      </tr>
    `).join(""),a=`
      <div class="document order-document">
        <!-- Header -->
        <div class="document-header">
          <div class="company-info">
            <h1>PharmaAssist</h1>
            <p>${t("branding.tagline")}</p>
          </div>
          <div class="document-info">
            <h2>${t("print.order.title")}</h2>
            <p><strong>${t("print.order.number")}:</strong> ${i.orderNumber}</p>
            <p><strong>${t("print.order.date")}:</strong> ${i.orderDate}</p>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="section customer-section">
          <h3>${t("print.order.billTo")}</h3>
          <p><strong>${i.customer.name}</strong></p>
          ${i.customer.address?`<p>${i.customer.address}</p>`:""}
          ${i.customer.email?`<p>${i.customer.email}</p>`:""}
          ${i.customer.phone?`<p>${i.customer.phone}</p>`:""}
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>${t("print.order.product")}</th>
              <th class="text-center">${t("print.order.quantity")}</th>
              <th class="text-right">${t("print.order.unitPrice")}</th>
              <th class="text-right">${t("print.order.total")}</th>
            </tr>
          </thead>
          <tbody>
            ${e}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="totals-row">
            <span>${t("print.order.subtotal")}</span>
            <span>${this.formatCurrency(i.subtotal)}</span>
          </div>
          ${i.discount?`
          <div class="totals-row discount">
            <span>${t("print.order.discount")}</span>
            <span>-${this.formatCurrency(i.discount)}</span>
          </div>
          `:""}
          <div class="totals-row">
            <span>${t("print.order.tax")}</span>
            <span>${this.formatCurrency(i.taxAmount)}</span>
          </div>
          <div class="totals-row total">
            <span>${t("print.order.grandTotal")}</span>
            <span>${this.formatCurrency(i.total)}</span>
          </div>
        </div>

        <!-- Payment Status -->
        <div class="section status-section">
          <p><strong>${t("print.order.paymentStatus")}:</strong> ${i.paymentStatus}</p>
        </div>

        ${i.notes?`
        <div class="section notes-section">
          <h3>${t("print.order.notes")}</h3>
          <p>${i.notes}</p>
        </div>
        `:""}
      </div>
    `;return this.wrapContent(a,r)}generatePrescriptionHTML(i,r){let t=n=>this.translate.instant(n),e=i.items.map(n=>`
      <tr>
        <td>
          <strong>${n.medication}</strong>
          <br><small>${n.dosage}</small>
        </td>
        <td class="text-center">${n.quantity}</td>
        <td>${n.instructions}</td>
        <td class="text-center">
          ${n.dispensed?"\u2713":""}
        </td>
      </tr>
    `).join(""),a=`
      <div class="document prescription-document">
        <!-- Header -->
        <div class="document-header">
          <div class="company-info">
            <h1>PharmaAssist</h1>
            <p>${t("branding.tagline")}</p>
          </div>
          <div class="document-info">
            <h2>${t("print.prescription.title")}</h2>
            <p><strong>${t("print.prescription.number")}:</strong> ${i.prescriptionNumber}</p>
            <p><strong>${t("print.prescription.date")}:</strong> ${i.date}</p>
            ${i.validUntil?`<p><strong>${t("print.prescription.validUntil")}:</strong> ${i.validUntil}</p>`:""}
          </div>
        </div>

        <!-- Patient & Prescriber Info -->
        <div class="two-column">
          <div class="section">
            <h3>${t("print.prescription.patient")}</h3>
            <p><strong>${i.patient.name}</strong></p>
            ${i.patient.dateOfBirth?`<p>${t("print.prescription.dob")}: ${i.patient.dateOfBirth}</p>`:""}
            ${i.patient.insuranceNumber?`<p>${t("print.prescription.insurance")}: ${i.patient.insuranceNumber}</p>`:""}
          </div>
          <div class="section">
            <h3>${t("print.prescription.prescriber")}</h3>
            <p><strong>${i.prescriber.name}</strong></p>
            ${i.prescriber.license?`<p>${t("print.prescription.license")}: ${i.prescriber.license}</p>`:""}
            ${i.prescriber.institution?`<p>${i.prescriber.institution}</p>`:""}
          </div>
        </div>

        <!-- Medications Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>${t("print.prescription.medication")}</th>
              <th class="text-center">${t("print.prescription.quantity")}</th>
              <th>${t("print.prescription.instructions")}</th>
              <th class="text-center">${t("print.prescription.dispensed")}</th>
            </tr>
          </thead>
          <tbody>
            ${e}
          </tbody>
        </table>

        ${i.notes?`
        <div class="section notes-section">
          <h3>${t("print.prescription.notes")}</h3>
          <p>${i.notes}</p>
        </div>
        `:""}

        <!-- Signature Area -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>${t("print.prescription.pharmacistSignature")}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>${t("print.prescription.dateDispensed")}</p>
          </div>
        </div>
      </div>
    `;return this.wrapContent(a,r)}wrapContent(i,r){let t=r.margins||this.defaultOptions.margins;return`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${r.title||"Print Document"}</title>
        <style>
          @page {
            size: ${r.paperSize} ${r.orientation};
            margin: ${t.top} ${t.right} ${t.bottom} ${t.left};
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
          }

          .document {
            max-width: 100%;
            margin: 0 auto;
          }

          .document-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2cc4c4;
          }

          .company-info h1 {
            font-size: 24px;
            color: #0aaaaa;
            margin-bottom: 4px;
          }

          .company-info p {
            font-size: 11px;
            color: #666;
          }

          .document-info {
            text-align: right;
          }

          .document-info h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 8px;
          }

          .document-info p {
            font-size: 11px;
            margin-bottom: 2px;
          }

          .section {
            margin-bottom: 20px;
          }

          .section h3 {
            font-size: 13px;
            color: #0aaaaa;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .section p {
            margin-bottom: 4px;
          }

          .two-column {
            display: flex;
            gap: 40px;
            margin-bottom: 20px;
          }

          .two-column .section {
            flex: 1;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .items-table th,
          .items-table td {
            padding: 10px 12px;
            border: 1px solid #e5e5e5;
          }

          .items-table th {
            background: #f8f8f8;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #555;
          }

          .items-table td {
            vertical-align: top;
          }

          .items-table .sku {
            color: #888;
            font-size: 10px;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .totals-section {
            margin-left: auto;
            width: 250px;
            margin-bottom: 20px;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }

          .totals-row.discount {
            color: var(--color-error-dark);
          }

          .totals-row.total {
            font-size: 14px;
            font-weight: 600;
            border-bottom: 2px solid #2cc4c4;
          }

          .status-section {
            padding: 12px 16px;
            background: #f8f8f8;
            border-radius: 4px;
          }

          .notes-section {
            padding: 12px 16px;
            background: var(--color-warning-bg);
            border-left: 3px solid #f59e0b;
            margin-top: 20px;
          }

          .signature-section {
            display: flex;
            justify-content: space-between;
            gap: 60px;
            margin-top: 40px;
            padding-top: 40px;
          }

          .signature-box {
            flex: 1;
            text-align: center;
          }

          .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 8px;
            height: 40px;
          }

          .signature-box p {
            font-size: 11px;
            color: #666;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${i}
      </body>
      </html>
    `}formatCurrency(i){return new Intl.NumberFormat("bs-BA",{style:"currency",currency:"BAM",minimumFractionDigits:2}).format(i)}static \u0275fac=function(r){return new(r||o)};static \u0275prov=c({token:o,factory:o.\u0275fac,providedIn:"root"})};export{m as a};
