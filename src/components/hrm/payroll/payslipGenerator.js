import logoImage from '@/assets/images/logos/logo.png';
import { formatCurrency } from '@/utils/formatters';
import { jsPDF } from 'jspdf';

export const generatePayslip = async (payslips, toast = null, sendmail = false, companyName = 'Company') => {
    const payslipData = [];
    if (Array.isArray(payslips)) {
        const doc = new jsPDF();
        payslips.forEach((payslip, index) => {
            createPayslipDocument(doc, payslip);
            if (index !== payslips.length - 1) {
                doc.addPage();
            }
            //email payslip if need be
            if (sendmail == true) {
                const fileName = generatePayslipFileName(payslip.employee.name, payslip.payroll_date, 'payslip');
                const pdfBlob = doc.output('blob'); // Generate PDF as a Blob
                // Append the payslip data to the array
                payslipData.push({
                    email: payslip.employee.email,
                    name: payslip.employee.name,
                    file: pdfBlob,
                    fileName: fileName,
                    period: formattedMonthYear(payslip.payroll_date)
                });
            }
        });
        if (sendmail == false) {
            const fileName = generatePayrollFileName(companyName, payslips[0]?.payroll_date);
            doc.save(fileName);
        }
    } else {
        const doc = new jsPDF();
        // Generate a single payslip if it's an object
        createPayslipDocument(doc, payslips);
        //email payslip if need be
        if (sendmail == true) {
            const fileName = generatePayslipFileName(payslips.employee.name, payslips.payroll_date, 'payslip');
            const pdfBlob = doc.output('blob'); // Generate PDF as a Blob
            // Append the payslip data to the array
            payslipData.push({
                email: payslips.employee.email,
                name: payslips.employee.name,
                file: pdfBlob,
                fileName: fileName,
                period: formattedMonthYear(payslips.payroll_date)
            });
        } else {
            // Save the PDF with improved naming
            const fileName = generatePayslipFileName(payslips.employee.name, payslips.payroll_date, 'payslip');
            doc.save(fileName);
        }
    }
    if (sendmail == true && payslipData) {
        // Send the payslip data to the Python backend
        await emailPayslips(payslipData, toast);
    }
};

// Generate filename for single payslip: EmployeeName_PayrollPeriod_YYYY-MM-DD.pdf
export const generatePayslipFileName = (employeeName, payrollDate, type = 'payslip') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const period = formattedMonthYear(payrollDate).replace(/\s+/g, '_');
    const sanitizedName = employeeName?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'Employee';
    return `${sanitizedName}_${type}_${period}_${timestamp}.pdf`;
};

