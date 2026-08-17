import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface VendorReportOrder {
  orderNumber: string;
  createdAt: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
}

interface VendorReportPayout {
  reference: string;
  status: string;
  requestedAt: string;
  settledAt: string | null;
  amount: number;
}

export interface VendorReportData {
  generatedAt: string;
  period: { timeframe: string; start: string; end: string };
  vendor: {
    vendorId: string;
    shopName: string | null;
    shopDescription: string | null;
    email: string | null;
    phone: string | null;
  };
  summary: {
    totalSales: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalDeliveryCharges: number;
  };
  orders: VendorReportOrder[];
  payouts: VendorReportPayout[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const fmtDateOnly = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
const money = (n: number) => `Rs. ${n.toFixed(2)}`;

const TIMEFRAME_LABEL: Record<string, string> = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
};

/** Builds and downloads the vendor's report as a real, multi-page .pdf
 * using jsPDF + autoTable — no window.print(), no HTML screenshot. */
export function generateVendorReportPdf(data: VendorReportData): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  const addFooterOnAllPages = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, doc.internal.pageSize.getHeight() - 20, {
        align: "right",
      });
      doc.text("GRABIT", marginX, doc.internal.pageSize.getHeight() - 20);
    }
  };

  let y = 50;

  doc.setFontSize(20);
  doc.setTextColor(255, 109, 0);
  doc.text("GRABIT", marginX, y);
  y += 22;
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Vendor Sales & Payout Report", marginX, y);
  y += 20;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 24;

  // Vendor Information
  doc.setFontSize(11);
  doc.setTextColor(255, 109, 0);
  doc.text("VENDOR INFORMATION", marginX, y);
  y += 16;
  doc.setFontSize(9.5);
  doc.setTextColor(30);

  const vendorLines: [string, string | null][] = [
    ["Shop Name", data.vendor.shopName],
    ["Vendor ID", data.vendor.vendorId],
    ["Email", data.vendor.email],
    ["Phone", data.vendor.phone],
    [
      "Report Period",
      `${TIMEFRAME_LABEL[data.period.timeframe] ?? data.period.timeframe} (${fmtDateOnly(data.period.start)} - ${fmtDateOnly(data.period.end)})`,
    ],
    ["Report Generated", fmtDate(data.generatedAt)],
  ];
  for (const [label, value] of vendorLines) {
    if (!value) continue;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), marginX + 130, y);
    y += 15;
  }
  y += 10;

  // Sales Summary
  doc.setFontSize(11);
  doc.setTextColor(255, 109, 0);
  doc.text("SALES SUMMARY", marginX, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["Metric", "Value"]],
    body: [
      ["Total Sales", money(data.summary.totalSales)],
      ["Total Orders", String(data.summary.totalOrders)],
      ["Completed Orders", String(data.summary.completedOrders)],
      ["Cancelled Orders", String(data.summary.cancelledOrders)],
      ["Average Order Value", money(data.summary.averageOrderValue)],
      ["Total Delivery Charges", money(data.summary.totalDeliveryCharges)],
    ],
    theme: "grid",
    headStyles: { fillColor: [255, 109, 0] },
    styles: { fontSize: 9 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  // Order Details
  doc.setFontSize(11);
  doc.setTextColor(255, 109, 0);
  doc.text("ORDER DETAILS", marginX, y);
  y += 6;

  const orderRows = data.orders.map((o) => [
    o.orderNumber,
    fmtDate(o.createdAt),
    o.customerId,
    o.items.map((it) => `${it.name} x${it.quantity}`).join("\n"),
    money(o.total),
    o.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["Order", "Date/Time", "Customer", "Items", "Total", "Status"]],
    body: orderRows.length > 0 ? orderRows : [["-", "-", "-", "No orders in this period", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: [255, 109, 0] },
    styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 3: { cellWidth: 150 } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  // Payout Ledger
  if (y > doc.internal.pageSize.getHeight() - 150) {
    doc.addPage();
    y = 50;
  }
  doc.setFontSize(11);
  doc.setTextColor(255, 109, 0);
  doc.text("PAYOUT LEDGER", marginX, y);
  y += 6;

  const payoutRows = data.payouts.map((p) => [
    p.reference,
    p.status.toUpperCase(),
    fmtDateOnly(p.requestedAt),
    p.settledAt ? fmtDateOnly(p.settledAt) : "-",
    money(p.amount),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["Reference", "Status", "Requested", "Settled", "Amount"]],
    body: payoutRows.length > 0 ? payoutRows : [["-", "-", "-", "-", "No payout records yet"]],
    theme: "grid",
    headStyles: { fillColor: [255, 109, 0] },
    styles: { fontSize: 8.5 },
  });

  addFooterOnAllPages();

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`GRABIT_Vendor_Report_${dateStr}.pdf`);
}
