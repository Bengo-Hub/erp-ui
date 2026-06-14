<script setup>
import { ref } from 'vue';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const props = defineProps({
    title: String,
    reportfor: String,
    rpt: String,
    records: Array,
    pl: String,
    headers: Object,
    uniqueCars: Object,
    showme: Boolean,
    printedpdf: Boolean
});

const pagelayout = ref('p');

const generatePDF = (event) => {
    const d = new Date();
    const filename = `${d.toISOString()}`;
    var business = JSON.parse(sessionStorage.getItem('business'));
    var baseUrl = window.$http.toString().replace('api/', 'media/');
    var logo = business.business__watermarklogo ? `${baseUrl}${this.business.business__watermarklogo}` : logoImage;
    var address = business.address ? business.address : 'Excel Building, 1st Floor, Oginga Road,';
    var box = business.address ? `P.O Box ${business.postal_code}-${business.zip_code} ${business.city},` : 'P.O Box 567-40100 Kisumu,';
    var tel1 = business.contact_number ? business.contact_number : '0743 793 901';
    var alt_tel = business.alternate_contact_number ? `|${business.alternate_contact_number}` : '|0792 548766';
    var tel = tel1 + alt_tel;
    var email = business.email ? business.email : 'info@codevertexitsolutions.com';
    var website = business.website ? business.website : 'www.codevertexitsolutions.com';

    const doc = new jsPDF(pagelayout.value);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(5, 5, 200, 30, 1, 1, 'FD');
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(10);
    doc.addFont('Tahoma', 'Tahoma', 'bold');
    doc.setFont('Tahoma');
    doc.text(logoX - 7, 20, address);
    doc.text(logoX - 7, 24, `${box}\nTel ${tel},`);
    doc.text(logoX - 7, 32, `${email}|${website}`);
    doc.text(150, 30, `Print Date: ${d.toISOString()}`);
    doc.text(60, 33, `Branch Name: ${business.location__name}`);
    doc.setFontSize(14);
    doc.addFont('Tahoma', 'Tahoma', 'bold');

    const klogo = '@/assets/logo.png';
    const imgLogo = new Image();
    const imgKLogo = new Image();
    imgLogo.src = logo;
    imgKLogo.src = klogo;
    doc.addImage(imgLogo, 'PNG', 10, 5, 40, 30, 5, 5);
    doc.setFillColor(255, 255, 254);
    doc.roundedRect(1, 1, 14, 9, 1, 1, 'F');
    doc.addImage(imgKLogo, 'PNG', 1, 1, 12, 7, 3, 3);

    doc.text(10, 40, props.title);

    doc.setFillColor(0, 255, 0);
    doc.addFont('Tahoma', 'Tahoma', 'bold');
    doc.setFontSize(9);
    try {
        doc.text(10, 44, props.rpt);
    } catch (e) {
        console.log(e);
    }

    if (event === 'Excel') {
        if (props.records.length === 0) {
            Swal.fire({
                position: 'center',
                icon: 'error',
                title: 'No Data',
                showConfirmButton: true
            }).then(() => {
                Swal.close();
            });
            return;
        }

        const csvRows = [];
        const headers = Object.keys(props.records[0]);
        csvRows.push(headers.join(','));

        props.records.forEach((row) => {
            const values = headers.map((header) => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        });

        const csvData = csvRows.join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${props.title}${filename}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        doc.autoTable({
            head: [props.headers],
            body: props.uniqueCars,
            startY: 44,
            margin: { horizontal: 0 },
            styles: {
                columnWidth: 'wrap',
                fontSize: 7,
                overflow: 'linebreak',
                cellWidth: 'auto'
            },
            columnStyles: {
                2: { cellWidth: 'auto' },
                nil: { halign: 'center' },
                tgl: { halign: 'center' }
            },
            headerStyles: {
                halign: 'center',
                fillColor: [0, 150, 120],
                textColor: [255, 255, 255],
                lineColor: [0, 0, 0]
            },
            bodyStyles: { lineColor: [0, 0, 0] },
            theme: 'grid'
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`BENGOBOX Kenya | E-COMMERCE | YOGIS DELIGHT                            Prepared by:${JSON.parse(sessionStorage.user).email}                                 Page ${i} of ${pageCount}`, 190, 290, null, null, 'right');
        }

        const previewLink = doc.output('bloburl');
        const openedDoc = window.open(previewLink, `${props.title}${filename}.pdf`, 'toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes,top=000,left=500,width=1000,height=1500');
        openedDoc.focus();
    }
};
</script>

<template>
    <div class="p-4">
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <Card>
                    <template #content>
                        <form @submit.prevent="handleSubmit">
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12 overflow-auto">
                                    <h5 class="my-4 text-lg font-semibold">Do you want to generate a PDF document for {{ title }}?</h5>
                                </div>
                            </div>
                        </form>
                    </template>
                </Card>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4 mt-4">
            <div class="col-span-12 flex flex-row space-x-4">
                <div class="col-span-3">
                    <Button label="Print Excel" class="bg-gray-800 text-white" @click="generatePDF('Excel')" />
                </div>
                <div class="col-span-3">
                    <Button label="Print PDF" class="bg-gray-800 text-white" @click="generatePDF('pdf')" />
                </div>
            </div>
            <div class="col-span-6">
                <p class="text-dark font-bold underline">PDF Page Options</p>
                <div class="flex flex-row space-x-4">
                    <Checkbox v-model="pagelayout" inputId="checkbox-1" value="l" uncheckedValue="l" label="Landscape" />
                    <Checkbox v-model="pagelayout" inputId="checkbox-2" value="p" uncheckedValue="p" label="Portrait" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any custom styles here */
</style>
