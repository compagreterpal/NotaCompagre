// Main JavaScript for Nota Perusahaan Web App

// Global variables
let currentReceiptNumber = '';
let items = [];
let recipientHistory = [];

// Utility functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const showToast = (message, type = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
};

const showLoading = (element) => {
    element.classList.add('loading');
    element.disabled = true;
};

const hideLoading = (element) => {
    element.classList.remove('loading');
    element.disabled = false;
};

const validateForm = (formData) => {
    const errors = [];
    
    if (!formData.company_code) {
        errors.push('Perusahaan harus dipilih');
    }
    
    if (!formData.recipient) {
        errors.push('Penerima harus diisi');
    }
    
    if (!formData.date) {
        errors.push('Tanggal harus diisi');
    }
    
    if (items.length === 0) {
        errors.push('Minimal harus ada 1 item');
    }
    
    return errors;
};

const parseQuantity = (quantityStr) => {
    // Handle "2" or "Dua (2) lbr" format
    const match = quantityStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
};

const parseSize = (sizeStr) => {
    // Handle "4X6" format
    if (!sizeStr || sizeStr === '-') return 1;
    
    const match = sizeStr.match(/(\d+)\s*[xX]\s*(\d+)/);
    if (match) {
        return parseInt(match[1]) * parseInt(match[2]);
    }
    
    return 1;
};

const calculateItemTotal = (quantity, size, unitPrice) => {
    const quantityNum = parseQuantity(quantity);
    const sizeArea = parseSize(size);
    return quantityNum * sizeArea * unitPrice;
};

const updateDatabaseStats = async () => {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.error) {
            console.error('Error fetching stats:', data.error);
            return;
        }
        
        // Update UI
        document.getElementById('receiptsCount').textContent = data.receipts_count;
        document.getElementById('itemsCount').textContent = data.items_count;
        
        // Update progress bar
        const progress = (data.receipts_count / data.export_threshold) * 100;
        const progressBar = document.getElementById('dbProgress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            if (data.approaching_limit) {
                progressBar.className = 'progress-bar bg-warning';
            } else if (progress >= 100) {
                progressBar.className = 'progress-bar bg-danger';
            } else {
                progressBar.className = 'progress-bar bg-success';
            }
        }
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
};

const loadRecipientHistory = async () => {
    try {
        const response = await fetch('/api/receipts');
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading recipients:', data.error);
            return;
        }
        
        // Extract unique recipients
        const recipients = [...new Set(data.receipts.map(r => r.recipient))];
        recipientHistory = recipients;
        
        // Update datalist
        const datalist = document.getElementById('recipientList');
        if (datalist) {
            datalist.innerHTML = '';
            recipients.forEach(recipient => {
                const option = document.createElement('option');
                option.value = recipient;
                datalist.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading recipient history:', error);
    }
};

const filterRecipients = (input) => {
    const value = input.value.toLowerCase();
    const filtered = recipientHistory.filter(recipient => 
        recipient.toLowerCase().includes(value)
    );
    
    // Update datalist
    const datalist = document.getElementById('recipientList');
    if (datalist) {
        datalist.innerHTML = '';
        filtered.forEach(recipient => {
            const option = document.createElement('option');
            option.value = recipient;
            datalist.appendChild(option);
        });
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    const dateInput = document.getElementById('receiptDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Load initial data
    updateDatabaseStats();
    loadRecipientHistory();
    
    // Auto-refresh stats every 30 seconds
    setInterval(updateDatabaseStats, 30000);
});

// Export functions
const exportToExcel = async () => {
    try {
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'danger');
            return;
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${btoa(data.filename)}`;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(data.message, 'success');
        
        // Refresh stats
        setTimeout(updateDatabaseStats, 1000);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Error saat export data', 'danger');
    }
};

// Navigation functions
const navigateTo = (url) => {
    window.location.href = url;
};

// Common modal functions
const showModal = (modalId) => {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
};

const hideModal = (modalId) => {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
};

// Error handling
const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    showToast(`Error: ${error.message || error}`, 'danger');
};

// Success handling
const handleSuccess = (message) => {
    showToast(message, 'success');
};

// API helper functions
const apiCall = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
    } catch (error) {
        throw error;
    }
};

// Export to global scope for use in other files
window.NotaApp = {
    formatCurrency,
    formatDate,
    showToast,
    showLoading,
    hideLoading,
    validateForm,
    parseQuantity,
    parseSize,
    calculateItemTotal,
    updateDatabaseStats,
    loadRecipientHistory,
    filterRecipients,
    exportToExcel,
    navigateTo,
    showModal,
    hideModal,
    handleError,
    handleSuccess,
    apiCall
};