// Generate filename for payroll: CompanyName_PayrollPeriod_YYYY-MM-DD.pdf
export const generatePayrollFileName = (companyName, payrollDate) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const period = formattedMonthYear(payrollDate).replace(/\s+/g, '_');
    const sanitizedCompanyName = companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
    return `${sanitizedCompanyName}_Payroll_${period}_${timestamp}.pdf`;
};
export const createPayslipDocument = (doc, payslip) => {
    // Helper function to check if we need a page break
    const checkPageBreak = (yPosition, estimatedHeight) => {
        const pageHeight = doc.internal.pageSize.height;
        const margin = 50; // Conservative margin
        return yPosition + estimatedHeight > pageHeight - margin;
    };

    // Enhanced function to draw a professional section without page breaks
    const drawSection = (title, yStart, content, options = {}) => {
        const { backgroundColor = [240, 240, 240], textColor = [0, 0, 0], titleColor = [0, 0, 0], showBorder = true, padding = 3 } = options;

        const sectionHeight = 8 + content.length * 6 + padding * 2;

        // Draw section background
        doc.setFillColor(...backgroundColor);
        doc.rect(10, yStart - 2, 190, sectionHeight, 'F');

        // Draw border if enabled
        if (showBorder) {
            doc.setDrawColor(200, 200, 200);
            doc.rect(10, yStart - 2, 190, sectionHeight, 'S');
        }

        // Draw title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...titleColor);
        doc.text(title, 15, yStart + 2);

        // Draw content without individual line page breaks
        content.forEach((item, index) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...textColor);

            // Label
            doc.text(item.label, 15, yStart + 8 + index * 6);

            // Value with right alignment
            const valueWidth = doc.getTextWidth(item.value);
            doc.text(item.value, 185 - valueWidth, yStart + 8 + index * 6);
        });

        return sectionHeight + 2;
    };
    // Business information
    var business = JSON.parse(sessionStorage.getItem('business'));
    var logoUrl = business.business__watermarklogo ? `${business.business__watermarklogo}` : logoImage;
    var address = business.address ? business.address : 'Excel Building, 1st Floor, Oginga Road,';
    var box = business.address ? `P.O Box ${business.postal_code}-${business.zip_code} ${business.city},` : 'P.O Box 567-40100 Kisumu,';
    var tel1 = business.contact_number ? business.contact_number : '0743 793 901';
    var alt_tel = business.alternate_contact_number ? `|${business.alternate_contact_number}` : '|0792 548766';
    var tel = tel1 + alt_tel;
    var email = business.email ? business.email : 'info@codevertexitsolutions.com';
    var website = business.website ? business.website : 'www.codevertexitsolutions.com';

    // Set up professional styling
    doc.setFont('helvetica');
    doc.setFontSize(10);

    // Create professional header with proper margins
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, 210, 55, 'F'); // Increased height to 55

    // Add logo with proper positioning
    var logoimg = new Image();
    logoimg.src = logoUrl;
    doc.addImage(logoimg, 'PNG', 15, 10, 30, 20); // Moved down to y=10

    // Company name and details with better positioning
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(business.business__name || 'Company Name', 50, 18); // Moved down to y=18

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(address, 50, 25); // Moved down
    doc.text(box, 50, 30); // Moved down
    doc.text(`Tel: ${tel}`, 50, 35); // Moved down
    doc.text(`${email} | ${website}`, 50, 40); // Moved down

    // Payslip title with better positioning
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PAY SLIP', 150, 28); // Moved down

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Period, ${new Date(payslip.payroll_date).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long'
        })}`,
        150,
        35 // Moved down
    );

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(payslip.payroll_date).toLocaleDateString()}`, 150, 40); // Moved down

    // Reset text color for content
    doc.setTextColor(0, 0, 0);

    // Employee Information Section
    const employeeInfo = [
        { label: 'Name:', value: payslip.employee.name },
        { label: 'Staff Number:', value: payslip.employee.staffNo },
        { label: 'Job Title:', value: payslip.employee.job_title },
        {
            label: 'Department/Region:',
            value: `${payslip.employee.department}/${payslip.employee.region}`
        }
    ];
    let currentY = 65; // Starting Y position after header (increased from 60 to 65)
    currentY += drawSection('Employee Information', currentY, employeeInfo, {
        backgroundColor: [248, 250, 252],
        titleColor: [31, 41, 55]
    });

    // Summary Section
    const summaryContent = [
        { label: 'Basic Salary:', value: formatCurrency(payslip.employee.basic_salary) },
        { label: 'Gross Pay:', value: formatCurrency(payslip.gross_pay) },
        { label: 'Net Pay:', value: formatCurrency(payslip.net_pay) }
    ];
    currentY += 3; // Reduced gap between sections
    currentY += drawSection('Pay Summary', currentY, summaryContent, {
        backgroundColor: [239, 246, 255],
        titleColor: [29, 78, 216]
    });

    // NSSF Summary Section
    if (payslip.nssf_employee_tier_1 > 0 || payslip.nssf_employee_tier_2 > 0) {
        const nssfContent = [
            { label: 'NSSF Tier 1:', value: formatCurrency(payslip.nssf_employee_tier_1 || 0) },
            { label: 'NSSF Tier 2:', value: formatCurrency(payslip.nssf_employee_tier_2 || 0) },
            { label: 'Total NSSF:', value: formatCurrency((payslip.nssf_employee_tier_1 || 0) + (payslip.nssf_employee_tier_2 || 0)) }
        ];
        currentY += 3; // Reduced gap between sections
        currentY += drawSection('NSSF Contributions', currentY, nssfContent, {
            backgroundColor: [255, 251, 235],
            titleColor: [245, 158, 11]
        });
    }

    // Earnings and Benefits Section
    if (payslip.earnings?.length || payslip.benefits?.length) {
        const combinedContent = [
            ...payslip.earnings.map((earning) => ({
                label: `${earning.earning.title} ${earning.earning.non_cash ? '(Non-cash)' : ''}:`,
                value: formatCurrency(earning.amount)
            })),
            ...payslip.benefits.map((benefit) => ({
                label: `${benefit.benefit.title} ${benefit.benefit.non_cash ? '(Non-cash)' : ''}:`,
                value: formatCurrency(benefit.amount)
            })),
            { label: 'TOTAL EARNINGS & BENEFITS:', value: formatCurrency(payslip.total_earnings) }
        ];

        currentY += 3; // Reduced gap between sections
        currentY += drawSection('Earnings & Benefits', currentY, combinedContent, {
            backgroundColor: [240, 253, 244],
            titleColor: [22, 163, 74]
        });
    }

    // Deductions Before Tax Section
    const deductionsBeforeTaxContent = [];

    // Add NSSF Tier 1
    if (payslip.nssf_employee_tier_1 > 0) {
        deductionsBeforeTaxContent.push({
            label: 'N.S.S.F Tier 1:',
            value: formatCurrency(payslip.nssf_employee_tier_1)
        });
    }

    // Add NSSF Tier 2
    if (payslip.nssf_employee_tier_2 > 0) {
        deductionsBeforeTaxContent.push({
            label: 'N.S.S.F Tier 2:',
            value: formatCurrency(payslip.nssf_employee_tier_2)
        });
    }

    // Add Total NSSF if either tier exists
    if (payslip.nssf_employee_tier_1 > 0 || payslip.nssf_employee_tier_2 > 0) {
        deductionsBeforeTaxContent.push({
            label: 'Total N.S.S.F:',
            value: formatCurrency(Number(payslip.nssf_employee_tier_1 || 0) + Number(payslip.nssf_employee_tier_2 || 0))
        });
    }

    // Add SHIF/NHIF
    if (payslip.shif_or_nhif_contribution > 0) {
        const isShifEra = payslip.payment_period && new Date(payslip.payment_period).getFullYear() >= 2025;
        const title = isShifEra ? 'S.H.I.F:' : 'N.H.I.F:';
        deductionsBeforeTaxContent.push({
            label: title,
            value: formatCurrency(payslip.shif_or_nhif_contribution)
        });
    }

    // Add Housing Levy
    if (payslip.housing_levy > 0) {
        deductionsBeforeTaxContent.push({
            label: 'Housing Levy:',
            value: formatCurrency(payslip.housing_levy)
        });
    }

    // Add other deductions before tax (excluding statutory)
    if (payslip.deductions?.length) {
        const otherDeductions = payslip.deductions
            .filter((x) => x.deduction.deduct_after_taxing === false && !x.deduction.statutory)
            .map((deduction) => ({
                label: deduction.deduction.title + ':',
                value: formatCurrency(deduction.amount)
            }));
        deductionsBeforeTaxContent.push(...otherDeductions);
    }

    // Add total
    deductionsBeforeTaxContent.push({
        label: 'TOTAL DEDUCTIONS BEFORE TAX:',
        value: formatCurrency(payslip.deductions_before_tax)
    });

    if (deductionsBeforeTaxContent.length > 1) {
        // More than just the total
        currentY += 3; // Reduced gap between sections
        currentY += drawSection('Deductions Before Tax', currentY, deductionsBeforeTaxContent, {
            backgroundColor: [254, 242, 242],
            titleColor: [220, 38, 38]
        });
    }
    // Tax and Relief Section
    const taxAndReliefItems = [
        { label: 'Taxable Pay', value: formatCurrency(payslip.taxable_pay) },
        { label: 'P.A.Y.E', value: formatCurrency(payslip.paye) },
        { label: 'Tax Relief', value: formatCurrency(payslip.tax_relief) },
        ...(payslip.ahl_relief > 0 ? [{ label: 'AHL Relief', value: formatCurrency(payslip.ahl_relief) }] : []),
        { label: 'Total Reliefs', value: formatCurrency(payslip.reliefs) },
        {
            label: 'P.A.Y.E After Reliefs',
            value: formatCurrency(parseInt(payslip.reliefs) <= parseInt(payslip.paye) ? parseInt(payslip.paye) - parseInt(payslip.reliefs) : 0.0)
        }
    ];

    // Check if we need a page break before Tax & Relief section
    const taxSectionHeight = 8 + taxAndReliefItems.length * 6 + 6;
    if (checkPageBreak(currentY + 3, taxSectionHeight)) {
        doc.addPage();
        currentY = 20;
    }

    currentY += 3; // Reduced gap between sections
    currentY += drawSection('Tax & Relief', currentY, taxAndReliefItems, {
        backgroundColor: [255, 251, 235],
        titleColor: [245, 158, 11]
    });
    // Deductions After Tax Section
    const deductionsAfterTax = [
        ...payslip.deductions
            .filter((x) => x.deduction.deduct_after_taxing === true)
            .map((deduction) => ({
                label: deduction.deduction.title,
                value: formatCurrency(deduction.amount)
            })),
        ...payslip.loans.map((loan) => ({
            label: loan.loan.title,
            value: formatCurrency(loan.monthly_installment)
        })),
        ...(payslip.benefits.filter((x) => x.benefit.non_cash === true).length
            ? [
                  {
                      label: 'Less Non-Cash Benefits',
                      value: formatCurrency(
                          payslip.benefits.reduce((total, benefit) => {
                              return benefit.benefit.non_cash ? total + parseFloat(benefit.amount) : total;
                          }, 0)
                      )
                  }
              ]
            : []),
        ...payslip.advances.map((advance) => ({
            label: `Advance Pay - (${advance.repay_option.amount})`,
            value: formatCurrency(advance.repay_option.installment_amount)
        })),
        { label: 'TOTAL DEDUCTIONS AFTER TAX:', value: formatCurrency(payslip.deductions_after_tax) }
    ];

    if (deductionsAfterTax.length > 1) {
        // More than just the total
        currentY += 3; // Reduced gap between sections
        currentY += drawSection('Deductions After Tax', currentY, deductionsAfterTax, {
            backgroundColor: [254, 242, 242],
            titleColor: [220, 38, 38]
        });
    }

    // Net Pay Section
    const netPayContent = [{ label: 'NET PAY:', value: formatCurrency(payslip.net_pay) }];

    // Check if we need a page break before Final Net Pay section
    const netPaySectionHeight = 8 + netPayContent.length * 6 + 6;
    if (checkPageBreak(currentY + 3, netPaySectionHeight)) {
        doc.addPage();
        currentY = 20;
    }

    currentY += 3; // Reduced gap between sections
    currentY += drawSection('Final Net Pay', currentY, netPayContent, {
        backgroundColor: [236, 253, 245],
        titleColor: [22, 163, 74],
        textColor: [0, 0, 0]
    });
    // Personal Information Footer
    const personalInfo = [
        { label: 'Payment Mode:', value: payslip.employee.payment_type || 'N/A' },
        { label: 'Bank Name:', value: payslip.employee.bank?.name || 'N/A' },
        { label: 'Bank Account:', value: payslip.employee.bank?.acc || 'N/A' },
        { label: 'ID Number:', value: payslip.employee.id_no || 'N/A' },
        { label: 'PIN:', value: payslip.employee.pin || 'N/A' }
    ];

    // Check if we need a page break before Personal Information section
    const personalInfoSectionHeight = 8 + personalInfo.length * 6 + 6;
    if (checkPageBreak(currentY + 3, personalInfoSectionHeight)) {
        doc.addPage();
        currentY = 20;
    }

    currentY += 3; // Reduced gap between sections
    currentY += drawSection('Personal Information', currentY, personalInfo, {
        backgroundColor: [249, 250, 251],
        titleColor: [75, 85, 99]
    });

    // Add footer at the bottom of the current page
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 20; // Position footer 20 units from bottom

    // Add footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(10, footerY - 10, 200, footerY - 10);

    // Add generation timestamp at the bottom of the page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, footerY - 5);
    doc.text('This is a computer-generated payslip and does not require a signature.', 10, footerY);

    // Add page numbers and footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 20;

        // Add footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(10, footerY - 10, 200, footerY - 10);

        // Add generation timestamp
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, footerY - 5);
        doc.text('This is a computer-generated payslip and does not require a signature.', 10, footerY);

        // Add page number if multiple pages
        if (pageCount > 1) {
            doc.text(`Page ${i} of ${pageCount}`, 190, footerY, { align: 'right' });
        }
    }
};
// Function to send payslip data to the backend
export const emailPayslips = async (payslipData, toast) => {
    // Import axios dynamically to avoid linting issues
    const { default: axios } = await import('axios');
    const formData = new FormData();
    // Append each payslip's data to the FormData
    payslipData.forEach(({ email, name, file, fileName, period }) => {
        formData.append('emails', email); // Add email
        formData.append('names', name); // Add ID
        formData.append('files', file, fileName); // Add file with filename
        formData.append('period', period); // Add file with filename
    });

    try {
        const response = await axios.post('email-payslips', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        toast.add({
            severity: 'success',
            summary: 'Success!',
            detail: response.data.message.toString(),
            life: 3000
        });
        console.log('Payslips sent successfully:', response.data);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.toString(),
            life: 3000
        });
        console.error('Error sending payslips:', error);
    }
};

export const formattedMonthYear = (mydate) => {
    const date = new Date(mydate);
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' });
};
