// Setup page JavaScript for database configuration

document.addEventListener('DOMContentLoaded', () => {
    initializeSetup();
    setupEventListeners();
    loadCurrentConfig();
});

function initializeSetup() {
    // Initialize setup page
    console.log('Setup page initialized');
}

function setupEventListeners() {
    // Configuration form
    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.addEventListener('submit', handleConfigSubmit);
    }
    
    // Test connection button
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', testConnection);
    }
    
    // Copy schema button
    const copySchemaBtn = document.getElementById('copySchemaBtn');
    if (copySchemaBtn) {
        copySchemaBtn.addEventListener('click', copySchemaToClipboard);
    }
}

async function loadCurrentConfig() {
    try {
        // Try to load from localStorage first
        const config = {
            supabaseUrl: localStorage.getItem('supabaseUrl') || '',
            supabaseKey: localStorage.getItem('supabaseKey') || '',
            secretKey: localStorage.getItem('secretKey') || ''
        };
        
        // Update form fields
        updateConfigForm(config);
        
        // Show current configuration
        showCurrentConfig(config);
        
    } catch (error) {
        console.error('Error loading current config:', error);
        showCurrentConfig({ error: 'Error loading configuration' });
    }
}

function updateConfigForm(config) {
    const supabaseUrlInput = document.getElementById('supabaseUrl');
    const supabaseKeyInput = document.getElementById('supabaseKey');
    const secretKeyInput = document.getElementById('secretKey');
    
    if (supabaseUrlInput) supabaseUrlInput.value = config.supabaseUrl || '';
    if (supabaseKeyInput) supabaseKeyInput.value = config.supabaseKey || '';
    if (secretKeyInput) secretKeyInput.value = config.secretKey || '';
}

function showCurrentConfig(config) {
    const currentConfigDiv = document.getElementById('currentConfig');
    if (!currentConfigDiv) return;
    
    if (config.error) {
        currentConfigDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-1"></i>
                ${config.error}
            </div>
        `;
        return;
    }
    
    if (!config.supabaseUrl || !config.supabaseKey) {
        currentConfigDiv.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-1"></i>
                <strong>Konfigurasi belum lengkap!</strong>
                <br>
                Silakan isi Project URL dan Anon Public Key dari Supabase.
            </div>
        `;
        return;
    }
    
    currentConfigDiv.innerHTML = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle me-1"></i>
            <strong>Konfigurasi sudah lengkap!</strong>
        </div>
        <div class="row">
            <div class="col-md-6">
                <small class="text-muted">Project URL:</small>
                <br>
                <code class="text-break">${config.supabaseUrl}</code>
            </div>
            <div class="col-md-6">
                <small class="text-muted">Anon Key:</small>
                <br>
                <code class="text-break">${config.supabaseKey.substring(0, 20)}...</code>
            </div>
        </div>
        <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary" onclick="editConfig()">
                <i class="fas fa-edit me-1"></i>Edit Konfigurasi
            </button>
        </div>
    `;
}

async function handleConfigSubmit(event) {
    event.preventDefault();
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        const config = {
            supabaseUrl: formData.get('supabaseUrl') || formData.get('supabase_url'),
            supabaseKey: formData.get('supabaseKey') || formData.get('supabase_key'),
            secretKey: formData.get('secretKey') || formData.get('secret_key')
        };
        
        // Validation
        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error('Project URL dan Anon Public Key harus diisi');
        }
        
        // Validate URL format
        try {
            new URL(config.supabaseUrl);
        } catch {
            throw new Error('Project URL tidak valid');
        }
        
        // Validate key format (should start with eyJ...)
        if (!config.supabaseKey.startsWith('eyJ')) {
            throw new Error('Anon Public Key tidak valid');
        }
        
        // Save to localStorage
        localStorage.setItem('supabaseUrl', config.supabaseUrl);
        localStorage.setItem('supabaseKey', config.supabaseKey);
        if (config.secretKey) {
            localStorage.setItem('secretKey', config.secretKey);
        }
        
        // Update current config display
        showCurrentConfig(config);
        
        // Show success message
        showSuccessModal('Konfigurasi berhasil disimpan!');
        
        // Hide form
        hideConfigForm();
        
    } catch (error) {
        console.error('Error saving config:', error);
        showErrorModal(`Error: ${error.message}`);
    }
}

function editConfig() {
    showConfigForm();
}

function showConfigForm() {
    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.style.display = 'block';
    }
}

function hideConfigForm() {
    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.style.display = 'none';
    }
}

async function testConnection() {
    try {
        const testBtn = document.getElementById('testConnectionBtn');
        const resultDiv = document.getElementById('connectionResult');
        
        if (!testBtn || !resultDiv) return;
        
        // Show loading
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Testing...';
        
        // Get current config
        const config = {
            supabaseUrl: localStorage.getItem('supabaseUrl'),
            supabaseKey: localStorage.getItem('supabaseKey')
        };
        
        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error('Konfigurasi belum lengkap');
        }
        
        // Test connection by trying to fetch stats
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Success
        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-1"></i>
                <strong>Koneksi berhasil!</strong>
                <br>
                Database dapat diakses dengan baik.
                <br>
                <small class="text-muted">
                    Receipts: ${data.receipts_count || 0} | 
                    Items: ${data.items_count || 0}
                </small>
            </div>
        `;
        resultDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Connection test failed:', error);
        
        const resultDiv = document.getElementById('connectionResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle me-1"></i>
                    <strong>Koneksi gagal!</strong>
                    <br>
                    ${error.message}
                    <br>
                    <small class="text-muted">
                        Pastikan konfigurasi sudah benar dan database Supabase sudah aktif.
                    </small>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
        
    } finally {
        // Reset button
        const testBtn = document.getElementById('testConnectionBtn');
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i class="fas fa-wifi me-1"></i>Test Koneksi Database';
        }
    }
}

