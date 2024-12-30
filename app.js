// Constants
const MIN_WLD = 3;
const WALLET_ADDRESS = '0x32738053b17601aba6d6941e4c870129f3c4f371';
const COMMISSION = 2000; // Comisión fija en COP

// DOM Elements
const wldInput = document.getElementById('wldAmount');
const copAmount = document.getElementById('copAmount');
const bankSelect = document.getElementById('bankSelect');
const continueBtn = document.getElementById('continueBtn');
const backBtn = document.getElementById('backBtn');
const finalizeBtn = document.getElementById('finalizeBtn');
const homeBtn = document.getElementById('homeBtn');
const steps = document.querySelectorAll('.step');
const stepContents = document.querySelectorAll('.step-content');
const phoneLabel = document.getElementById('phoneLabel');
const accountTypeGroup = document.getElementById('accountTypeGroup');
const accountNumberGroup = document.getElementById('accountNumberGroup');
const finalAmount = document.getElementById('finalAmount');
const walletAddress = document.getElementById('walletAddress');
const copyAddressBtn = document.getElementById('copyAddress');
const qrCodeElement = document.getElementById('qrCode');

// Campos del formulario
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const documentInput = document.getElementById('documentNumber');
const accountTypeSelect = document.getElementById('accountType');
const accountNumberInput = document.getElementById('accountNumber');

// Initialize price data
let wldPrice = 0;
let usdtCopPrice = 0;

// Función para obtener el precio de WLD/USDT de Binance
async function getWLDPrice() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=WLDUSDT');
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error('Error al obtener precio WLD:', error);
        return null;
    }
}

// Función para obtener el precio de USDT/COP de Binance
async function getUSDTCOPPrice() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTCOP');
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        // Si no hay par USDT/COP directo, podemos usar un valor aproximado
        return 4000; // Valor aproximado USDT/COP
    }
}

// Función para actualizar precios
async function updatePrices() {
    const newWldPrice = await getWLDPrice();
    const newUsdtCopPrice = await getUSDTCOPPrice();
    
    if (newWldPrice && newUsdtCopPrice) {
        wldPrice = newWldPrice;
        usdtCopPrice = newUsdtCopPrice;
        updateCOPAmount(); // Actualizar el monto si hay un valor en el input
    }
}

// Actualizar precios cada 10 segundos
const priceUpdateInterval = setInterval(updatePrices, 10000);
// Actualizar precios inmediatamente al cargar
updatePrices();

// Initialize QR Code when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Generar el QR con la dirección de la wallet
    const qrCode = new QRCode(document.getElementById('qrCode'), {
        text: WALLET_ADDRESS,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Mostrar la dirección de la wallet
    const walletAddressElement = document.getElementById('walletAddress');
    walletAddressElement.textContent = WALLET_ADDRESS;
});

// Función para validar el email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar el teléfono (10 dígitos)
function isValidPhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
}

// Función para validar el documento (solo números, mínimo 8 caracteres)
function isValidDocument(document) {
    const documentRegex = /^\d{8,}$/;
    return documentRegex.test(document);
}

// Función para validar el formulario
function validateForm() {
    const selectedBank = bankSelect.value;
    
    // Validar campos básicos
    if (!fullNameInput.value.trim() || !emailInput.value.trim() || !phoneInput.value.trim() || !documentInput.value.trim()) {
        return false;
    }

    // Validar formato de email
    if (!isValidEmail(emailInput.value.trim())) {
        return false;
    }

    // Validar formato de teléfono
    if (!isValidPhone(phoneInput.value.trim())) {
        return false;
    }

    // Validar formato de documento
    if (!isValidDocument(documentInput.value.trim())) {
        return false;
    }

    // Si es banco tradicional, validar campos adicionales
    if (selectedBank !== 'NEQUI' && selectedBank !== 'DAVIPLATA') {
        if (!accountNumberInput.value.trim()) {
            return false;
        }
    }

    return true;
}

// Event Listeners para validación en tiempo real
[fullNameInput, emailInput, phoneInput, documentInput, accountNumberInput].forEach(input => {
    if (input) {
        input.addEventListener('input', () => {
            // Si es el campo de documento, forzar solo números
            if (input === documentInput) {
                input.value = input.value.replace(/\D/g, '');
            }
            finalizeBtn.disabled = !validateForm();
            finalizeBtn.classList.toggle('disabled', !validateForm());
        });
    }
});

