import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSalesReportPDF = (data: any, startDate: string, endDate: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Satış Raporu', 14, 20);
  doc.setFontSize(10);
  doc.text(`Tarih Aralığı: ${startDate} - ${endDate}`, 14, 30);
  
  // Özet bilgiler
  doc.setFontSize(12);
  doc.text('Özet', 14, 40);
  autoTable(doc, {
    startY: 45,
    head: [['Metrik', 'Değer']],
    body: [
      ['Toplam Sipariş', data.totalOrders.toString()],
      ['Toplam Gelir', `₺${data.totalRevenue.toFixed(2)}`],
      ['Ortalama Sipariş Değeri', `₺${data.avgOrderValue.toFixed(2)}`],
    ],
  });
  
  // En çok satan ürünler
  const finalY = (doc as any).lastAutoTable.finalY || 70;
  doc.text('En Çok Satan Ürünler', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Ürün', 'Adet', 'Gelir']],
    body: data.topProducts.map((p: any) => [p.name, p.quantity, `₺${p.revenue.toFixed(2)}`]),
  });
  
  return doc.output('blob');
};

export const generateProductionReportPDF = (data: any, startDate: string, endDate: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Üretim Raporu', 14, 20);
  doc.setFontSize(10);
  doc.text(`Tarih Aralığı: ${startDate} - ${endDate}`, 14, 30);
  
  autoTable(doc, {
    startY: 40,
    head: [['Metrik', 'Değer']],
    body: [
      ['Toplam Sipariş', data.totalOrders.toString()],
      ['Tamamlanan', data.completed.toString()],
      ['Tamamlanma Oranı', `${data.completionRate.toFixed(1)}%`],
    ],
  });
  
  return doc.output('blob');
};

export const generateCustomerReportPDF = (data: any, startDate: string, endDate: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Müşteri Raporu', 14, 20);
  doc.setFontSize(10);
  doc.text(`Tarih Aralığı: ${startDate} - ${endDate}`, 14, 30);
  
  autoTable(doc, {
    startY: 40,
    head: [['Metrik', 'Değer']],
    body: [
      ['Toplam Müşteri', data.totalCustomers.toString()],
      ['Aktif Müşteri', data.activeCustomers.toString()],
      ['Yeni Müşteri', data.newCustomers.toString()],
    ],
  });
  
  const finalY = (doc as any).lastAutoTable.finalY || 70;
  doc.text('En Değerli Müşteriler', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Müşteri', 'Sipariş Sayısı', 'Toplam Harcama']],
    body: data.topCustomers.map((c: any) => [c.name, c.orders, `₺${c.total.toFixed(2)}`]),
  });
  
  return doc.output('blob');
};
