
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (invoice: any) => {
  const doc = new jsPDF() as any;

  // Header - Logo Placeholder (since local file paths are hard in browser)
  doc.setFillColor(19, 236, 91); // Primary Color
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EXTINTORES UY', 15, 25);
  
  doc.setFontSize(10);
  doc.text('Seguridad y Mantenimiento', 15, 32);

  // Invoice Info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(16);
  doc.text('ORDEN DE SERVICIO / FACTURA', 120, 25);
  doc.setFontSize(10);
  doc.text(`ID: #${invoice.id.substring(0, 8).toUpperCase()}`, 120, 32);

  // Client Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Cliente: ${invoice.clients?.name || 'S/D'}`, 15, 62);
  doc.text(`RUT: ${invoice.clients?.rut || 'S/D'}`, 15, 67);
  doc.text(`Dirección: ${invoice.clients?.address || 'S/D'}`, 15, 72);

  // Details
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE LA ORDEN', 120, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${invoice.invoice_date}`, 120, 62);
  doc.text(`Vencimiento: ${invoice.due_date}`, 120, 67);
  doc.text(`Equipos Cubiertos: ${invoice.equipment_count || 0}`, 120, 72);

  // Table
  const tableData = invoice.items.map((item: any) => [
    item.description,
    item.qty,
    `$ ${Number(item.price).toLocaleString()}`,
    `$ ${(item.qty * item.price).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 85,
    head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [19, 236, 91], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      3: { halign: 'right' }
    }
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL A PAGAR: $ ${Number(invoice.amount).toLocaleString()}`, 130, finalY);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento es una orden de servicio generada por la plataforma ExtintoresUY.', 15, 280);
  doc.text('Gracias por confiar en nuestros servicios de seguridad contra incendios.', 15, 285);

  doc.save(`Factura_ExtintoresUY_${invoice.id.substring(0, 8)}.pdf`);
};