// Event Listeners
wldInput.addEventListener('input', updateCOPAmount);
bankSelect.addEventListener('change', () => {
    updateFormFields();
    finalizeBtn.disabled = !validateForm();
    finalizeBtn.classList.toggle('disabled', !validateForm());
});
continueBtn.addEventListener('click', () => goToStep(2));
backBtn.addEventListener('click', () => goToStep(1));
finalizeBtn.addEventListener('click', () => {
    if (validateForm()) {
        goToStep(3);
    }
});
homeBtn.addEventListener('click', () => {
    // Limpiar los campos
    wldInput.value = '';
    copAmount.textContent = '0';
    finalAmount.textContent = '0';
    bankSelect.selectedIndex = 0;
    
    // Volver al paso 1
    goToStep(1);
    
    // Reiniciar las actualizaciones de precio
    updatePrices();
    priceUpdateInterval = setInterval(updatePrices, 10000);
});
copyAddressBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(WALLET_ADDRESS)
        .then(() => {
            copyAddressBtn.textContent = '¡Copiado!';
            setTimeout(() => {
                copyAddressBtn.textContent = 'Copiar';
            }, 2000);
        })
        .catch(err => {
            console.error('Error al copiar:', err);
        });
});

// Functions
async function updateCOPAmount() {
    const wldValue = parseFloat(wldInput.value) || 0;
    if (wldPrice && usdtCopPrice) {
        // Calcular el valor en COP: WLD -> USDT -> COP
        const usdtValue = wldValue * wldPrice;
        const copValue = usdtValue * usdtCopPrice;
        // Restar la comisión por cada WLD
        const totalCommission = COMMISSION * wldValue;
        const finalCopValue = copValue - totalCommission;
        
        copAmount.textContent = formatCurrency(finalCopValue);
        
        // Solo actualizar el monto final si no estamos en el paso 3
        if (!document.getElementById('step3').classList.contains('active')) {
            finalAmount.textContent = formatCurrency(finalCopValue);
        }

        // Habilitar o deshabilitar el botón continuar según el monto
        continueBtn.disabled = wldValue < MIN_WLD;
        
        // Actualizar el estilo del botón
        if (wldValue < MIN_WLD) {
            continueBtn.classList.add('disabled');
            document.querySelector('.min-amount-warning').style.display = 'block';
        } else {
            continueBtn.classList.remove('disabled');
            document.querySelector('.min-amount-warning').style.display = 'none';
        }
    }
}

function formatCurrency(value) {
    return Math.round(value).toLocaleString('es-CO');
}

function updateFormFields() {
    const selectedBank = bankSelect.value;
    const phoneLabel = document.getElementById('phoneLabel');
    const accountTypeGroup = document.getElementById('accountTypeGroup');
    const accountNumberGroup = document.getElementById('accountNumberGroup');

    // Resetear todos los campos primero
    phoneLabel.textContent = 'Teléfono';
    accountTypeGroup.style.display = 'block';
    accountNumberGroup.style.display = 'block';

    switch(selectedBank) {
        case 'NEQUI':
            phoneLabel.textContent = 'Teléfono Nequi';
            accountTypeGroup.style.display = 'none';
            accountNumberGroup.style.display = 'none';
            break;
        case 'DAVIPLATA':
            phoneLabel.textContent = 'Teléfono Daviplata';
            accountTypeGroup.style.display = 'none';
            accountNumberGroup.style.display = 'none';
            break;
        default:
            phoneLabel.textContent = 'Teléfono';
            accountTypeGroup.style.display = 'block';
            accountNumberGroup.style.display = 'block';
    }
}

function goToStep(stepNumber) {
    // Ocultar todos los pasos
    stepContents.forEach(content => content.classList.remove('active'));
    steps.forEach(step => step.classList.remove('active'));

    // Mostrar el paso actual
    document.getElementById(`step${stepNumber}`).classList.add('active');
    for (let i = 1; i <= stepNumber; i++) {
        steps[i-1].classList.add('active');
    }

    // Si vamos al paso 3, guardar el precio actual como fijo
    if (stepNumber === 3) {
        const currentAmount = copAmount.textContent;
        finalAmount.textContent = currentAmount;
        // Detener las actualizaciones de precio
        clearInterval(priceUpdateInterval);
    }
}

// Initialize form fields
updateFormFields();
