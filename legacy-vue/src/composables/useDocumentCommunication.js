/**
 * useDocumentCommunication - Reusable hook for document send, schedule, and share
 * 
 * Works with any document type: Invoice, Quotation, PO, etc.
 * Provides consistent interface across all modules
 */
import axios from '@/utils/axiosConfig';
import { ref } from 'vue';
import { useToast } from './useToast';

export const useDocumentCommunication = () => {
    const { showToast } = useToast();
    const loading = ref(false);
    const shareUrl = ref(null);
    const shareToken = ref(null);

    /**
     * Send document via email
     * @param {string} endpoint - API endpoint (e.g., '/finance/invoicing/invoices/1/send/')
     * @param {Object} emailData - Email data { email_to, send_copy_to, message }
     * @returns {Promise}
     */
    const sendViaEmail = async (endpoint, emailData) => {
        loading.value = true;
        try {
            const response = await axios.post(endpoint, emailData);
            showToast('success', 'Success', `Document sent successfully`);
            return response.data;
        } catch (error) {
            console.error('Error sending document:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to send document';
            showToast('error', 'Error', errorMsg);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Send document via WhatsApp
     * @param {string} endpoint - API endpoint (e.g., '/finance/invoicing/invoices/1/send-whatsapp/')
     * @param {Object} whatsappData - WhatsApp data { phone, message }
     * @returns {Promise}
     */
    const sendViaWhatsApp = async (endpoint, whatsappData) => {
        loading.value = true;
        try {
            // Format: Open WhatsApp Web with pre-filled message and public view link
            const response = await axios.post(endpoint, whatsappData);
            const publicUrl = response.data?.public_url || response.data?.share_url;
            
            if (publicUrl) {
                // Open WhatsApp with message containing link
                const message = encodeURIComponent(`${whatsappData.message || 'Check this document'}\n${publicUrl}`);
                const whatsappLink = `https://wa.me/${whatsappData.phone.replace(/\D/g, '')}?text=${message}`;
                window.open(whatsappLink, '_blank');
            }
            
            showToast('success', 'Success', 'WhatsApp message opened');
            return response.data;
        } catch (error) {
            console.error('Error sending via WhatsApp:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to send via WhatsApp';
            showToast('error', 'Error', errorMsg);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Schedule document for future sending
     * @param {string} endpoint - API endpoint (e.g., '/finance/invoicing/invoices/1/schedule/')
     * @param {Object} scheduleData - Schedule data { scheduled_date, message }
     * @returns {Promise}
     */
    const scheduleDocument = async (endpoint, scheduleData) => {
        loading.value = true;
        try {
            const response = await axios.post(endpoint, scheduleData);
            showToast('success', 'Success', 'Document scheduled successfully');
            return response.data;
        } catch (error) {
            console.error('Error scheduling document:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to schedule document';
            showToast('error', 'Error', errorMsg);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Generate shareable public URL for document
     * @param {string} endpoint - API endpoint (e.g., '/finance/invoicing/invoices/1/share/')
     * @param {Object} options - Optional settings { expiresIn, allowPayment }
     * @returns {Promise}
     */
    const generateShareUrl = async (endpoint, options = {}) => {
        loading.value = true;
        try {
            const response = await axios.post(endpoint, options);
            shareUrl.value = response.data?.url || response.data?.public_url;
            shareToken.value = response.data?.token;
            
            showToast('success', 'Success', 'Share link generated');
            return {
                url: shareUrl.value,
                token: shareToken.value,
                ...response.data
            };
        } catch (error) {
            console.error('Error generating share URL:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to generate share URL';
            showToast('error', 'Error', errorMsg);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Copy share URL to clipboard
     * @param {string} url - URL to copy
     */
    const copyShareUrlToClipboard = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            showToast('success', 'Copied', 'Share URL copied to clipboard');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            showToast('error', 'Error', 'Failed to copy URL');
        }
    };

    /**
     * Get public view URL for document (for embedding in emails)
     * @param {string} documentId - Document ID
     * @param {string} token - Share token
     * @param {string} documentType - Document type (invoice, quotation, po)
     * @returns {string}
     */
    const getPublicViewUrl = (documentId, token, documentType = 'invoice') => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/public/${documentType}/${documentId}/${token}`;
    };

    return {
        loading,
        shareUrl,
        shareToken,
        sendViaEmail,
        sendViaWhatsApp,
        scheduleDocument,
        generateShareUrl,
        copyShareUrlToClipboard,
        getPublicViewUrl
    };
};
