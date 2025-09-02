// Common utility functions for Nota Perusahaan Web App

// Global variables
let recipientHistory = [];

// Utility functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
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
    // Check if toast container exists
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        // Create toast container if it doesn't exist
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toastElement);
    
    // Show toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
};

const showError = (message) => {
    showToast(message, 'danger');
};

const showSuccess = (message) => {
    showToast(message, 'success');
};

const showWarning = (message) => {
    showToast(message, 'warning');
};

const showInfo = (message) => {
    showToast(message, 'info');
};

// Form validation
const validateForm = () => {
    const errors = [];
    
    // Check required fields
    const companySelect = document.getElementById('companySelect');
    if (!companySelect || !companySelect.value) {
        errors.push('Perusahaan harus dipilih');
    }
    
    const dateInput = document.getElementById('receiptDate');
    if (!dateInput || !dateInput.value) {
        errors.push('Tanggal harus diisi');
    }
    
    // Check if items exist
    if (!window.items || window.items.length === 0) {
        errors.push('Minimal harus ada 1 item');
    }
    
    // Check recipient
    const recipientInput = document.getElementById('recipient');
    if (!recipientInput || !recipientInput.value.trim()) {
        errors.push('Kepada Yth harus diisi');
    }
    
    return errors;
};

// Calculate item total
const calculateItemTotal = (quantity, size, unitPrice) => {
    if (!quantity || !size || !unitPrice) return 0;
    
    const quantityNum = parseFloat(quantity) || 0;
    const unitPriceNum = parseFloat(unitPrice) || 0;
    
    // Parse size (format: "LengthXWidth")
    let sizeArea = 1;
    if (size && size !== '-') {
        const sizeParts = size.split('X');
        if (sizeParts.length === 2) {
            const length = parseFloat(sizeParts[0]) || 0;
            const width = parseFloat(sizeParts[1]) || 0;
            sizeArea = length * width;
        }
    }
    
    return quantityNum * sizeArea * unitPriceNum;
};

// Update database stats safely
const updateDatabaseStats = async () => {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.error) {
            console.error('Error fetching stats:', data.error);
            return;
        }
        
        // Safely update UI elements if they exist
        const receiptsCountElement = document.getElementById('receiptsCount');
        if (receiptsCountElement) {
            receiptsCountElement.textContent = data.receipts_count;
        }
        
        const itemsCountElement = document.getElementById('itemsCount');
        if (itemsCountElement) {
            itemsCountElement.textContent = data.items_count;
        }
        
        // Update progress bar if it exists
        const progressBar = document.getElementById('dbProgress');
        if (progressBar) {
            const progress = (data.receipts_count / data.export_threshold) * 100;
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

// Load recipient history safely
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
        
        // Update datalist if it exists
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

// Filter recipients safely
const filterRecipients = (input) => {
    if (!input) return;
    
    const value = input.value.toLowerCase();
    const filtered = recipientHistory.filter(recipient => 
        recipient.toLowerCase().includes(value)
    );
    
    // Update datalist if it exists
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

// Event listeners - only run on pages that need them
document.addEventListener('DOMContentLoaded', () => {
    // Set current date if date input exists
    const dateInput = document.getElementById('receiptDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Load initial data only if we're on a page that needs it
    if (document.getElementById('receiptsCount') || document.getElementById('dbProgress')) {
        updateDatabaseStats();
        // Auto-refresh stats every 30 seconds
        setInterval(updateDatabaseStats, 30000);
    }
    
    // Load recipient history only if we're on the main form page
    if (document.getElementById('recipientList')) {
        loadRecipientHistory();
    }
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
            throw new Error(data.error);
        }
        
        // Success
        showSuccess(data.message);
        
        // Reload page after export
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showError(`Error saat export: ${error.message}`);
    }
};

// Make functions globally available
window.NotaApp = {
    formatCurrency,
    formatDate,
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    validateForm,
    calculateItemTotal,
    updateDatabaseStats,
    loadRecipientHistory,
    filterRecipients,
    exportToExcel
};
