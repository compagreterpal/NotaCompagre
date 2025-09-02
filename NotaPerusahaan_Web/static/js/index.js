// Index page JavaScript for receipt form

document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    setupEventListeners();
    loadInitialData();
});

let currentCompany = '';
let currentReceiptNumber = '';

function initializeForm() {
    // Set current date
    const dateInput = document.getElementById('receiptDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Initialize items array
    window.items = [];
}

function setupEventListeners() {
    // Company selection
    const companySelect = document.getElementById('companySelect');
    if (companySelect) {
        companySelect.addEventListener('change', onCompanyChange);
    }
    
    // Item type change
    const itemTypeInput = document.getElementById('itemType');
    if (itemTypeInput) {
        itemTypeInput.addEventListener('input', onItemTypeChange);
    }
    
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItem);
    }
    
    // Form submission
    const receiptForm = document.getElementById('receiptForm');
    if (receiptForm) {
        receiptForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Clear form button
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearForm);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (confirm('Export dan reset database? Data akan dihapus setelah export.')) {
                exportToExcel();
            }
        });
    }
    
    // View history button
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            window.location.href = '/history';
        });
    }
    
    // Setup button
    const setupBtn = document.getElementById('setupBtn');
    if (setupBtn) {
        setupBtn.addEventListener('click', () => {
            window.location.href = '/setup';
        });
    }
    
    // Discount and DP inputs
    const discountInput = document.getElementById('discount');
    const dpInput = document.getElementById('dp');
    
    if (discountInput) {
        discountInput.addEventListener('input', updateTotal);
    }
    
    if (dpInput) {
        dpInput.addEventListener('input', updateTotal);
    }
}

function loadInitialData() {
    // Load recipient history
    if (window.NotaApp && window.NotaApp.loadRecipientHistory) {
        window.NotaApp.loadRecipientHistory();
    }
    
    // Update database stats
    if (window.NotaApp && window.NotaApp.updateDatabaseStats) {
        window.NotaApp.updateDatabaseStats();
    }
}

function onCompanyChange(event) {
    const companyCode = event.target.value;
    currentCompany = companyCode;
    
    if (companyCode) {
        // Generate receipt number
        generateReceiptNumber(companyCode);
        
        // Show/hide tax fields based on company
        const taxFields = document.getElementById('taxFields');
        const discountFields = document.getElementById('discountFields');
        
        if (companyCode === 'CH') {
            // PT. CHASTE GEMILANG MANDIRI - show tax fields
            if (taxFields) taxFields.style.display = 'flex';
            if (discountFields) discountFields.style.display = 'none';
        } else {
            // Other companies - show discount/DP fields
            if (taxFields) taxFields.style.display = 'none';
            if (discountFields) discountFields.style.display = 'flex';
        }
        
        // Update total calculation
        updateTotal();
    } else {
        // Clear receipt number
        const receiptNumberInput = document.getElementById('receiptNumber');
        if (receiptNumberInput) {
            receiptNumberInput.value = '';
        }
        
        // Hide all special fields
        const taxFields = document.getElementById('taxFields');
        const discountFields = document.getElementById('discountFields');
        
        if (taxFields) taxFields.style.display = 'none';
        if (discountFields) discountFields.style.display = 'none';
    }
}

async function generateReceiptNumber(companyCode) {
    try {
        console.log('Generating receipt number for company:', companyCode);
        
        // Get last receipt number for this company
        const response = await fetch(`/api/receipts?company=${companyCode}`);
        console.log('API response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API data:', data);
        
        let nextNumber = 1;
        if (data.receipts && data.receipts.length > 0) {
            const lastReceipt = data.receipts[0];
            console.log('Last receipt:', lastReceipt);
            
            // Extract number from receipt_number (e.g., "CH00001" -> "00001" -> 1)
            const lastNumberStr = lastReceipt.receipt_number.replace(companyCode, '');
            const lastNumber = parseInt(lastNumberStr);
            console.log('Last number:', lastNumber, 'from string:', lastNumberStr);
            
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }
        
        // Format: CH00001, CR00001, CP00001
        const formattedNumber = `${companyCode}${nextNumber.toString().padStart(5, '0')}`;
        console.log('Generated number:', formattedNumber);
        
        currentReceiptNumber = formattedNumber;
        
        const receiptNumberInput = document.getElementById('receiptNumber');
        if (receiptNumberInput) {
            receiptNumberInput.value = formattedNumber;
            console.log('Receipt number input updated:', receiptNumberInput.value);
        } else {
            console.error('Receipt number input not found');
        }
        
    } catch (error) {
        console.error('Error generating receipt number:', error);
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-5);
        const formattedNumber = `${companyCode}${timestamp}`;
        currentReceiptNumber = formattedNumber;
        
        const receiptNumberInput = document.getElementById('receiptNumber');
        if (receiptNumberInput) {
            receiptNumberInput.value = formattedNumber;
        }
    }
}

