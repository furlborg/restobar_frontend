// Import the jsPDF library
import jsPDF from "jspdf";

// Function to generate the voucher ticket
export function generateVoucher(content, voucherWidth) {
  // Create a new jsPDF instance
  const doc = new jsPDF();

  // Set font size and type for the content
  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");

  // Calculate the height of the content
  const lineHeight = 15; // Adjust this value based on your font size
  const contentLines = doc.splitTextToSize(content, voucherWidth);
  const contentHeight = contentLines.length * lineHeight;

  // Calculate vertical alignment position
  const pageHeight = doc.internal.pageSize.getHeight();
  const verticalPosition = (pageHeight - contentHeight) / 2;

  // Add the content to the PDF
  doc.text(contentLines, 10, verticalPosition);

  // Save the PDF
  doc.save("voucher.pdf");
}

// // Example content and voucher width
// const voucherContent =
//   "This is an example voucher content. It can span multiple lines based on the width.";
// const voucherWidth = 150; // Adjust the width as needed

// // Generate the voucher
// generateVoucher(voucherContent, voucherWidth);
