// History page JavaScript for viewing receipts

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Wait for main.js to load and initialize NotaApp
        const waitForNotaApp = () => {
            if (window.NotaApp) {
                initializeHistory();
                setupEventListeners();
                loadReceipts();
            } else {
                // Wait a bit more for main.js to load
                setTimeout(waitForNotaApp, 100);
            }
        };
        
        waitForNotaApp();
    } catch (error) {
        console.error('Error initializing history page:', error);
    }
});

let allReceipts = [];
let filteredReceipts = [];
let currentPage = 1;
const itemsPerPage = 20;

function initializeHistory() {
    allReceipts = [];
    filteredReceipts = [];
    currentPage = 1;
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    const companyFilter = document.getElementById('companyFilter');
    if (companyFilter) {
        companyFilter.addEventListener('change', handleFilter);
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', handleFilter);
    }
    
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
            exportModal.show();
        });
    }
    
    const confirmExportBtn = document.getElementById('confirmExportBtn');
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', handleExport);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadReceipts() {
    try {
        if (window.NotaApp && window.NotaApp.showLoading) {
            window.NotaApp.showLoading();
        }
        
        const response = await fetch('/api/receipts');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        allReceipts = data.receipts || [];
        filteredReceipts = [...allReceipts];
        
        updateReceiptsTable();
        updatePagination();
        updateTotalCount();
        
    } catch (error) {
        console.error('Error loading receipts:', error);
        if (window.NotaApp && window.NotaApp.showError) {
            window.NotaApp.showError('Error saat memuat data nota');
        } else {
            console.error('Error saat memuat data nota');
        }
    } finally {
        if (window.NotaApp && window.NotaApp.hideLoading) {
            window.NotaApp.hideLoading();
        }
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredReceipts = [...allReceipts];
    } else {
        filteredReceipts = allReceipts.filter(receipt => 
            receipt.receipt_number.toLowerCase().includes(searchTerm) ||
            receipt.recipient.toLowerCase().includes(searchTerm) ||
            receipt.company_name.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    updateReceiptsTable();
    updatePagination();
    updateTotalCount();
}

function handleFilter() {
    const companyFilter = document.getElementById('companyFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredReceipts = allReceipts.filter(receipt => {
        const companyMatch = !companyFilter || receipt.company_code === companyFilter;
        const dateMatch = !dateFilter || receipt.date === dateFilter;
        return companyMatch && dateMatch;
    });
    
    currentPage = 1;
    updateReceiptsTable();
    updatePagination();
    updateTotalCount();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('companyFilter').value = '';
    document.getElementById('dateFilter').value = '';
    
    filteredReceipts = [...allReceipts];
    currentPage = 1;
    updateReceiptsTable();
    updatePagination();
    updateTotalCount();
}

