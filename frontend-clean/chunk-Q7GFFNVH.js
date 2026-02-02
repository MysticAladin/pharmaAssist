import{O as c}from"./chunk-M6HJP2RW.js";var p=class l{exportToCSV(t,o,e){let n=o.map(i=>i.header),s=t.map(i=>this.formatRow(i,o)),r="";e.includeHeaders!==!1&&(r+=this.escapeCSVRow(n)+`
`),s.forEach(i=>{r+=this.escapeCSVRow(i)+`
`}),this.downloadFile(r,`${e.filename}.csv`,"text/csv;charset=utf-8;")}exportToExcel(t,o,e){let n=o.map(a=>a.header),s=t.map(a=>this.formatRow(a,o)),r='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';r+='<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">',r+='<style>td, th { mso-number-format:"@"; } th { background-color: #0aaaaa; color: white; font-weight: bold; } td { border: 1px solid #ddd; }</style>',r+="</head><body>",r+='<table border="1">',e.includeHeaders!==!1&&(r+="<tr>",n.forEach(a=>{r+=`<th>${this.escapeHTML(a)}</th>`}),r+="</tr>"),s.forEach(a=>{r+="<tr>",a.forEach(d=>{r+=`<td>${this.escapeHTML(d)}</td>`}),r+="</tr>"}),r+="</table></body></html>";let i=new Blob(["\uFEFF"+r],{type:"application/vnd.ms-excel"});this.downloadBlob(i,`${e.filename}.xls`)}exportToJSON(t,o){let e=JSON.stringify(t,null,2);this.downloadFile(e,`${o.filename}.json`,"application/json;charset=utf-8;")}exportToPDF(t,o,e){let n=o.map(a=>a.header),s=t.map(a=>this.formatRow(a,o)),r=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${e.title||e.filename}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 12px; }
          .header { margin-bottom: 20px; }
          .header h1 { color: #0aaaaa; margin: 0 0 5px; font-size: 24px; }
          .header p { color: #666; margin: 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #0aaaaa; color: white; font-weight: 600; font-size: 11px; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${e.title?`<h1>${this.escapeHTML(e.title)}</h1>`:""}
          ${e.subtitle?`<p>${this.escapeHTML(e.subtitle)}</p>`:""}
          <p>Generated: ${new Date().toLocaleString("bs-BA")}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${n.map(a=>`<th>${this.escapeHTML(a)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${s.map(a=>`<tr>${a.map(d=>`<td>${this.escapeHTML(d)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>PharmaAssist - ${new Date().toLocaleDateString("bs-BA")}</p>
        </div>
      </body>
      </html>
    `,i=window.open("","_blank");if(!i){console.error("Failed to open print window");return}i.document.write(r),i.document.close(),i.onload=()=>{setTimeout(()=>{i.print()},250)}}formatRow(t,o){return o.map(e=>{let n=this.getNestedValue(t,e.key);return e.format?e.format(n,t):this.formatValue(n)})}getNestedValue(t,o){return o.split(".").reduce((e,n)=>e?.[n],t)}formatValue(t){return t==null?"":t instanceof Date?t.toLocaleDateString("bs-BA"):typeof t=="boolean"?t?"Yes":"No":typeof t=="number"?t.toString():String(t)}escapeCSVRow(t){return t.map(o=>this.escapeCSVValue(o)).join(",")}escapeCSVValue(t){return t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t.replace(/"/g,'""')}"`:t}escapeHTML(t){let o=document.createElement("div");return o.textContent=t,o.innerHTML}downloadFile(t,o,e){let n=new Blob(["\uFEFF"+t],{type:e});this.downloadBlob(n,o)}downloadBlob(t,o){let e=document.createElement("a"),n=URL.createObjectURL(t);e.setAttribute("href",n),e.setAttribute("download",o),e.style.visibility="hidden",document.body.appendChild(e),e.click(),document.body.removeChild(e),URL.revokeObjectURL(n)}static \u0275fac=function(o){return new(o||l)};static \u0275prov=c({token:l,factory:l.\u0275fac,providedIn:"root"})};export{p as a};