function onItemTypeChange(event) {
    const itemType = event.target.value.toLowerCase();
    const sizeInput = document.getElementById('itemSize');
    
    if (sizeInput) {
        if (itemType.includes('terpal')) {
            sizeInput.disabled = false;
            sizeInput.value = ''; // Clear value when enabling
        } else {
            sizeInput.disabled = true;
            sizeInput.value = '-'; // Set default value when disabling
        }
    }
}

function addItem() {
    const quantity = document.getElementById('itemQuantity').value;
    const itemType = document.getElementById('itemType').value;
    const size = document.getElementById('itemSize').value;
    const color = document.getElementById('itemColor').value;
    const unitPrice = parseFloat(document.getElementById('itemUnitPrice').value);
    
    // Validation
    if (!quantity || !itemType || !unitPrice) {
        window.NotaApp.showToast('Semua field harus diisi', 'warning');
        return;
    }
    
    // Calculate total price
    const totalPrice = window.NotaApp.calculateItemTotal(quantity, size, unitPrice);
    
    // Create item object
    const item = {
        id: Date.now(), // Temporary ID
        quantity,
        item_type: itemType,
        size: size || '-',
        color: color || '-',
        unit_price: unitPrice,
        total_price: totalPrice
    };
    
    // Add to items array
    window.items.push(item);
    
    // Update table
    updateItemsTable();
    
    // Update total
    updateTotal();
    
    // Clear form
    clearItemForm();
    
    // Show success message
    window.NotaApp.showToast('Item berhasil ditambahkan', 'success');
}

function updateItemsTable() {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    window.items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.quantity}</td>
            <td>${item.item_type}</td>
            <td>${item.size}</td>
            <td>${item.color}</td>
            <td>${window.NotaApp.formatCurrency(item.unit_price)}</td>
            <td>${window.NotaApp.formatCurrency(item.total_price)}</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function removeItem(index) {
    window.items.splice(index, 1);
    updateItemsTable();
    updateTotal();
    window.NotaApp.showToast('Item berhasil dihapus', 'info');
}

function clearItemForm() {
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemType').value = '';
    document.getElementById('itemSize').value = '';
    document.getElementById('itemColor').value = '';
    document.getElementById('itemUnitPrice').value = '';
}

