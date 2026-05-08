
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (invoice: any) => {
  try {
    const doc = new jsPDF();

    // Header Background
    doc.setFillColor(19, 236, 91); 
    doc.rect(0, 0, 210, 40, 'F');
    
    // Brand
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTINTORES UY', 15, 25);
    
    doc.setFontSize(10);
    doc.text('Seguridad y Mantenimiento', 15, 32);

    // Document Type
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(16);
    doc.text('ORDEN DE SERVICIO', 120, 25);
    doc.setFontSize(10);
    doc.text(`ID: #${String(invoice.id || '').substring(0, 8).toUpperCase()}`, 120, 32);

    // Client Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 15, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Cliente: ${invoice.clients?.name || 'S/D'}`, 15, 62);
    doc.text(`RUT: ${invoice.clients?.rut || 'S/D'}`, 15, 67);
    doc.text(`Dirección: ${invoice.clients?.address || 'S/D'}`, 15, 72);

    // Order Details Section
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA ORDEN', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${invoice.invoice_date || new Date().toLocaleDateString()}`, 120, 62);
    doc.text(`Vencimiento: ${invoice.due_date || 'N/A'}`, 120, 67);
    doc.text(`Equipos Cubiertos: ${invoice.equipment_count || 0}`, 120, 72);

    // Items Table
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const tableData = items.map((item: any) => [
      item.description || 'Servicio',
      item.qty || 1,
      `$ ${Number(item.price || 0).toLocaleString()}`,
      `$ ${(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString()}`
    ]);

    autoTable(doc, {
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

    // Total Calculation
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL FINAL: $ ${Number(invoice.amount || 0).toLocaleString()}`, 130, finalY);

    // Footer Info
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento oficial generado por ExtintoresUY - Sistema de Gestión de Seguridad.', 15, 280);
    doc.text('Este documento sirve como comprobante de servicio y orden de pago.', 15, 285);

    // Save File
    doc.save(`Orden_${String(invoice.id || '').substring(0, 8).toUpperCase()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Por favor, intente de nuevo.');
  }
};
