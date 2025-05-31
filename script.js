document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('item-input');
    const priceInput = document.getElementById('price-input');
    const addButton = document.getElementById('add-button');
    const scanButton = document.getElementById('scan-button');
    const shoppingList = document.getElementById('shopping-list');
    const viewport = document.getElementById('interactive');
    const totalAmount = document.getElementById('total-amount');
    let isScanning = false;
    let editingItemIndex = null;

    // Yerel depolamadan kayıtlı listeyi yükle
    let items = JSON.parse(localStorage.getItem('shoppingList')) || [];

    // Toplam tutarı hesapla ve göster
    function updateTotal() {
        const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        totalAmount.textContent = total.toFixed(2);
    }

    // Listeyi güncelle
    function updateList() {
        shoppingList.innerHTML = '';
        items.forEach((item, index) => {
            const li = document.createElement('li');
            const itemText = document.createElement('span');
            itemText.className = 'item-text';
            
            // Ürün adı ve barkod
            let displayText = item.name || item;
            if (item.barcode) {
                displayText += ` (Barkod: ${item.barcode})`;
            }
            // Fiyat bilgisi
            if (item.price) {
                displayText += `<span class="item-price">${parseFloat(item.price).toFixed(2)} TL</span>`;
            }
            
            itemText.innerHTML = displayText;
            
            // Çift tıklama ile düzenleme
            itemText.addEventListener('dblclick', () => startEditing(index));
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            
            const priceBtn = document.createElement('button');
            priceBtn.className = 'barcode-button';
            priceBtn.textContent = 'Fiyat Düzenle';
            priceBtn.onclick = () => editPrice(index);
            
            const barcodeBtn = document.createElement('button');
            barcodeBtn.className = 'barcode-button';
            barcodeBtn.textContent = 'Barkod Ekle';
            barcodeBtn.onclick = () => addBarcodeToItem(index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.textContent = 'Sil';
            deleteBtn.onclick = () => deleteItem(index);
            
            buttonContainer.appendChild(priceBtn);
            buttonContainer.appendChild(barcodeBtn);
            buttonContainer.appendChild(deleteBtn);
            
            li.appendChild(itemText);
            li.appendChild(buttonContainer);
            shoppingList.appendChild(li);
        });
        updateTotal();
        saveToLocalStorage();
    }

    // Fiyat düzenleme
    function editPrice(index) {
        const item = items[index];
        const currentPrice = item.price || 0;
        const newPrice = prompt('Yeni fiyatı girin:', currentPrice);
        
        if (newPrice !== null) {
            const parsedPrice = parseFloat(newPrice);
            if (!isNaN(parsedPrice) && parsedPrice >= 0) {
                if (typeof item === 'object') {
                    item.price = parsedPrice;
                } else {
                    items[index] = {
                        name: item,
                        price: parsedPrice
                    };
                }
                updateList();
            } else {
                alert('Lütfen geçerli bir fiyat girin!');
            }
        }
    }

    // Düzenleme modunu başlat
    function startEditing(index) {
        const itemSpan = shoppingList.children[index].querySelector('.item-text');
        const currentText = items[index].name || items[index];
        itemSpan.innerHTML = `<input type="text" class="edit-input" value="${currentText}">`;
        const input = itemSpan.querySelector('input');
        input.focus();
        
        input.addEventListener('blur', () => finishEditing(index, input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }

    // Düzenlemeyi bitir
    function finishEditing(index, input) {
        const newValue = input.value.trim();
        if (newValue && newValue !== (items[index].name || items[index])) {
            if (typeof items[index] === 'object') {
                items[index].name = newValue;
            } else {
                const price = 0;
                items[index] = {
                    name: newValue,
                    price: price
                };
            }
            updateList();
        } else {
            updateList();
        }
    }

    // Ürüne barkod ekle
    function addBarcodeToItem(index) {
        editingItemIndex = index;
        startScanning(true);
    }

    // Yerel depolamaya kaydet
    function saveToLocalStorage() {
        localStorage.setItem('shoppingList', JSON.stringify(items));
    }

    // Yeni öğe ekle
    function addItem() {
        const newItemName = itemInput.value.trim();
        const newItemPrice = parseFloat(priceInput.value) || 0;
        
        if (newItemName) {
            items.push({
                name: newItemName,
                price: newItemPrice
            });
            itemInput.value = '';
            priceInput.value = '';
            updateList();
        }
    }

    // Öğe sil
    function deleteItem(index) {
        items.splice(index, 1);
        updateList();
    }

    // Barkod taramayı başlat
    function startScanning(isAddingToExisting = false) {
        if (isScanning) {
            Quagga.stop();
            viewport.classList.remove('active');
            isScanning = false;
            scanButton.textContent = 'Barkod Tara';
            return;
        }

        viewport.classList.add('active');
        isScanning = true;
        scanButton.textContent = 'Taramayı Durdur';

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: viewport,
                constraints: {
                    facingMode: "environment"
                },
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader"]
            }
        }, function(err) {
            if (err) {
                console.error(err);
                alert('Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin.');
                return;
            }
            Quagga.start();
        });
    }

    // Barkod algılandığında
    Quagga.onDetected(function(result) {
        if (result.codeResult.code) {
            const barcode = result.codeResult.code;
            
            if (editingItemIndex !== null) {
                // Mevcut ürüne barkod ekleme
                const item = items[editingItemIndex];
                if (typeof item === 'object') {
                    item.barcode = barcode;
                } else {
                    items[editingItemIndex] = {
                        name: item,
                        barcode: barcode,
                        price: 0
                    };
                }
                editingItemIndex = null;
            } else {
                // Yeni ürün için barkod
                itemInput.value = `Ürün (Barkod: ${barcode})`;
            }
            
            Quagga.stop();
            viewport.classList.remove('active');
            isScanning = false;
            scanButton.textContent = 'Barkod Tara';
            updateList();
        }
    });

    // Event listeners
    addButton.addEventListener('click', addItem);
    scanButton.addEventListener('click', () => startScanning(false));
    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && priceInput.value) {
            addItem();
        }
    });
    priceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && itemInput.value) {
            addItem();
        }
    });

    // İlk yükleme
    updateList();
});