function updateTotal() {
    // Calculate subtotal
    const subtotal = window.items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Update subtotal display
    const totalBeforeDiscount = document.getElementById('totalBeforeDiscount');
    if (totalBeforeDiscount) {
        totalBeforeDiscount.textContent = window.NotaApp.formatCurrency(subtotal);
    }
    
    if (currentCompany === 'CH') {
        // Tax calculation for CH company
        const dpp = subtotal;
        const ppn = dpp * 0.11;
        
        // Update tax fields
        const dppInput = document.getElementById('dpp');
        const ppnInput = document.getElementById('ppn');
        
        if (dppInput) dppInput.value = dpp;
        if (ppnInput) ppnInput.value = ppn;
        
    } else {
        // Discount and DP calculation for other companies
        const discountInput = document.getElementById('discount');
        const dpInput = document.getElementById('dp');
        const remainingPaymentInput = document.getElementById('remainingPayment');
        
        let discountAmount = 0;
        let totalAfterDiscount = subtotal;
        
        if (discountInput && discountInput.value) {
            const discountValue = discountInput.value;
            
            if (discountValue.includes('%')) {
                // Percentage discount
                const percentage = parseFloat(discountValue.replace('%', ''));
                discountAmount = subtotal * (percentage / 100);
            } else {
                // Fixed amount discount
                discountAmount = parseFloat(discountValue) || 0;
            }
            
            totalAfterDiscount = subtotal - discountAmount;
        }
        
        const dpAmount = dpInput ? (parseFloat(dpInput.value) || 0) : 0;
        const remainingAmount = totalAfterDiscount - dpAmount;
        
        // Update remaining payment input field
        if (remainingPaymentInput) {
            remainingPaymentInput.value = remainingAmount;
        }
        
        // Update discount fields
        const discountRow = document.getElementById('discountRow');
        const totalAfterDiscountRow = document.getElementById('totalAfterDiscountRow');
        const dpRow = document.getElementById('dpRow');
        const remainingRow = document.getElementById('remainingRow');
        
        if (discountRow) discountRow.style.display = 'flex';
        if (totalAfterDiscountRow) totalAfterDiscountRow.style.display = 'flex';
        if (dpRow) dpRow.style.display = 'flex';
        if (remainingRow) remainingRow.style.display = 'flex';
        
        // Update values
        const discountAmountEl = document.getElementById('discountAmount');
        const totalAfterDiscountEl = document.getElementById('totalAfterDiscount');
        const dpAmountEl = document.getElementById('dpAmount');
        const remainingAmountEl = document.getElementById('remainingAmount');
        
        if (discountAmountEl) discountAmountEl.textContent = window.NotaApp.formatCurrency(discountAmount);
        if (totalAfterDiscountEl) totalAfterDiscountEl.textContent = window.NotaApp.formatCurrency(totalAfterDiscount);
        if (dpAmountEl) dpAmountEl.textContent = window.NotaApp.formatCurrency(dpAmount);
        if (remainingAmountEl) remainingAmountEl.textContent = window.NotaApp.formatCurrency(remainingAmount);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    const formData = {
        company_code: document.getElementById('companySelect').value,
        recipient: document.getElementById('recipient').value,
        date: document.getElementById('receiptDate').value
    };
    
    const errors = window.NotaApp.validateForm(formData);
    if (errors.length > 0) {
        window.NotaApp.showToast(errors.join(', '), 'warning');
        return;
    }
    
    // Prepare data
    const receiptData = {
        receipt_number: currentReceiptNumber,
        company_code: formData.company_code,
        company_name: document.getElementById('companySelect').selectedOptions[0].text,
        date: formData.date,
        recipient: formData.recipient,
        total_amount: parseFloat(document.getElementById('remainingAmount').textContent.replace(/[^\d]/g, '')),
        items: window.items
    };
    
    try {
        // Show loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        window.NotaApp.showLoading(submitBtn);
        
        // Send to API
        const response = await fetch('/api/receipts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(receiptData)
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Success
        window.NotaApp.showToast('Nota berhasil disimpan!', 'success');
        
        // Show success modal
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
        
        // Clear form
        clearForm();
        
        // Update stats
        window.NotaApp.updateDatabaseStats();
        
    } catch (error) {
        console.error('Error saving receipt:', error);
        window.NotaApp.showToast(`Error: ${error.message}`, 'danger');
    } finally {
        // Hide loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        window.NotaApp.hideLoading(submitBtn);
    }
}

function clearForm() {
    // Clear form fields
    document.getElementById('companySelect').value = '';
    document.getElementById('receiptNumber').value = '';
    document.getElementById('recipient').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemType').value = '';
    document.getElementById('itemSize').value = '';
    document.getElementById('itemColor').value = '';
    document.getElementById('itemUnitPrice').value = '';
    
    // Clear items
    window.items = [];
    updateItemsTable();
    
    // Reset totals
    updateTotal();
    
    // Hide special fields
    const taxFields = document.getElementById('taxFields');
    const discountFields = document.getElementById('discountFields');
    
    if (taxFields) taxFields.style.display = 'none';
    if (discountFields) discountFields.style.display = 'none';
    
    // Reset company
    currentCompany = '';
    currentReceiptNumber = '';
    
    // Set current date
    const dateInput = document.getElementById('receiptDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}