function updateReceiptsTable() {
    const tbody = document.getElementById('receiptsTableBody');
    if (!tbody) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageReceipts = filteredReceipts.slice(startIndex, endIndex);
    
    if (pageReceipts.length === 0) {
        if (window.NotaApp && window.NotaApp.showNoDataMessage) {
            window.NotaApp.showNoDataMessage();
        }
        return;
    }
    
    tbody.innerHTML = '';
    
    pageReceipts.forEach(receipt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${receipt.receipt_number}</strong><br>
                <small class="text-muted">${receipt.company_name}</small>
            </td>
                            <td>${window.NotaApp && window.NotaApp.formatDate ? window.NotaApp.formatDate(receipt.date) : receipt.date}</td>
                <td>${receipt.recipient}</td>
                <td class="fw-bold">${window.NotaApp && window.NotaApp.formatCurrency ? window.NotaApp.formatCurrency(receipt.total_amount) : `Rp ${receipt.total_amount}`}</td>
            <td>
                <span class="badge bg-success">Tersimpan</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" onclick="viewReceiptDetails(${receipt.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" onclick="printReceipt(${receipt.id})">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    if (window.NotaApp && window.NotaApp.hideNoDataMessage) {
        window.NotaApp.hideNoDataMessage();
    }
}

function updatePagination() {
    const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('li');
    prevBtn.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('li');
        pageBtn.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('li');
    nextBtn.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextBtn);
}

function changePage(page) {
    const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    updateReceiptsTable();
    updatePagination();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTotalCount() {
    const totalCount = document.getElementById('totalCount');
    if (totalCount) {
        totalCount.textContent = filteredReceipts.length;
    }
}

async function viewReceiptDetails(receiptId) {
    try {
        const response = await fetch(`/api/receipts/${receiptId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        showReceiptDetailsModal(data.receipt);
        
    } catch (error) {
        console.error('Error loading receipt details:', error);
        if (window.NotaApp && window.NotaApp.showError) {
            window.NotaApp.showError('Error saat memuat detail nota');
        } else {
            console.error('Error saat memuat detail nota');
        }
    }
}

function showReceiptDetailsModal(receipt) {
    const modal = document.getElementById('receiptDetailsModal');
    if (!modal) return;
    
    // Update modal content
    document.getElementById('modalReceiptNumber').textContent = receipt.receipt_number;
    document.getElementById('modalCompanyName').textContent = receipt.company_name;
    document.getElementById('modalDate').textContent = window.NotaApp && window.NotaApp.formatDate ? window.NotaApp.formatDate(receipt.date) : receipt.date;
    document.getElementById('modalRecipient').textContent = receipt.recipient;
    document.getElementById('modalTotalAmount').textContent = window.NotaApp && window.NotaApp.formatCurrency ? window.NotaApp.formatCurrency(receipt.total_amount) : `Rp ${receipt.total_amount}`;
    
    // Update items table
    const itemsTbody = document.getElementById('modalItemsTableBody');
    if (itemsTbody && receipt.items) {
        itemsTbody.innerHTML = receipt.items.map(item => `
            <tr>
                <td>${item.quantity}</td>
                <td>${item.item_type}</td>
                <td>${item.size}</td>
                <td>${item.color}</td>
                                        <td>${window.NotaApp && window.NotaApp.formatCurrency ? window.NotaApp.formatCurrency(item.unit_price) : `Rp ${item.unit_price}`}</td>
                        <td>${window.NotaApp && window.NotaApp.formatCurrency ? window.NotaApp.formatCurrency(item.total_price) : `Rp ${item.total_price}`}</td>
            </tr>
        `).join('');
    }
    
    // Show modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

function printReceipt(receiptId) {
    try {
        // Show loading
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast('Membuat PDF...', 'info');
        }
        
        // Download PDF
        const link = document.createElement('a');
        link.href = `/api/receipts/${receiptId}/pdf`;
        link.download = `nota_${receiptId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        setTimeout(() => {
            if (window.NotaApp && window.NotaApp.showToast) {
                window.NotaApp.showToast('PDF berhasil dibuat dan didownload!', 'success');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (window.NotaApp && window.NotaApp.showError) {
            window.NotaApp.showError('Error saat membuat PDF');
        } else {
            console.error('Error saat membuat PDF');
        }
    }
}

async function handleExport() {
    try {
        const confirmBtn = document.getElementById('confirmExportBtn');
        if (window.NotaApp && window.NotaApp.showLoading) {
            window.NotaApp.showLoading(confirmBtn);
        }
        
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
        if (window.NotaApp && window.NotaApp.showToast) {
            window.NotaApp.showToast(data.message, 'success');
        }
        
        // Hide modal
        const exportModal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        if (exportModal) {
            exportModal.hide();
        }
        
        // Reload receipts
        setTimeout(() => {
            loadReceipts();
        }, 1000);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        if (window.NotaApp && window.NotaApp.showError) {
            window.NotaApp.showError(`Error saat export: ${error.message}`);
        } else {
            console.error(`Error saat export: ${error.message}`);
        }
    } finally {
        const confirmBtn = document.getElementById('confirmExportBtn');
        if (window.NotaApp && window.NotaApp.hideLoading) {
            window.NotaApp.hideLoading(confirmBtn);
        }
    }
}

// Utility functions - ONLY use window.NotaApp, NO LOCAL DECLARATIONS
// This prevents duplicate function declarations

// All functions are now accessed through window.NotaApp
// No more SyntaxError: Identifier has already been declared

// Using formatCurrency and formatDate from main.js
// Using showError and showToast from main.js