function copySchemaToClipboard() {
    const schemaCode = `-- Create receipts table
CREATE TABLE receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(20) NOT NULL,
    company_code VARCHAR(10) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    receipt_id BIGINT REFERENCES receipts(id) ON DELETE CASCADE,
    quantity VARCHAR(50) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_receipts_company_code ON receipts(company_code);
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_created_at ON receipts(created_at);
CREATE INDEX idx_items_receipt_id ON items(receipt_id);

-- Enable Row Level Security (RLS)
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public access to receipts" ON receipts FOR ALL USING (true);
CREATE POLICY "Allow public access to items" ON items FOR ALL USING (true);`;
    
    try {
        navigator.clipboard.writeText(schemaCode).then(() => {
            showToast('SQL script berhasil di-copy ke clipboard!', 'success');
        });
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = schemaCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showToast('SQL script berhasil di-copy ke clipboard!', 'success');
    }
}

function showSuccessModal(message) {
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    const modalBody = document.querySelector('#successModal .modal-body p');
    
    if (modalBody) {
        modalBody.textContent = message;
    }
    
    modal.show();
}

function showErrorModal(message) {
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    const modalBody = document.getElementById('errorMessage');
    
    if (modalBody) {
        modalBody.textContent = message;
    }
    
    modal.show();
}

function showToast(message, type = 'info') {
    if (window.NotaApp && window.NotaApp.showToast) {
        window.NotaApp.showToast(message, type);
    } else {
        // Fallback toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 3000);
    }
}

// Form field mapping for different form structures
function getFormFieldValue(form, fieldName) {
    // Try different possible field names
    const possibleNames = [
        fieldName,
        fieldName.toLowerCase(),
        fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
    ];
    
    for (const name of possibleNames) {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) {
            return field.value;
        }
    }
    
    return '';
}

// Auto-hide config form if config is complete
document.addEventListener('DOMContentLoaded', () => {
    const config = {
        supabaseUrl: localStorage.getItem('supabaseUrl'),
        supabaseKey: localStorage.getItem('supabaseKey')
    };
    
    if (config.supabaseUrl && config.supabaseKey) {
        hideConfigForm();
    }
});
