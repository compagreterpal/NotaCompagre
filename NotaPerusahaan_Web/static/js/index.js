// Index page JavaScript for receipt form

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Wait for main.js to load and initialize NotaApp
        const waitForNotaApp = () => {
            if (window.NotaApp) {
                initializeForm();
                setupEventListeners();
                loadInitialData();
            } else {
                // Wait a bit more for main.js to load
                setTimeout(waitForNotaApp, 100);
            }
        };
        
        waitForNotaApp();
    } catch (error) {
        console.error('Error initializing index page:', error);
    }
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
                if (window.NotaApp && window.NotaApp.exportToExcel) {
                    window.NotaApp.exportToExcel();
                } else {
                    console.error('exportToExcel function not found');
                }
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
    try {
        // Load recipient history
        if (window.NotaApp && window.NotaApp.loadRecipientHistory) {
            window.NotaApp.loadRecipientHistory();
        }
        
        // Update database stats
        if (window.NotaApp && window.NotaApp.updateDatabaseStats) {
            window.NotaApp.updateDatabaseStats();
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

function onCompanyChange(event) {
    try {
        const companyCode = event.target.value;
        currentCompany = companyCode;
        
        if (companyCode) {
            // Generate receipt number safely
            try {
                generateReceiptNumber(companyCode);
            } catch (receiptError) {
                console.warn('Error generating receipt number:', receiptError);
            }
            
            // Show/hide tax fields safely
            try {
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
            } catch (fieldsError) {
                console.warn('Error showing/hiding fields:', fieldsError);
            }
            
            // Update total calculation safely
            try {
                updateTotal();
            } catch (totalError) {
                console.warn('Error updating total:', totalError);
            }
        } else {
            // Clear receipt number safely
            try {
                const receiptNumberInput = document.getElementById('receiptNumber');
                if (receiptNumberInput) {
                    receiptNumberInput.value = '';
                }
            } catch (clearError) {
                console.warn('Error clearing receipt number:', clearError);
            }
            
            // Hide all special fields safely
            try {
                const taxFields = document.getElementById('taxFields');
                const discountFields = document.getElementById('discountFields');
                
                if (taxFields) taxFields.style.display = 'none';
                if (discountFields) discountFields.style.display = 'none';
            } catch (hideError) {
                console.warn('Error hiding fields:', hideError);
            }
        }
        
    } catch (error) {
        console.error('Error in onCompanyChange:', error);
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
    try {
        const itemType = event.target.value.toLowerCase();
        const sizeInput = document.getElementById('itemSize');
        
        if (sizeInput) {
            try {
                if (itemType.includes('terpal')) {
                    sizeInput.disabled = false;
                    sizeInput.value = ''; // Clear value when enabling
                } else {
                    sizeInput.disabled = true;
                    sizeInput.value = '-'; // Set default value when disabling
                }
            } catch (inputError) {
                console.warn('Error updating size input:', inputError);
            }
        }
    } catch (error) {
        console.error('Error in onItemTypeChange:', error);
    }
}

function addItem() {
    try {
        const quantity = document.getElementById('itemQuantity').value;
        const itemType = document.getElementById('itemType').value;
        const size = document.getElementById('itemSize').value;
        const color = document.getElementById('itemColor').value;
        const unitPrice = parseFloat(document.getElementById('itemUnitPrice').value);
        
        // Validation
        if (!quantity || !itemType || !unitPrice) {
            if (window.NotaApp && window.NotaApp.showToast) {
                window.NotaApp.showToast('Semua field harus diisi', 'warning');
            }
            return;
        }
        
        // Calculate total price safely
        let totalPrice = 0;
        if (window.NotaApp && window.NotaApp.calculateItemTotal) {
            totalPrice = window.NotaApp.calculateItemTotal(quantity, size, unitPrice);
        } else {
            // Fallback calculation
            totalPrice = parseFloat(quantity) * parseFloat(unitPrice);
        }
        
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
        
        // Update table safely
        try {
            updateItemsTable();
        } catch (tableError) {
            console.warn('Table update error:', tableError);
        }
        
        // Update total safely
        try {
            updateTotal();
        } catch (totalError) {
            console.warn('Total update error:', totalError);
        }
        
        // Clear form safely
        try {
            clearItemForm();
        } catch (clearError) {
            console.warn('Form clear error:', clearError);
        }
        
        // Show success message safely
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast('Item berhasil ditambahkan', 'success');
        }
        
    } catch (error) {
        console.error('Error in addItem:', error);
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast('Error saat menambah item', 'danger');
        }
    }
}

function updateItemsTable() {
    try {
        const tbody = document.getElementById('itemsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!window.items || !Array.isArray(window.items)) {
            console.warn('Items array is not valid');
            return;
        }
        
        window.items.forEach((item, index) => {
            try {
                const row = document.createElement('tr');
                
                // Safe formatting
                const unitPriceFormatted = window.NotaApp && window.NotaApp.formatCurrency ? 
                    window.NotaApp.formatCurrency(item.unit_price) : 
                    `Rp ${(item.unit_price || 0).toLocaleString('id-ID')}`;
                    
                const totalPriceFormatted = window.NotaApp && window.NotaApp.formatCurrency ? 
                    window.NotaApp.formatCurrency(item.total_price) : 
                    `Rp ${(item.total_price || 0).toLocaleString('id-ID')}`;
                
                row.innerHTML = `
                    <td>${item.quantity || ''}</td>
                    <td>${item.item_type || ''}</td>
                    <td>${item.size || ''}</td>
                    <td>${item.color || ''}</td>
                    <td>${unitPriceFormatted}</td>
                    <td>${totalPriceFormatted}</td>
                    <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            } catch (itemError) {
                console.warn('Error creating item row:', itemError);
            }
        });
    } catch (error) {
        console.error('Error in updateItemsTable:', error);
    }
}

function removeItem(index) {
    try {
        if (!window.items || !Array.isArray(window.items)) {
            console.warn('Items array is not valid');
            return;
        }
        
        if (index < 0 || index >= window.items.length) {
            console.warn('Invalid index:', index);
            return;
        }
        
        window.items.splice(index, 1);
        
        // Update table safely
        try {
            updateItemsTable();
        } catch (tableError) {
            console.warn('Table update error:', tableError);
        }
        
        // Update total safely
        try {
            updateTotal();
        } catch (totalError) {
            console.warn('Total update error:', totalError);
        }
        
        // Show success message safely
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast('Item berhasil dihapus', 'info');
        }
        
    } catch (error) {
        console.error('Error in removeItem:', error);
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast('Error saat menghapus item', 'danger');
        }
    }
}

function clearItemForm() {
    try {
        const fields = [
            'itemQuantity',
            'itemType', 
            'itemSize',
            'itemColor',
            'itemUnitPrice'
        ];
        
        fields.forEach(fieldId => {
            try {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                }
            } catch (fieldError) {
                console.warn(`Error clearing field ${fieldId}:`, fieldError);
            }
        });
        
    } catch (error) {
        console.error('Error in clearItemForm:', error);
    }
}

function updateTotal() {
    try {
        // Calculate subtotal safely
        const subtotal = window.items.reduce((sum, item) => {
            const itemTotal = parseFloat(item.total_price) || 0;
            return sum + itemTotal;
        }, 0);
        
        // Update subtotal display safely
        const totalBeforeDiscount = document.getElementById('totalBeforeDiscount');
        if (totalBeforeDiscount && window.NotaApp.formatCurrency) {
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
        
        // Update summary display safely
        try {
            updateSummaryDisplay(subtotal, discountAmount, totalAfterDiscount, dpAmount, remainingAmount);
        } catch (summaryError) {
            console.warn('Summary display error:', summaryError);
        }
    }
    } catch (error) {
        console.error('Error in updateTotal:', error);
        // Show error but don't break the app
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast('Error saat update total', 'warning');
        }
    }
}

// Function to update summary display safely
function updateSummaryDisplay(subtotal, discountAmount, totalAfterDiscount, dpAmount, remainingAmount) {
    try {
        // Update discount fields
        const discountRow = document.getElementById('discountRow');
        const totalAfterDiscountRow = document.getElementById('totalAfterDiscountRow');
        const dpRow = document.getElementById('dpRow');
        const remainingRow = document.getElementById('remainingRow');
        
        if (discountRow) discountRow.style.display = 'flex';
        if (totalAfterDiscountRow) totalAfterDiscountRow.style.display = 'flex';
        if (dpRow) dpRow.style.display = 'flex';
        if (remainingRow) remainingRow.style.display = 'flex';
        
        // Update values safely
        const discountAmountEl = document.getElementById('discountAmount');
        const totalAfterDiscountEl = document.getElementById('totalAfterDiscount');
        const dpAmountEl = document.getElementById('dpAmount');
        const remainingAmountEl = document.getElementById('remainingAmount');
        
        if (discountAmountEl && window.NotaApp.formatCurrency) {
            discountAmountEl.textContent = window.NotaApp.formatCurrency(discountAmount);
        }
        if (totalAfterDiscountEl && window.NotaApp.formatCurrency) {
            totalAfterDiscountEl.textContent = window.NotaApp.formatCurrency(totalAfterDiscount);
        }
        if (dpAmountEl && window.NotaApp.formatCurrency) {
            dpAmountEl.textContent = window.NotaApp.formatCurrency(dpAmount);
        }
        if (remainingAmountEl && window.NotaApp.formatCurrency) {
            remainingAmountEl.textContent = window.NotaApp.formatCurrency(remainingAmount);
        }
        
    } catch (error) {
        console.error('Error in updateSummaryDisplay:', error);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
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
        
        // Get total amount based on company type
        let totalAmount = 0;
        
        if (currentCompany === 'CH') {
            // For CHASTE company, calculate total with PPN (DPP + PPN)
            const dppInput = document.getElementById('dpp');
            const ppnInput = document.getElementById('ppn');
            
            if (!dppInput || !ppnInput) {
                throw new Error('DPP atau PPN field tidak ditemukan untuk perusahaan CH');
            }
            
            const dpp = parseFloat(dppInput.value) || 0;
            const ppn = parseFloat(ppnInput.value) || 0;
            totalAmount = dpp + ppn;
            
            console.log('🔍 DEBUG CH Company Total:', { dpp, ppn, totalAmount });
            
        } else {
            // For other companies, use remaining payment field
            const remainingPaymentEl = document.getElementById('remainingPayment');
            if (!remainingPaymentEl) {
                throw new Error('Element remainingPayment tidak ditemukan');
            }
            
            // Input field - use value (this is the actual number, not formatted text)
            const currencyText = remainingPaymentEl.value;
            
            console.log('🔍 DEBUG Currency Parsing:', currencyText);
            console.log('🔍 DEBUG Element Type: INPUT (remainingPayment)');
            
            // Handle both formats: "24000" and "Rp 24.000,00"
            let cleanText;
            if (currencyText.includes('Rp')) {
                // Format: "Rp 24.000,00" - remove "Rp " and replace dots
                cleanText = currencyText.replace('Rp ', '').replace(/\./g, '').replace(',', '.');
                console.log('🔍 DEBUG After Rp removal:', cleanText);
            } else {
                // Format: "24000" - already clean
                cleanText = currencyText;
            }
            
            // Additional safety check - remove any remaining non-numeric characters except decimal point
            cleanText = cleanText.replace(/[^\d.]/g, '');
            console.log('🔍 DEBUG After final cleanup:', cleanText);
            
            console.log('🔍 DEBUG Clean Text:', cleanText);
            
            totalAmount = parseFloat(cleanText);
            console.log('🔍 DEBUG Parsed Amount:', totalAmount);
        }
        
        if (isNaN(totalAmount) || totalAmount <= 0) {
            throw new Error(`Total amount tidak valid: ${totalAmount}`);
        }
        
        // Get address
        const address = document.getElementById('address').value;
        
        // Prepare data
        const receiptData = {
            receipt_number: currentReceiptNumber,
            company_code: formData.company_code,
            company_name: document.getElementById('companySelect').selectedOptions[0].text,
            date: formData.date,
            recipient: formData.recipient,
            address: address,
            total_amount: totalAmount,
            items: window.items
        };
        
        // Show loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            window.NotaApp.showLoading(submitBtn);
        }
        
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
        
        // Show success modal safely
        try {
            const successModalEl = document.getElementById('successModal');
            if (successModalEl) {
                const successModal = new bootstrap.Modal(successModalEl);
                successModal.show();
            }
        } catch (modalError) {
            console.warn('Modal error:', modalError);
            // Continue without modal
        }
        
        // Clear form
        clearForm();
        
        // Update stats safely
        try {
            if (window.NotaApp.updateDatabaseStats) {
                window.NotaApp.updateDatabaseStats();
            }
        } catch (statsError) {
            console.warn('Stats update error:', statsError);
        }
        
    } catch (error) {
        console.error('Error saving receipt:', error);
        window.NotaApp.showToast(`Error: ${error.message}`, 'danger');
    } finally {
        // Hide loading safely
        try {
            const submitBtn = event.target.querySelector('button[type="submit"]');
            if (submitBtn && window.NotaApp.hideLoading) {
                window.NotaApp.hideLoading(submitBtn);
            }
        } catch (loadingError) {
            console.warn('Loading hide error:', loadingError);
        }
    }
}

function clearForm() {
    try {
        // Clear form fields safely
        const fields = [
            'companySelect',
            'receiptNumber',
            'recipient',
            'address',
            'itemQuantity',
            'itemType',
            'itemSize',
            'itemColor',
            'itemUnitPrice'
        ];
        
        fields.forEach(fieldId => {
            try {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                }
            } catch (fieldError) {
                console.warn(`Error clearing field ${fieldId}:`, fieldError);
            }
        });
        
        // Clear items safely
        try {
            window.items = [];
        } catch (itemsError) {
            console.warn('Error clearing items:', itemsError);
        }
        
        // Update table safely
        try {
            updateItemsTable();
        } catch (tableError) {
            console.warn('Table update error:', tableError);
        }
        
        // Reset totals safely
        try {
            updateTotal();
        } catch (totalError) {
            console.warn('Total update error:', totalError);
        }
        
        // Hide special fields safely
        try {
            const taxFields = document.getElementById('taxFields');
            const discountFields = document.getElementById('discountFields');
            
            if (taxFields) taxFields.style.display = 'none';
            if (discountFields) discountFields.style.display = 'none';
        } catch (fieldsError) {
            console.warn('Error hiding fields:', fieldsError);
        }
        
        // Reset company safely
        try {
            currentCompany = '';
            currentReceiptNumber = '';
        } catch (resetError) {
            console.warn('Error resetting company:', resetError);
        }
        
        // Set current date safely
        try {
            const dateInput = document.getElementById('receiptDate');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        } catch (dateError) {
            console.warn('Error setting date:', dateError);
        }
        
    } catch (error) {
        console.error('Error in clearForm:', error);
    }
}
